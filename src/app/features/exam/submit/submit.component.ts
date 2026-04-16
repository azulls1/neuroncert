import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ExamStateService } from '../../../core/services';
import { CurriculumService } from '../../../core/services/curriculum.service';
import { ExamQuestion } from '../../../core/models';
import { formatTime } from '../../../core/utils/exam.utils';

/**
 * Componente Submit - Confirmación de envío
 * Muestra resumen del examen y permite confirmar el envío
 */
@Component({
  selector: 'app-submit',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page page-medium animate-fadeInUp">
      <!-- Header -->
      <div class="page-header" style="text-align: center;">
        <h1 class="page-header__title font-display">Confirmar Envio del Examen</h1>
        <p class="page-header__desc">
          Revisa tu examen antes de enviarlo. Una vez enviado, no podras hacer cambios.
        </p>
      </div>

      <!-- Resumen del examen -->
      <div class="card-section animate-fadeInUp delay-100" style="margin-bottom: 24px;">
        <h2 class="font-display" style="font-size: 18px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 20px;">Resumen del Examen</h2>

        <div class="grid-stats" style="margin-bottom: 24px;">
          <div class="card-stat">
            <div class="card-stat__label">Total de Preguntas</div>
            <div class="card-stat__value">{{ examStats().total }}</div>
          </div>
          <div class="card-stat">
            <div class="card-stat__label">Respondidas</div>
            <div class="card-stat__value text-forest">{{ examStats().answered }}</div>
          </div>
          <div class="card-stat">
            <div class="card-stat__label">Marcadas</div>
            <div class="card-stat__value">{{ examStats().flagged }}</div>
          </div>
          <div class="card-stat">
            <div class="card-stat__label">Sin Responder</div>
            <div class="card-stat__value">{{ examStats().remaining }}</div>
          </div>
        </div>

        <!-- Tiempo utilizado -->
        <div class="divider"></div>
        <h3 class="font-display" style="font-size: 16px; font-weight: 600; color: var(--color-text-primary); margin-bottom: 12px;">Tiempo Utilizado</h3>
        <div class="submit-time-info">
          <div class="submit-time-item">
            <span class="card-stat__label">Tiempo total</span>
            <span class="font-mono" style="font-size: 18px; font-weight: 600; color: var(--color-text-primary);">{{ formatTime(examStats().totalTime) }}</span>
          </div>
          <div class="submit-time-item">
            <span class="card-stat__label">Tiempo restante</span>
            <span class="font-mono" style="font-size: 18px; font-weight: 600; color: var(--color-text-primary);">{{ formatTime(examStats().remainingTime) }}</span>
          </div>
        </div>
      </div>

      <!-- Advertencias -->
      @if (examStats().remaining > 0) {
        <div class="alert alert-warning animate-fadeInUp delay-200" style="margin-bottom: 24px;">
          <svg class="alert__icon" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
          </svg>
          <div class="alert__content">
            <div class="alert__title">Preguntas sin responder</div>
            <p style="margin: 0;">
              Tienes {{ examStats().remaining }} pregunta(s) sin responder.
              Estas seguro de que quieres enviar el examen?
            </p>
          </div>
        </div>
      }

      <!-- Preguntas marcadas -->
      @if (examStats().flagged > 0) {
        <div class="card-section animate-fadeInUp delay-200" style="margin-bottom: 24px;">
          <h3 class="font-display" style="font-size: 16px; font-weight: 600; color: var(--color-text-primary); margin-bottom: 12px;">Preguntas Marcadas para Revisar</h3>
          <div class="submit-flagged-list">
            @for (question of flaggedQuestions(); track question.id) {
              <div class="card card-compact">
                <span class="font-display" style="font-weight: 600; font-size: 14px; color: var(--color-text-primary);">Pregunta {{ getQuestionNumber(question.id) }}</span>
                <span class="badge badge-warning">{{ getDomainName(question.domainCode) }}</span>
              </div>
            }
          </div>
        </div>
      }

      <!-- Acciones -->
      <div class="action-bar" style="justify-content: center;">
        <button
          type="button"
          class="btn btn-secondary"
          (click)="goBack()"
          [disabled]="isSubmitting()"
        >
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd"></path>
          </svg>
          Volver al Examen
        </button>

        <button
          type="button"
          class="btn btn-primary"
          (click)="submitExam()"
          [disabled]="isSubmitting()"
        >
          @if (isSubmitting()) {
            <span class="animate-spin" style="display: inline-block; width: 16px; height: 16px; border: 2px solid transparent; border-top: 2px solid currentColor; border-radius: 50%;"></span>
            Enviando...
          } @else {
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            Enviar Examen
          }
        </button>
      </div>

      @if (error()) {
        <div class="alert alert-error animate-fadeInUp" style="margin-top: 24px;">
          <svg class="alert__icon" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
          </svg>
          <div class="alert__content">
            <div class="alert__title">Error al enviar el examen</div>
            <p style="margin: 0;">{{ error() }}</p>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .submit-time-info {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
    }

    .submit-time-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .submit-flagged-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .submit-flagged-list .card {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    @media (max-width: 640px) {
      .submit-time-info {
        flex-direction: column;
        gap: 12px;
      }
    }
  `]
})
export class SubmitComponent implements OnInit, OnDestroy {

  // Inyección de dependencias
  private examStateService = inject(ExamStateService);
  private router = inject(Router);
  private curriculumService = inject(CurriculumService);

  // Signals para el estado del componente
  private _examStats = signal({
    total: 0,
    answered: 0,
    flagged: 0,
    remaining: 0,
    totalTime: 0,
    remainingTime: 0
  });
  private _flaggedQuestions = signal<ExamQuestion[]>([]);
  private _isSubmitting = signal(false);
  private _error = signal<string | null>(null);

  // Subscription para el estado del examen
  private examStateSubscription?: Subscription;

  // Getters
  get examStats() {
    return this._examStats.asReadonly();
  }

  get flaggedQuestions() {
    return this._flaggedQuestions.asReadonly();
  }

  get isSubmitting() {
    return this._isSubmitting.asReadonly();
  }

  get error() {
    return this._error.asReadonly();
  }

  ngOnInit(): void {
    // Verificar si hay un examen en progreso
    const currentState = this.examStateService.getState();
    if (currentState.status === 'idle') {
      this.router.navigate(['/exam/start']);
      return;
    }

    // Suscribirse a los cambios del estado del examen
    this.examStateSubscription = this.examStateService.examState$.subscribe(state => {
      this.updateExamStats(state);
    });

    // Actualizar estadísticas con el estado actual
    this.updateExamStats(currentState);
  }

  ngOnDestroy(): void {
    if (this.examStateSubscription) {
      this.examStateSubscription.unsubscribe();
    }
  }

  /**
   * Actualiza las estadísticas del examen
   */
  private updateExamStats(state: any): void {
    const questions = state.questions || [];
    const answered = questions.filter((q: ExamQuestion) => q.selectedOptionId).length;
    const flagged = questions.filter((q: ExamQuestion) => q.flagged);

    this._examStats.set({
      total: questions.length,
      answered,
      flagged: flagged.length,
      remaining: questions.length - answered,
      totalTime: state.timer?.totalTime || 0,
      remainingTime: state.timer?.remainingTime || 0
    });

    this._flaggedQuestions.set(flagged);
  }

  /**
   * Formatea el tiempo en mm:ss
   */
  protected formatTime = formatTime;

  /**
   * Obtiene el número de pregunta
   */
  getQuestionNumber(questionId: string): number {
    const state = this.examStateService.getState();
    const questions = state.questions || [];
    const index = questions.findIndex((q: ExamQuestion) => q.id === questionId);
    return index + 1;
  }

  /**
   * Obtiene el nombre del dominio
   */
  getDomainName(domainCode: string): string {
    const config = this.curriculumService.getCCAFConfig();
    const domainNames: Record<string, string> = config?.domains
      ? config.domains.reduce((map, d) => ({ ...map, [d.code]: d.name }), {} as Record<string, string>)
      : {};
    return domainNames[domainCode] || domainCode;
  }

  /**
   * Regresa al examen
   */
  goBack(): void {
    this.router.navigate(['/exam/run']);
  }

  /**
   * Determina la ruta de resultados segun el modo del examen
   */
  private getResultsRoute(): string {
    const params = this.examStateService.examParams();
    if (params?.mode === 'ccaf') {
      return '/ccaf/results';
    }
    return '/exam/review';
  }

  /**
   * Envía el examen
   */
  submitExam(): void {
    this._isSubmitting.set(true);
    this._error.set(null);

    // Capturar la ruta antes del submit para que examParams siga disponible
    const resultsRoute = this.getResultsRoute();

    this.examStateService.submitExam().subscribe({
      next: (result) => {
        console.log('Examen enviado exitosamente');
        this.router.navigate([resultsRoute]);
      },
      error: (error) => {
        console.error('Error enviando examen:', error);
        this._error.set('Error al enviar el examen. Por favor, inténtalo de nuevo.');
        this._isSubmitting.set(false);
      }
    });
  }
}
