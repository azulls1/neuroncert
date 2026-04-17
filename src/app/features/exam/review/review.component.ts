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
        <div class="card text-center p-12">
          <div class="empty-state">
            <h3 class="empty-state__title">Sin Resultados de Examen</h3>
            <p class="empty-state__desc">
              No hay resultados de examen para revisar. Toma un examen primero para ver tus
              resultados aqui.
            </p>
            <div class="mt-5">
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
        <div
          class="card-hero"
          [class.gradient-dark]="!passed()"
          [class.dark-surface]="!passed()"
          [class.bg-green-50]="passed()"
        >
          <div class="flex flex-wrap items-center justify-center gap-4">
            <div class="text-center">
              <div
                class="font-mono font-extrabold text-5xl max-sm:text-3xl"
                [class.text-forest]="passed()"
              >
                {{ result()!.score }}%
              </div>
              <div class="text-forest text-sm">Puntuacion</div>
            </div>

            @if (result()!.weightedScore !== undefined) {
              <div class="text-center">
                <div
                  class="font-mono font-bold text-3xl max-sm:text-xl"
                  [class.text-forest]="passed()"
                >
                  {{ result()!.weightedScore }}/1000
                </div>
                <div class="text-forest text-sm">Score Ponderado</div>
              </div>
            }

            <div class="text-center">
              <span
                class="badge text-sm px-4 py-2"
                [class.badge-active]="passed()"
                [class.badge-warning]="!passed()"
              >
                {{ passed() ? 'APROBADO' : 'NO APROBADO' }}
              </span>
            </div>
          </div>

          <div class="grid-stats mt-6">
            <div class="card-compact text-center p-3">
              <div class="text-forest font-mono text-xl font-bold">
                {{ result()!.summary.correct }}
              </div>
              <div class="text-forest text-xs">Correctas</div>
            </div>
            <div class="card-compact text-center p-3">
              <div class="font-mono text-xl font-bold text-red-600">
                {{ result()!.summary.incorrect }}
              </div>
              <div class="text-forest text-xs">Incorrectas</div>
            </div>
            <div class="card-compact text-center p-3">
              <div class="font-mono text-xl font-bold text-amber-600">
                {{ result()!.summary.skipped }}
              </div>
              <div class="text-forest text-xs">Omitidas</div>
            </div>
            <div class="card-compact text-center p-3">
              <div class="font-mono text-xl font-bold">
                {{ result()!.summary.flagged }}
              </div>
              <div class="text-forest text-xs">Marcadas</div>
            </div>
          </div>
        </div>

        <!-- Recommendations -->
        @if (result()!.recommendations.length > 0) {
          <div class="alert alert-info">
            <div class="alert__icon">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </div>
            <div class="alert__content">
              <div class="alert__title">Recomendaciones</div>
              @for (rec of result()!.recommendations; track $index) {
                <p class="my-1">{{ rec }}</p>
              }
            </div>
          </div>
        }

        <!-- Filter Navigation (tabs-like) -->
        <div class="tabs">
          <button
            class="tab"
            [class.active]="filter() === 'all'"
            (click)="setFilter('all')"
          >
            Todas ({{ questions().length }})
          </button>
          <button
            class="tab"
            [class.active]="filter() === 'correct'"
            (click)="setFilter('correct')"
          >
            Correctas ({{ correctCount() }})
          </button>
          <button
            class="tab"
            [class.active]="filter() === 'incorrect'"
            (click)="setFilter('incorrect')"
          >
            Incorrectas ({{ incorrectCount() }})
          </button>
          <button
            class="tab"
            [class.active]="filter() === 'skipped'"
            (click)="setFilter('skipped')"
          >
            Omitidas ({{ skippedCount() }})
          </button>
        </div>

        <!-- Questions Review -->
        <div class="stack">
          @for (item of filteredItems(); track item.questionId; let i = $index) {
            <div
              class="card animate-fadeInUp"
              [style.border-left]="
                '4px solid ' +
                (item.isCorrect
                  ? 'var(--color-forest-500, #22c55e)'
                  : !item.selectedOptionId
                    ? 'var(--color-amber-500, #f59e0b)'
                    : 'var(--color-red-500, #ef4444)')
              "
            >
              <!-- Question Header -->
              <div class="flex items-center justify-between mb-3">
                <div class="flex flex-wrap items-center gap-2">
                  <span
                    class="badge"
                    [class.badge-active]="item.isCorrect"
                    [class.badge-warning]="!item.selectedOptionId"
                    [class.badge-error]="!!item.selectedOptionId && !item.isCorrect"
                  >
                    {{
                      item.isCorrect
                        ? 'Correcta'
                        : !item.selectedOptionId
                          ? 'Omitida'
                          : 'Incorrecta'
                    }}
                  </span>
                  <span class="badge badge-info">{{ item.domainCode }}</span>
                  @if (item.flagged) {
                    <span class="badge badge-warning">Marcada</span>
                  }
                </div>
              </div>

              <!-- Question Text -->
              <p class="font-semibold mb-1">
                {{ getQuestionText(item.questionId) }}
              </p>
              @if (getQuestionTextEs(item.questionId)) {
                <p class="text-sm text-forest m-0 mb-4 p-2 px-3 bg-gray-50 rounded-lg border-l-3 border-moss leading-relaxed">
                  {{ getQuestionTextEs(item.questionId) }}
                </p>
              }

              <!-- Options -->
              <div class="stack-sm">
                @for (option of getQuestionOptions(item.questionId); track option.id) {
                  <div
                    class="card-compact"
                    [style.border-left]="'3px solid ' + getOptionBorderColor(option.id, item)"
                    [style.background]="getOptionBackground(option.id, item)"
                  >
                    <div class="flex items-start gap-2">
                      @if (option.id === item.correctOptionId) {
                        <span class="text-green-600 shrink-0">&#10003;</span>
                      } @else if (option.id === item.selectedOptionId && !item.isCorrect) {
                        <span class="text-red-500 shrink-0">&#10007;</span>
                      } @else {
                        <span class="invisible shrink-0">&#10003;</span>
                      }
                      <div class="flex-1">
                        <span>{{ option.text }}</span>
                        @if (option.textEs) {
                          <div class="text-xs text-forest mt-0.5 italic">
                            {{ option.textEs }}
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                }
              </div>

              <!-- Explanation -->
              <div class="alert alert-info mt-4">
                <div class="alert__content">
                  <div class="alert__title">Explicacion</div>
                  @if (getQuestionExplanationEs(item.questionId)) {
                    <div class="mb-2">
                      {{ getQuestionExplanationEs(item.questionId) }}
                    </div>
                    <div class="text-xs text-forest border-t border-gray-200 pt-2">
                      <strong>EN:</strong> {{ item.explanation }}
                    </div>
                  } @else {
                    <span>{{ item.explanation }}</span>
                  }
                </div>
              </div>
            </div>
          }
        </div>

        @if (filteredItems().length === 0) {
          <div class="card text-center p-8">
            <p class="text-forest">Ninguna pregunta coincide con el filtro seleccionado.</p>
          </div>
        }

        <div class="divider"></div>

        <!-- Action Buttons -->
        <div class="flex flex-wrap items-center justify-center gap-3">
          <button class="btn btn-primary" (click)="retakeExam()">Repetir Examen</button>
          <a routerLink="/ccaf" class="btn btn-secondary">Volver a CCA-F</a>
          <a routerLink="/tracks" class="btn btn-ghost">Explorar Tracks</a>
        </div>
      }
    </div>
  `,
  styles: [],
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
  correctCount = computed(() => this.result()?.items.filter((i) => i.isCorrect).length ?? 0);

  incorrectCount = computed(
    () => this.result()?.items.filter((i) => !i.isCorrect && !!i.selectedOptionId).length ?? 0,
  );

  skippedCount = computed(
    () => this.result()?.items.filter((i) => !i.selectedOptionId).length ?? 0,
  );

  /** Filtered items based on current filter */
  filteredItems = computed(() => {
    const items = this.result()?.items ?? [];
    const mode = this.filter();

    switch (mode) {
      case 'correct':
        return items.filter((i) => i.isCorrect);
      case 'incorrect':
        return items.filter((i) => !i.isCorrect && !!i.selectedOptionId);
      case 'skipped':
        return items.filter((i) => !i.selectedOptionId);
      default:
        return items;
    }
  });

  /** Build a map of questionId -> ExamQuestion for quick lookup */
  private questionsMap = computed(() => {
    const map = new Map<
      string,
      {
        text: string;
        textEs?: string;
        explanationEs?: string;
        options: { id: string; text: string; textEs?: string }[];
      }
    >();
    for (const q of this.questions()) {
      map.set(q.id, {
        text: q.text,
        textEs: q.textEs,
        explanationEs: q.explanationEs,
        options: q.options,
      });
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

  getOptionBorderColor(
    optionId: string,
    item: { selectedOptionId: string; correctOptionId?: string; isCorrect: boolean },
  ): string {
    if (optionId === item.correctOptionId) {
      return 'var(--color-forest-500, #22c55e)';
    }
    if (optionId === item.selectedOptionId && !item.isCorrect) {
      return 'var(--color-red-500, #ef4444)';
    }
    return 'transparent';
  }

  getOptionBackground(
    optionId: string,
    item: { selectedOptionId: string; correctOptionId?: string; isCorrect: boolean },
  ): string {
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
