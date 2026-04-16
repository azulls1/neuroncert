import { Injectable, inject } from '@angular/core';
import { Observable, of, from, forkJoin } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import {
  Question,
  ExamQuestion,
  ExamParams,
  ExamPayload,
  ExamResult,
  ExamItemResult,
  ExamSummary,
  CCAFDomain,
} from '../models';
import { QuestionLoaderService } from './question-loader.service';
import { SupabaseService } from './supabase.service';
import { shuffleArray } from '../utils/exam.utils';

/**
 * Servicio de banco de preguntas
 * Filtra, selecciona y valida preguntas para examenes.
 * Delega la carga HTTP y cache a QuestionLoaderService.
 */
@Injectable({
  providedIn: 'root',
})
export class QuestionBankService {
  private loader = inject(QuestionLoaderService);
  private supabase = inject(SupabaseService);

  /** Mapa de preguntas indexadas por ID (para validacion rapida) */
  private questionsById = new Map<string, Question>();

  // ---------------------------------------------------------------------------
  // API publica — contrato consumido por ExamStateService
  // ---------------------------------------------------------------------------

  /**
   * Obtiene preguntas segun los parametros del examen.
   * Carga los archivos JSON necesarios, filtra, mezcla y devuelve el set.
   */
  getQuestions(params: ExamParams): Observable<{
    examId: string;
    questions: ExamQuestion[];
    durationSec: number;
  }> {
    if (params.mode === 'ccaf') {
      return this.getCCAFExamQuestions(params);
    }

    // Modo standard / practice / study
    const trackSource = params.trackId
      ? this.getQuestionsByTrack(params.trackId)
      : this.loader.loadQuestionFile('assets/question-bank/academy/foundation/claude-101.json');

    return trackSource.pipe(
      map((questions) => {
        let filtered = this._filterQuestions(questions, params);

        // Mezclar y seleccionar la cantidad solicitada
        filtered = this._shuffleArray(filtered);
        const selected = filtered.slice(0, params.count);

        // Indexar para validacion posterior
        selected.forEach((q) => this.questionsById.set(q.id, q));

        const examQuestions: ExamQuestion[] = selected.map((q) => ({
          ...q,
          options: shuffleArray([...q.options]), // Shuffle options to prevent pattern detection
          correctOptionId: undefined, // Don't expose to client during exam
          selectedOptionId: undefined,
          flagged: false,
          timeSpent: 0,
        }));

        const durationSec = params.durationSec ?? 5400;

        return {
          examId: this._generateExamId(),
          questions: examQuestions,
          durationSec,
        };
      }),
    );
  }

  /**
   * Valida las respuestas del examen.
   * Intenta validacion server-side via Supabase RPC primero (anti-cheat).
   * Si falla, cae a validacion client-side como respaldo (modo offline).
   */
  validate(payload: ExamPayload): Observable<ExamResult> {
    // Build the answer key from questionsById: { questionId: correctOptionId }
    const answerKey: Record<string, string> = {};
    for (const [id, question] of this.questionsById) {
      answerKey[id] = question.correctOptionId;
    }

    // Prepare answers array for the RPC call
    const rpcAnswers = payload.answers.map((a) => ({
      questionId: a.questionId,
      optionId: a.optionId ?? '',
    }));

    // Try server-side validation first, fall back to client-side on failure
    return from(this.supabase.validateExamAnswers(payload.examId, rpcAnswers, answerKey)).pipe(
      switchMap((serverResult) => {
        if (serverResult) {
          return of(this._mergeServerResult(payload, serverResult));
        }
        // Server validation returned null — fall back to client-side
        return of(this._validateClientSide(payload));
      }),
      catchError(() => {
        // Any error during server validation — fall back to client-side
        return of(this._validateClientSide(payload));
      }),
    );
  }

  /**
   * Merges server-side validation result into the ExamResult format.
   * The server provides the authoritative scoring; client enriches with
   * explanation, domain, timing, and flagged metadata.
   */
  private _mergeServerResult(
    payload: ExamPayload,
    serverResult: {
      examId: string;
      correct: number;
      incorrect: number;
      skipped: number;
      total: number;
      scorePercentage: number;
      items: {
        questionId: string;
        isCorrect: boolean;
        selectedOptionId: string | null;
        correctOptionId: string;
      }[];
      validatedAt: string;
    },
  ): ExamResult {
    // Build a lookup of payload answers for timing/flagged data
    const answerLookup = new Map(payload.answers.map((a) => [a.questionId, a]));
    let flaggedCount = 0;

    const items: ExamItemResult[] = serverResult.items.map((serverItem) => {
      const question = this.questionsById.get(serverItem.questionId);
      const payloadAnswer = answerLookup.get(serverItem.questionId);

      if (payloadAnswer?.flagged) {
        flaggedCount++;
      }

      return {
        questionId: serverItem.questionId,
        isCorrect: serverItem.isCorrect,
        explanation: question?.explanation ?? '',
        domainCode: question?.domainCode ?? 'unknown',
        selectedOptionId: serverItem.selectedOptionId ?? '',
        correctOptionId: serverItem.correctOptionId,
        timeSpent: payloadAnswer?.timeSpent ?? 0,
        flagged: payloadAnswer?.flagged ?? false,
      };
    });

    const summary: ExamSummary = {
      correct: serverResult.correct,
      incorrect: serverResult.incorrect,
      skipped: serverResult.skipped,
      flagged: flaggedCount,
      scorePercentage: serverResult.scorePercentage,
      totalTimeSpent: payload.totalTimeSpent ?? 0,
      timeLimit: 0,
    };

    const uniqueDomains = [...new Set(items.map((i) => i.domainCode))];

    return {
      examId: serverResult.examId,
      score: serverResult.scorePercentage,
      summary,
      items,
      recommendations: this._generateRecommendations(items),
      completedAt: new Date(serverResult.validatedAt),
      domains: uniqueDomains,
      averageDifficulty: this._calculateAverageDifficulty(items),
    };
  }

