import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ExamStateService } from '../../../core/services/exam-state.service';

type FilterMode = 'all' | 'correct' | 'incorrect' | 'skipped';

/**
 * Review Component - Displays exam results with detailed question review.
 * Uses ExamStateService signals for reactive data.
 */
@Component({
  selector: 'app-review',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="stack-lg animate-fadeInUp">
      @if (!result()) {
        <!-- No result available -->
        <div class="card" style="text-align: center; padding: 48px;">
          <div class="empty-state">
            <h3 class="empty-state__title">Sin Resultados de Examen</h3>
            <p class="empty-state__desc">
              No hay resultados de examen para revisar. Toma un examen primero para ver tus resultados aqui.
            </p>
            <div style="margin-top: 20px;">
              <a routerLink="/ccaf/exam" class="btn btn-primary">Comenzar Examen</a>
            </div>
          </div>
        </div>
      } @else {
        <!-- Page Header -->
        <div class="page-header">
          <h1 class="page-header__title font-display">Revision del Examen</h1>
          <p class="page-header__desc">Revisa tus respuestas y aprende de las explicaciones.</p>
        </div>

        <!-- Score Summary -->
        <div class="card-hero" [class.gradient-dark]="!passed()" [class.dark-surface]="!passed()" [style.background]="passed() ? 'var(--color-forest-50, #f0fdf4)' : ''">
          <div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: center; justify-content: center;">
            <div style="text-align: center;">
              <div style="font-size: clamp(2rem, 6vw, 3rem); font-weight: 800;" class="font-mono" [class.text-forest]="passed()">
                {{ result()!.score }}%
              </div>
              <div class="text-pine" style="font-size: 0.875rem;">Puntuacion</div>
            </div>

            @if (result()!.weightedScore !== undefined) {
              <div style="text-align: center;">
                <div style="font-size: clamp(1.25rem, 4vw, 2rem); font-weight: 700;" class="font-mono" [class.text-forest]="passed()">
                  {{ result()!.weightedScore }}/1000
                </div>
                <div class="text-pine" style="font-size: 0.875rem;">Score Ponderado</div>
              </div>
            }

            <div style="text-align: center;">
              <span class="badge" [class.badge-success]="passed()" [class.badge-warning]="!passed()" style="font-size: 0.875rem; padding: 8px 16px;">
                {{ passed() ? 'APROBADO' : 'NO APROBADO' }}
              </span>
            </div>
          </div>

          <div class="grid-stats" style="margin-top: 24px;">
            <div class="card-compact" style="text-align: center; padding: 12px;">
              <div class="text-forest font-mono" style="font-size: 1.25rem; font-weight: 700;">{{ result()!.summary.correct }}</div>
              <div class="text-pine" style="font-size: 0.8125rem;">Correctas</div>
            </div>
            <div class="card-compact" style="text-align: center; padding: 12px;">
              <div class="font-mono" style="font-size: 1.25rem; font-weight: 700; color: var(--color-red-600, #dc2626);">{{ result()!.summary.incorrect }}</div>
              <div class="text-pine" style="font-size: 0.8125rem;">Incorrectas</div>
            </div>
            <div class="card-compact" style="text-align: center; padding: 12px;">
              <div class="font-mono" style="font-size: 1.25rem; font-weight: 700; color: var(--color-amber-600, #d97706);">{{ result()!.summary.skipped }}</div>
              <div class="text-pine" style="font-size: 0.8125rem;">Omitidas</div>
            </div>
            <div class="card-compact" style="text-align: center; padding: 12px;">
              <div class="font-mono" style="font-size: 1.25rem; font-weight: 700;">{{ result()!.summary.flagged }}</div>
              <div class="text-pine" style="font-size: 0.8125rem;">Marcadas</div>
            </div>
          </div>
        </div>

        <!-- Recommendations -->
        @if (result()!.recommendations.length > 0) {
          <div class="alert alert-info">
            <div class="alert__icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
            </div>
            <div class="alert__content">
              <div class="alert__title">Recomendaciones</div>
              @for (rec of result()!.recommendations; track $index) {
                <p style="margin: 4px 0;">{{ rec }}</p>
              }
            </div>
          </div>
        }

        <!-- Filter Navigation -->
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button class="btn" [class.btn-primary]="filter() === 'all'" [class.btn-ghost]="filter() !== 'all'" (click)="setFilter('all')">
            Todas ({{ questions().length }})
          </button>
          <button class="btn" [class.btn-primary]="filter() === 'correct'" [class.btn-ghost]="filter() !== 'correct'" (click)="setFilter('correct')">
            Correctas ({{ correctCount() }})
          </button>
          <button class="btn" [class.btn-primary]="filter() === 'incorrect'" [class.btn-ghost]="filter() !== 'incorrect'" (click)="setFilter('incorrect')">
            Incorrectas ({{ incorrectCount() }})
          </button>
          <button class="btn" [class.btn-primary]="filter() === 'skipped'" [class.btn-ghost]="filter() !== 'skipped'" (click)="setFilter('skipped')">
            Omitidas ({{ skippedCount() }})
          </button>
        </div>

        <!-- Questions Review -->
        <div class="stack">
          @for (item of filteredItems(); track item.questionId; let i = $index) {
            <div class="card animate-fadeInUp" [style.border-left]="'4px solid ' + (item.isCorrect ? 'var(--color-forest-500, #22c55e)' : (!item.selectedOptionId ? 'var(--color-amber-500, #f59e0b)' : 'var(--color-red-500, #ef4444)'))">
              <!-- Question Header -->
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="badge" [class.badge-success]="item.isCorrect" [class.badge-warning]="!item.selectedOptionId" [class.badge-danger]="!!item.selectedOptionId && !item.isCorrect">
                    {{ item.isCorrect ? 'Correcta' : (!item.selectedOptionId ? 'Omitida' : 'Incorrecta') }}
                  </span>
                  <span class="badge badge-info">{{ item.domainCode }}</span>
                  @if (item.flagged) {
                    <span class="tag" style="color: var(--color-amber-600, #d97706);">Marcada</span>
                  }
                </div>
              </div>

              <!-- Question Text -->
              <p style="font-weight: 600; margin-bottom: 4px;">{{ getQuestionText(item.questionId) }}</p>
              @if (getQuestionTextEs(item.questionId)) {
                <p style="font-size: 14px; color: #5B7065; margin: 0 0 16px; padding: 8px 12px; background: #F7F9F8; border-radius: 8px; border-left: 3px solid #9EADA3; line-height: 1.5;">{{ getQuestionTextEs(item.questionId) }}</p>
              }

              <!-- Options -->
              <div class="stack-sm">
                @for (option of getQuestionOptions(item.questionId); track option.id) {
                  <div class="card-compact" [style.border-left]="'3px solid ' + getOptionBorderColor(option.id, item)" [style.background]="getOptionBackground(option.id, item)">
                    <div style="display: flex; align-items: flex-start; gap: 8px;">
                      @if (option.id === item.correctOptionId) {
                        <span style="color: var(--color-forest-500, #22c55e); flex-shrink: 0;">&#10003;</span>
                      } @else if (option.id === item.selectedOptionId && !item.isCorrect) {
                        <span style="color: var(--color-red-500, #ef4444); flex-shrink: 0;">&#10007;</span>
                      } @else {
                        <span style="visibility: hidden; flex-shrink: 0;">&#10003;</span>
                      }
                      <div style="flex: 1;">
                        <span>{{ option.text }}</span>
                        @if (option.textEs) {
                          <div style="font-size: 12px; color: #5B7065; margin-top: 2px; font-style: italic;">{{ option.textEs }}</div>
                        }
                      </div>
                    </div>
                  </div>
                }
              </div>

              <!-- Explanation -->
              <div class="alert alert-info" style="margin-top: 16px;">
                <div class="alert__content">
                  <div class="alert__title">Explicacion</div>
                  @if (getQuestionExplanationEs(item.questionId)) {
                    <div style="margin-bottom: 8px;">{{ getQuestionExplanationEs(item.questionId) }}</div>
                    <div style="font-size: 12px; color: var(--color-text-muted); border-top: 1px solid #EFF2F0; padding-top: 8px;"><strong>EN:</strong> {{ item.explanation }}</div>
                  } @else {
                    <span>{{ item.explanation }}</span>
                  }
                </div>
              </div>
            </div>
          }
        </div>

        @if (filteredItems().length === 0) {
          <div class="card" style="text-align: center; padding: 32px;">
            <p class="text-pine">Ninguna pregunta coincide con el filtro seleccionado.</p>
          </div>
        }

        <div class="divider"></div>

        <!-- Action Buttons -->
        <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
          <button class="btn btn-primary" (click)="retakeExam()">Repetir Examen</button>
          <a routerLink="/ccaf" class="btn btn-secondary">Volver a CCA-F</a>
          <a routerLink="/tracks" class="btn btn-ghost">Explorar Tracks</a>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .stack-sm { display: flex; flex-direction: column; gap: 8px; }
  `]
})
export class ReviewComponent {

  private examState = inject(ExamStateService);
  private router = inject(Router);

  /** Exam result from ExamStateService */
  result = this.examState.examResult;

  /** Questions from ExamStateService */
  questions = this.examState.questions;

  /** Current filter mode */
  filter = signal<FilterMode>('all');

  /** Whether the exam was passed */
  passed = computed(() => {
    const r = this.result();
    if (!r) return false;
    return r.passed ?? r.score >= 70;
  });

  /** Count helpers */
  correctCount = computed(() =>
    this.result()?.items.filter(i => i.isCorrect).length ?? 0
  );

  incorrectCount = computed(() =>
    this.result()?.items.filter(i => !i.isCorrect && !!i.selectedOptionId).length ?? 0
  );

  skippedCount = computed(() =>
    this.result()?.items.filter(i => !i.selectedOptionId).length ?? 0
  );

  /** Filtered items based on current filter */
  filteredItems = computed(() => {
    const items = this.result()?.items ?? [];
    const mode = this.filter();

    switch (mode) {
      case 'correct':
        return items.filter(i => i.isCorrect);
      case 'incorrect':
        return items.filter(i => !i.isCorrect && !!i.selectedOptionId);
      case 'skipped':
        return items.filter(i => !i.selectedOptionId);
      default:
        return items;
    }
  });

  /** Build a map of questionId -> ExamQuestion for quick lookup */
  private questionsMap = computed(() => {
    const map = new Map<string, { text: string; textEs?: string; explanationEs?: string; options: { id: string; text: string; textEs?: string }[] }>();
    for (const q of this.questions()) {
      map.set(q.id, { text: q.text, textEs: q.textEs, explanationEs: q.explanationEs, options: q.options });
    }
    return map;
  });

  setFilter(mode: FilterMode): void {
    this.filter.set(mode);
  }

  getQuestionText(questionId: string): string {
    return this.questionsMap().get(questionId)?.text ?? 'Texto de la pregunta no disponible';
  }

  getQuestionTextEs(questionId: string): string {
    return this.questionsMap().get(questionId)?.textEs ?? '';
  }

  getQuestionExplanationEs(questionId: string): string {
    return this.questionsMap().get(questionId)?.explanationEs ?? '';
  }

  getQuestionOptions(questionId: string): { id: string; text: string; textEs?: string }[] {
    return this.questionsMap().get(questionId)?.options ?? [];
  }

  getOptionBorderColor(optionId: string, item: { selectedOptionId: string; correctOptionId?: string; isCorrect: boolean }): string {
    if (optionId === item.correctOptionId) {
      return 'var(--color-forest-500, #22c55e)';
    }
    if (optionId === item.selectedOptionId && !item.isCorrect) {
      return 'var(--color-red-500, #ef4444)';
    }
    return 'transparent';
  }

  getOptionBackground(optionId: string, item: { selectedOptionId: string; correctOptionId?: string; isCorrect: boolean }): string {
    if (optionId === item.correctOptionId) {
      return 'var(--color-forest-50, rgba(34,197,94,0.08))';
    }
    if (optionId === item.selectedOptionId && !item.isCorrect) {
      return 'var(--color-red-50, rgba(239,68,68,0.08))';
    }
    return '';
  }

  retakeExam(): void {
    this.examState.resetExam();
    this.router.navigate(['/ccaf/exam']);
  }
}
