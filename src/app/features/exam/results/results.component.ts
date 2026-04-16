import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ExamStateService } from '../../../core/services';
import { ExamResult } from '../../../core/models';

/**
 * Componente Results - Muestra los resultados finales del examen
 */
@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-medium animate-fadeInUp stagger-children">
      <!-- Header -->
      <div class="page-header text-center animate-fadeInUp">
        <div
          class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-forest text-white mb-4"
        >
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
        </div>
        <h1 class="page-header__title font-display text-3xl">¡Examen Completado!</h1>
        <p class="page-header__desc mt-2">
          Has terminado el Simulador CCA-F Claude AI. Aqui estan tus resultados.
        </p>
      </div>

      <!-- Resultados -->
      <div class="card-section mb-6 animate-fadeInUp">
        <h2 class="font-display text-xl font-bold text-forest text-center mb-6">
          Resultados del Examen
        </h2>

        <!-- Score principal -->
        <div class="flex justify-center mb-8 animate-scaleIn">
          <div class="card-stat text-center px-12 py-8 shadow-forest-lg">
            <div class="card-stat__label text-sm">Puntuación</div>
            <div class="card-stat__value font-display text-5xl text-forest">
              {{ examResult()?.score }}%
            </div>
            <div class="card-stat__desc">Resultado final</div>
          </div>
        </div>

        <!-- Estadísticas detalladas -->
        <div class="grid-stats mb-6 stagger-children">
          <div class="card-stat hover-lift animate-fadeInUp">
            <div class="flex items-center gap-3">
              <span class="badge badge-active">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </span>
              <div>
                <div class="card-stat__label">Correctas</div>
                <div class="card-stat__value">{{ examResult()?.summary?.correct }}</div>
              </div>
            </div>
          </div>

          <div class="card-stat hover-lift animate-fadeInUp">
            <div class="flex items-center gap-3">
              <span class="badge badge-error">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </span>
              <div>
                <div class="card-stat__label">Incorrectas</div>
                <div class="card-stat__value">{{ examResult()?.summary?.incorrect }}</div>
              </div>
            </div>
          </div>

          <div class="card-stat hover-lift animate-fadeInUp">
            <div class="flex items-center gap-3">
              <span class="badge badge-info">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  ></path>
                </svg>
              </span>
              <div>
                <div class="card-stat__label">Total</div>
                <div class="card-stat__value">{{ examResult()?.items?.length }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Progress bar labeled -->
        <div class="mb-6 animate-fadeInUp">
          <div class="progress-labeled">
            <div
              class="progress progress--lg"
              [ngClass]="{
                'progress--success': examResult() && examResult()!.score >= 70,
                'progress--warning':
                  examResult() && examResult()!.score >= 50 && examResult()!.score < 70,
                'progress--error': examResult() && examResult()!.score < 50,
              }"
            >
              <div class="progress__bar" [style.width.%]="examResult()?.score || 0"></div>
            </div>
            <span class="progress-labeled__value">{{ examResult()?.score }}%</span>
          </div>
        </div>

        <!-- Mensaje de resultado -->
        <div
          class="alert animate-fadeInUp"
          [ngClass]="{
            'alert-success': getResultClass() === 'success',
            'alert-warning': getResultClass() === 'warning',
            'alert-error': getResultClass() === 'error',
          }"
        >
          <div class="alert__icon">
            @if (examResult() && examResult()!.score >= 70) {
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            } @else {
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                ></path>
              </svg>
            }
          </div>
          <div class="alert__content">
            <div class="alert__title">{{ getResultTitle() }}</div>
            <p>{{ getResultMessage() }}</p>
          </div>
        </div>
      </div>

      <!-- Acciones -->
      <div
        class="flex-row justify-center animate-fadeInUp"
        style="flex-wrap: wrap; justify-content: center;"
      >
        <button type="button" (click)="startNewExam()" class="btn btn-primary hover-lift">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            ></path>
          </svg>
          Nuevo Simulacro
        </button>

        <button type="button" (click)="goHome()" class="btn btn-secondary hover-lift">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            ></path>
          </svg>
          Ir al Inicio
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class ResultsComponent implements OnInit {
  private examState = inject(ExamStateService);
  private router = inject(Router);

  examResult = signal<ExamResult | null>(null);

  ngOnInit(): void {
    this.examResult.set(this.examState.examResult() ?? null);
  }

  getResultClass(): string {
    const result = this.examResult();
    if (!result) return '';
    const score = result.score;
    if (score >= 70) return 'success';
    if (score >= 50) return 'warning';
    return 'error';
  }

  getResultTitle(): string {
    const result = this.examResult();
    if (!result) return '';
    const score = result.score;
    if (score >= 70) return 'Excelente!';
    if (score >= 50) return 'Buen intento';
    return 'Sigue estudiando';
  }

  getResultMessage(): string {
    const result = this.examResult();
    if (!result) return '';
    const score = result.score;
    if (score >= 70) return 'Excelente trabajo! Tienes una solida comprension del material.';
    if (score >= 50) return 'Buena base, pero revisa las areas debiles para mejorar.';
    return 'Te recomendamos estudiar mas antes de intentar de nuevo. Tu puedes!';
  }

  startNewExam(): void {
    this.examState.resetExam();
    this.router.navigate(['/exam/start']);
  }

  goHome(): void {
    this.examState.resetExam();
    this.router.navigate(['/']);
  }
}