  /**
   * Client-side validation fallback (original logic).
   * Used when server-side validation is unavailable (offline, RPC error).
   */
  private _validateClientSide(payload: ExamPayload): ExamResult {
    const items: ExamItemResult[] = [];
    let correctCount = 0;
    let flaggedCount = 0;
    let skippedCount = 0;

    for (const answer of payload.answers) {
      const question = this.questionsById.get(answer.questionId);

      if (!answer.optionId) {
        skippedCount++;
      }

      const isCorrect = question ? answer.optionId === question.correctOptionId : false;

      if (isCorrect) {
        correctCount++;
      }

      if (answer.flagged) {
        flaggedCount++;
      }

      items.push({
        questionId: answer.questionId,
        isCorrect,
        explanation: question?.explanation ?? '',
        domainCode: question?.domainCode ?? 'unknown',
        selectedOptionId: answer.optionId,
        correctOptionId: question?.correctOptionId,
        timeSpent: answer.timeSpent ?? 0,
        flagged: answer.flagged ?? false,
      });
    }

    const totalQuestions = payload.answers.length;
    const incorrectCount = totalQuestions - correctCount - skippedCount;
    const scorePercentage =
      totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    const summary: ExamSummary = {
      correct: correctCount,
      incorrect: incorrectCount,
      skipped: skippedCount,
      flagged: flaggedCount,
      scorePercentage,
      totalTimeSpent: payload.totalTimeSpent ?? 0,
      timeLimit: 0,
    };

    const uniqueDomains = [...new Set(items.map((i) => i.domainCode))];

    return {
      examId: payload.examId,
      score: scorePercentage,
      summary,
      items,
      recommendations: this._generateRecommendations(items),
      completedAt: new Date(),
      domains: uniqueDomains,
      averageDifficulty: this._calculateAverageDifficulty(items),
    };
  }

  // ---------------------------------------------------------------------------
  // Consultas por track / contenido
  // ---------------------------------------------------------------------------

  /**
   * Obtiene preguntas de un track especifico, opcionalmente filtradas por tipo de contenido.
   * Busca la ruta correcta del archivo en el catalog (modules[].questionBankFile).
   */
  getQuestionsByTrack(trackId: string, contentType?: string): Observable<Question[]> {
    return this.loader.loadCatalog().pipe(
      switchMap((catalog) => {
        // Buscar el track en el catalog
        const track = catalog.tracks.find((t) => t.id === trackId);

        // Recolectar todas las rutas de archivos de preguntas del track
        const filePaths: string[] = [];
        if (track?.modules) {
          for (const mod of track.modules) {
            if (mod.questionBankFile) {
              filePaths.push(`assets/question-bank/${mod.questionBankFile}`);
            }
          }
        }

        // Si no hay modulos con archivos, intentar ruta directa como fallback
        if (filePaths.length === 0) {
          // Intentar varias rutas posibles
          const possiblePaths = [
            `assets/question-bank/${trackId}.json`,
            `assets/question-bank/academy/foundation/${trackId}.json`,
            `assets/question-bank/academy/builder/${trackId}.json`,
            `assets/question-bank/coursera/mastering-claude/${trackId}.json`,
            `assets/question-bank/deeplearning-ai/${trackId}.json`,
            `assets/question-bank/cca-f/${trackId}.json`,
          ];
          filePaths.push(...possiblePaths);
        }

        return this.loader.loadFromMultiplePaths(filePaths);
      }),
      map((questions) => {
        // Indexar preguntas cargadas para validacion posterior
        questions.forEach((q) => this.questionsById.set(q.id, q));

        if (contentType) {
          return questions.filter((q) => q.contentType === contentType);
        }
        return questions;
      }),
    );
  }

  /**
   * Obtiene flashcards para un track (todas las preguntas, sin filtrar por contentType).
   */
  getFlashcards(trackId: string): Observable<Question[]> {
    return this.getQuestionsByTrack(trackId);
  }

  // ---------------------------------------------------------------------------
  // CCA-F
  // ---------------------------------------------------------------------------

