import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import {
  ExamQuestion,
  ExamParams,
  ExamPayload,
  ExamResult,
  ExamAnswer
} from '../models';
import { QuestionBankService } from './question-bank.service';
import { TimerService } from './timer.service';
import { ConfigService } from './config.service';
import { SupabaseService } from './supabase.service';

/**
 * Estados posibles del examen
 */
export type ExamStatus = 'idle' | 'running' | 'paused' | 'submitted' | 'completed';

/**
 * Progreso del examen
 */
export interface ExamProgress {
  answered: number;
  flagged: number;
  total: number;
  percentage: number;
}

/**
 * Estado de navegación del examen
 */
export interface ExamNavigation {
  canGoPrevious: boolean;
  canGoNext: boolean;
  isFirst: boolean;
  isLast: boolean;
  current: number;
  total: number;
}

/**
 * Estado del temporizador del examen
 */
export interface ExamTimerState {
  remainingTime: number;
  formattedTime: string;
  isRunning: boolean;
  isPaused: boolean;
}

/**
 * Servicio de estado del examen
 * Maneja todo el flujo del examen usando signals y RxJS
 */
@Injectable({
  providedIn: 'root'
})
export class ExamStateService {

  // Inyección de dependencias
  private questionBank = inject(QuestionBankService);
  private timer = inject(TimerService);
  private config = inject(ConfigService);
  private router = inject(Router);
  private supabase = inject(SupabaseService);

  // Signals para el estado del examen
  private _status = signal<ExamStatus>('idle');
  private _examId = signal<string>('');
  private _questions = signal<ExamQuestion[]>([]);
  private _currentIndex = signal<number>(0);
  private _examParams = signal<ExamParams | null>(null);
  private _examResult = signal<ExamResult | null>(null);
  private _isLoading = signal<boolean>(false);
  private _error = signal<string | null>(null);
  private _timeWarning = signal<boolean>(false);

  /**
   * Signal de estado del examen
   */
  get status() {
    return this._status.asReadonly();
  }

  /**
   * Signal del ID del examen
   */
  get examId() {
    return this._examId.asReadonly();
  }

  /**
   * Signal de las preguntas del examen
   */
  get questions() {
    return this._questions.asReadonly();
  }

  /**
   * Signal del índice actual
   */
  get currentIndex() {
    return this._currentIndex.asReadonly();
  }

  /**
   * Signal de los parámetros del examen
   */
  get examParams() {
    return this._examParams.asReadonly();
  }

  /**
   * Signal del resultado del examen
   */
  get examResult() {
    return this._examResult.asReadonly();
  }

  /**
   * Signal de carga
   */
  get isLoading() {
    return this._isLoading.asReadonly();
  }

  /**
   * Signal de error
   */
  get error() {
    return this._error.asReadonly();
  }

  /**
   * Signal que indica si se ha emitido la advertencia de tiempo (quedan pocos minutos)
   */
  get timeWarning() {
    return this._timeWarning.asReadonly();
  }

  /**
   * Signal computado de la pregunta actual
   */
  readonly currentQuestion = computed(() => {
    const questions = this._questions();
    const index = this._currentIndex();
    return questions[index] || null;
  });

  /**
   * Signal computado del progreso
   */
  readonly progress = computed<ExamProgress>(() => {
    const questions = this._questions();
    const answered = questions.filter(q => q.selectedOptionId).length;
    const flagged = questions.filter(q => q.flagged).length;
    const total = questions.length;

    return {
      answered,
      flagged,
      total,
      percentage: total > 0 ? Math.round((answered / total) * 100) : 0
    };
  });

  /**
   * Signal computado de navegación
   */
  readonly navigation = computed<ExamNavigation>(() => {
    const index = this._currentIndex();
    const total = this._questions().length;

    return {
      canGoPrevious: index > 0,
      canGoNext: index < total - 1,
      isFirst: index === 0,
      isLast: index === total - 1,
      current: index + 1,
      total
    };
  });

  /**
   * Observable combinado del estado del examen
   */
  get examState$(): Observable<{
    status: ExamStatus;
    currentQuestion: ExamQuestion | null;
    progress: ExamProgress;
    navigation: ExamNavigation;
    timer: ExamTimerState;
  }> {
    return this.timer.remainingTime$.pipe(
      map(remainingTime => ({
        status: this._status(),
        currentQuestion: this.currentQuestion(),
        progress: this.progress(),
        navigation: this.navigation(),
        timer: {
          remainingTime,
          formattedTime: this.timer.formatTime(remainingTime),
          isRunning: this.timer.isRunning(),
          isPaused: this.timer.isPaused()
        }
      }))
    );
  }

  /**
   * Inicia un nuevo examen
   * @param params Parámetros del examen
   */
  startExam(params: ExamParams): Observable<{ examId: string; questions: ExamQuestion[]; durationSec: number }> {
    this._isLoading.set(true);
    this._error.set(null);

    return this.questionBank.getQuestions(params).pipe(
      tap(result => {
        this._examId.set(result.examId);
        this._questions.set(result.questions);
        this._currentIndex.set(0);
        this._examParams.set(params);
        this._status.set('running');
        this._isLoading.set(false);

        // Iniciar temporizador
        this.timer.start(
          result.durationSec,
          () => this._handleTimeUp(),
          () => this._handleTimeWarning()
        );

        // Cargar progreso guardado
        this._loadProgress();
      }),
      map(result => result), // Retornar el resultado
      catchError(error => {
        this._error.set('Error al iniciar el examen');
        this._isLoading.set(false);
        console.error('Error iniciando examen:', error);
        throw error;
      })
    );
  }

  /**
   * Selecciona una opción para la pregunta actual
   * @param optionId ID de la opción seleccionada
   */
  selectOption(optionId: string): void {
    const currentIndex = this._currentIndex();
    const questions = this._questions();

    if (currentIndex >= 0 && currentIndex < questions.length) {
      const updatedQuestions = [...questions];
      updatedQuestions[currentIndex] = {
        ...updatedQuestions[currentIndex],
        selectedOptionId: optionId
      };

      this._questions.set(updatedQuestions);
      this._saveProgress();
    }
  }

  /**
   * Marca/desmarca la pregunta actual para revisar
   */
  toggleFlag(): void {
    const currentIndex = this._currentIndex();
    const questions = this._questions();

    if (currentIndex >= 0 && currentIndex < questions.length) {
      const updatedQuestions = [...questions];
      updatedQuestions[currentIndex] = {
        ...updatedQuestions[currentIndex],
        flagged: !updatedQuestions[currentIndex].flagged
      };

      this._questions.set(updatedQuestions);
      this._saveProgress();
    }
  }

  /**
   * Navega a la siguiente pregunta
   */
  next(): void {
    const navigation = this.navigation();
    if (navigation.canGoNext) {
      this._currentIndex.set(this._currentIndex() + 1);
      this._saveProgress();
    }
  }

  /**
   * Navega a la pregunta anterior
   */
  previous(): void {
    const navigation = this.navigation();
    if (navigation.canGoPrevious) {
      this._currentIndex.set(this._currentIndex() - 1);
      this._saveProgress();
    }
  }

  /**
   * Navega a una pregunta específica
   * @param index Índice de la pregunta (0-based)
   */
  goToQuestion(index: number): void {
    const questions = this._questions();
    if (index >= 0 && index < questions.length) {
      this._currentIndex.set(index);
      this._saveProgress();
    }
  }

  /**
   * Pausa el examen
   */
  pauseExam(): void {
    if (this._status() === 'running') {
      this.timer.pause();
      this._status.set('paused');
    }
  }

  /**
   * Reanuda el examen
   */
  resumeExam(): void {
    if (this._status() === 'paused') {
      this.timer.resume();
      this._status.set('running');
    }
  }

  /**
   * Envía el examen para evaluación
   */
  submitExam(): Observable<ExamResult> {
    if (this._status() !== 'running' && this._status() !== 'paused') {
      throw new Error('No hay un examen activo para enviar');
    }

    this._isLoading.set(true);
    this._status.set('submitted');

    // Detener temporizador
    this.timer.stop();

    // Crear payload de respuestas
    const payload: ExamPayload = {
      examId: this._examId(),
      answers: this._createAnswersPayload(),
      submittedAt: new Date(),
      totalTimeSpent: this.timer.totalSeconds() - this.timer.remainingSeconds()
    };

    return this.questionBank.validate(payload).pipe(
      tap(result => {
        this._examResult.set(result);
        this._status.set('completed');
        this._isLoading.set(false);

        // Guardar resultado
        this._saveResult(result);
      }),
      catchError(error => {
        this._error.set('Error al enviar el examen');
        this._isLoading.set(false);
        this._status.set('running'); // Revertir estado
        console.error('Error enviando examen:', error);
        throw error;
      })
    );
  }