  /**
   * Genera un examen CCA-F con seleccion ponderada por dominio.
   */
  getCCAFExamQuestions(params: ExamParams): Observable<{
    examId: string;
    questions: ExamQuestion[];
    durationSec: number;
  }> {
    return this.loader.loadCatalog().pipe(
      switchMap((catalog) => {
        const ccafConfig = catalog.ccafConfig;
        const domains = ccafConfig.domains;
        const totalQuestions = params.count || ccafConfig.totalQuestions;

        // Cargar todos los archivos de preguntas de cada dominio
        const fileLoads = domains.map((domain) =>
          this.loader
            .loadQuestionFile(`assets/question-bank/${domain.questionBankFile}`)
            .pipe(map((questions) => ({ domain, questions }))),
        );

        return forkJoin(fileLoads).pipe(
          map((domainQuestionSets) => {
            const selected = this._selectWeightedQuestions(domainQuestionSets, totalQuestions);

            // Indexar para validacion posterior
            selected.forEach((q) => this.questionsById.set(q.id, q));

            const examQuestions: ExamQuestion[] = this._shuffleArray(selected).map((q) => ({
              ...q,
              options: shuffleArray([...q.options]), // Shuffle options to prevent pattern detection
              correctOptionId: undefined, // Don't expose to client during exam
              selectedOptionId: undefined,
              flagged: false,
              timeSpent: 0,
            }));

            const durationSec = params.durationSec ?? ccafConfig.durationSec ?? 7200;

            return {
              examId: this._generateExamId(),
              questions: examQuestions,
              durationSec,
            };
          }),
        );
      }),
    );
  }

  // ---------------------------------------------------------------------------
  // Helpers privados
  // ---------------------------------------------------------------------------

  /**
   * Seleccion ponderada de preguntas para CCA-F.
   * Cada dominio aporta: Math.round(domain.weight * totalQuestions) preguntas.
   */
  private _selectWeightedQuestions(
    domainQuestionSets: { domain: CCAFDomain; questions: Question[] }[],
    totalQuestions: number,
  ): Question[] {
    const selected: Question[] = [];

    for (const { domain, questions } of domainQuestionSets) {
      const count = Math.round(domain.weight * totalQuestions);
      const shuffled = this._shuffleArray([...questions]);
      const picked = shuffled.slice(0, count);
      selected.push(...picked);
    }

    // Ajustar si el redondeo produce mas o menos preguntas de las pedidas
    if (selected.length > totalQuestions) {
      return selected.slice(0, totalQuestions);
    }

    return selected;
  }

  /**
   * Filtra preguntas segun los parametros del examen.
   */
  private _filterQuestions(questions: Question[], params: ExamParams): Question[] {
    let filtered = [...questions];

    // Filtrar por dominios
    if (params.domains && params.domains.length > 0) {
      filtered = filtered.filter((q) => params.domains.includes(q.domainCode));
    }

    // Filtrar por dificultad
    if (params.difficulty && params.difficulty !== 'any') {
      filtered = filtered.filter((q) => q.difficulty === params.difficulty);
    }

    // Filtrar por nivel de aprendizaje
    if (params.learningLevel) {
      filtered = filtered.filter((q) => q.learningLevel === params.learningLevel);
    }

    // Filtrar por tipo de contenido
    if (params.contentType) {
      filtered = filtered.filter((q) => q.contentType === params.contentType);
    }

    return filtered;
  }

  /**
   * Mezcla un array usando el algoritmo Fisher-Yates.
   */
  private _shuffleArray = shuffleArray;

  /**
   * Genera un ID unico para el examen.
   */
  private _generateExamId(): string {
    return `exam_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Genera recomendaciones basadas en las respuestas.
   */
  private _generateRecommendations(items: ExamItemResult[]): string[] {
    const recommendations: string[] = [];
    const domainMap = new Map<string, { correct: number; total: number }>();

    for (const item of items) {
      const entry = domainMap.get(item.domainCode) ?? { correct: 0, total: 0 };
      entry.total++;
      if (item.isCorrect) {
        entry.correct++;
      }
      domainMap.set(item.domainCode, entry);
    }

    for (const [domain, stats] of domainMap) {
      const pct = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
      if (pct < 70) {
        recommendations.push(
          `Refuerza el dominio "${domain}" (${Math.round(pct)}% de aciertos). Revisa la teoria y practica con ejercicios adicionales.`,
        );
      }
    }

    if (recommendations.length === 0) {
      recommendations.push(
        'Buen rendimiento en todos los dominios. Sigue practicando para mantener tu nivel.',
      );
    }

    return recommendations;
  }

  /**
   * Calcula la dificultad promedio a partir de los resultados.
   */
  private _calculateAverageDifficulty(items: ExamItemResult[]): 'easy' | 'medium' | 'hard' {
    if (items.length === 0) return 'medium';

    const difficulties = items.map((item) => {
      const question = this.questionsById.get(item.questionId);
      return question?.difficulty ?? 'medium';
    });

    const easyCount = difficulties.filter((d) => d === 'easy').length;
    const hardCount = difficulties.filter((d) => d === 'hard').length;

    if (hardCount > easyCount) return 'hard';
    if (easyCount > hardCount) return 'easy';
    return 'medium';
  }
}