  /**
   * Reinicia el examen
   */
  resetExam(): void {
    this.timer.stop();
    this._status.set('idle');
    this._examId.set('');
    this._questions.set([]);
    this._currentIndex.set(0);
    this._examParams.set(null);
    this._examResult.set(null);
    this._error.set(null);
    this._timeWarning.set(false);
    this._clearProgress();
  }

  /**
   * Obtiene el estado actual del examen
   */
  getState(): {
    status: ExamStatus;
    examId: string;
    questions: ExamQuestion[];
    currentIndex: number;
    progress: ExamProgress;
    navigation: ExamNavigation;
    timer: {
      isRunning: boolean;
      isPaused: boolean;
      remainingSeconds: number;
      totalSeconds: number;
      formattedTime: string;
      progressPercentage: number;
    };
  } {
    return {
      status: this._status(),
      examId: this._examId(),
      questions: this._questions(),
      currentIndex: this._currentIndex(),
      progress: this.progress(),
      navigation: this.navigation(),
      timer: this.timer.getState()
    };
  }

  /**
   * Maneja cuando se agota el tiempo
   */
  private _handleTimeUp(): void {
    this.submitExam().subscribe({
      next: () => {
        this.router.navigate(['/exam/review']);
      },
      error: (error) => {
        console.error('Error en envio automatico:', error);
        this.router.navigate(['/exam/review']);
      }
    });
  }

  /**
   * Maneja la advertencia de tiempo.
   * Emite el signal timeWarning para que los componentes puedan reaccionar.
   */
  private _handleTimeWarning(): void {
    this._timeWarning.set(true);
  }

  /**
   * Crea el payload de respuestas
   */
  private _createAnswersPayload(): ExamAnswer[] {
    return this._questions().map(question => ({
      questionId: question.id,
      optionId: question.selectedOptionId || '',
      flagged: question.flagged || false,
      timeSpent: question.timeSpent || 0
    }));
  }

  /**
   * Guarda el progreso en sessionStorage
   */
  private _saveProgress(): void {
    if (this._status() === 'idle') return;

    const progress = {
      examId: this._examId(),
      currentIndex: this._currentIndex(),
      questions: this._questions(),
      remainingTime: this.timer.remainingSeconds(),
      timestamp: Date.now()
    };

    try {
      sessionStorage.setItem(
        this.config.storageKeys.EXAM_PROGRESS,
        JSON.stringify(progress)
      );
    } catch (error) {
      console.error('No se pudo guardar el progreso:', error);
    }
  }

  /**
   * Carga el progreso desde sessionStorage
   */
  private _loadProgress(): void {
    try {
      const saved = sessionStorage.getItem(this.config.storageKeys.EXAM_PROGRESS);
      if (saved) {
        const progress = JSON.parse(saved);

        // Verificar que sea del mismo examen
        if (progress.examId === this._examId()) {
          this._currentIndex.set(progress.currentIndex);
          this._questions.set(progress.questions);

          // Ajustar tiempo restante
          if (progress.remainingTime > 0) {
            this.timer.addTime(progress.remainingTime - this.timer.remainingSeconds());
          }

        }
      }
    } catch (error) {
      console.error('No se pudo cargar el progreso:', error);
    }
  }

  /**
   * Limpia el progreso guardado
   */
  private _clearProgress(): void {
    try {
      sessionStorage.removeItem(this.config.storageKeys.EXAM_PROGRESS);
    } catch (error) {
      console.error('No se pudo limpiar el progreso:', error);
    }
  }

  /**
   * Guarda el resultado del examen
   */
  private _saveResult(result: ExamResult): void {
    try {
      const lastResults = JSON.parse(
        localStorage.getItem(this.config.storageKeys.LAST_RESULTS) || '[]'
      );

      lastResults.unshift({
        examId: result.examId,
        score: result.score,
        completedAt: result.completedAt,
        summary: result.summary
      });

      // Mantener solo los últimos 10 resultados
      const limitedResults = lastResults.slice(0, 10);

      localStorage.setItem(
        this.config.storageKeys.LAST_RESULTS,
        JSON.stringify(limitedResults)
      );

    } catch (error) {
      console.error('No se pudo guardar el resultado:', error);
    }

    // Fire-and-forget: persist to Supabase
    try {
      this.supabase.saveExamResult(result).catch(err =>
        console.error('[ExamStateService] Supabase saveExamResult error:', err)
      );
    } catch (err) {
      console.error('[ExamStateService] Supabase saveExamResult error:', err);
    }
  }
}
