import { Component, DestroyRef, inject, signal, computed, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { CurriculumService } from '../../../core/services/curriculum.service';
import { QuestionBankService } from '../../../core/services/question-bank.service';
import { Question, LearningTrack } from '../../../core/models';
import { shuffleArray, getOptionLabel } from '../../../core/utils/exam.utils';
import { LoggingService } from '../../../core/services/logging.service';

/**
 * Track Practice Component - Interactive practice mode for a learning track.
 * Loads questions dynamically and presents them one at a time with immediate feedback.
 */
@Component({
  selector: 'app-track-practice',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="stack-lg animate-fadeInUp">
      @if (loading()) {
        <div class="card text-center py-12">
          <div class="loading-dots mx-auto"><span></span><span></span><span></span></div>
          <p class="text-pine mt-4">Cargando preguntas de practica...</p>
        </div>
      } @else if (error()) {
        <div class="alert alert-warning">
          <div class="alert__content">
            <div class="alert__title">No se pudieron cargar las preguntas de practica</div>
            <span>{{ error() }}</span>
          </div>
        </div>
        <div class="flex flex-wrap gap-3 mt-4">
          <a class="btn btn-secondary" [routerLink]="['/tracks', trackId]">Volver al Track</a>
        </div>
      } @else if (completed()) {
        <!-- Practice Complete -->
        <div class="page-header">
          <h1 class="page-header__title font-display">Practica Completada</h1>
          <p class="page-header__desc">{{ track()?.title ?? 'Track' }}</p>
        </div>

        <div class="card-hero gradient-dark dark-surface text-center">
          <div class="font-mono text-5xl font-extrabold text-on-dark">
            {{ correctCount() }}/{{ questions().length }}
          </div>
          <div class="text-on-dark-muted mt-1">{{ scorePercent() }}% correctas</div>

          <div class="progress-labeled mt-6 max-w-[400px] mx-auto">
            <div class="progress">
              <div class="progress__bar" [style.width.%]="scorePercent()"></div>
            </div>
            <span class="progress-labeled__value">{{ scorePercent() }}%</span>
          </div>

          <div class="flex flex-wrap gap-6 justify-center mt-6">
            <div>
              <div class="font-mono text-2xl font-bold text-on-dark">{{ correctCount() }}</div>
              <div class="text-on-dark-muted text-[0.8125rem]">Correctas</div>
            </div>
            <div>
              <div class="font-mono text-2xl font-bold text-red-400">{{ incorrectCount() }}</div>
              <div class="text-on-dark-muted text-[0.8125rem]">Incorrectas</div>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap gap-3 justify-center">
          <button class="btn btn-primary" (click)="retry()">Reintentar Practica</button>
          <a
            class="btn btn-secondary"
            [routerLink]="['/exam/start']"
            [queryParams]="{ trackId: trackId }"
            >Ir a Modo Examen</a
          >
          <a class="btn btn-ghost" [routerLink]="['/tracks', trackId]">Volver al Track</a>
        </div>
      } @else if (questions().length === 0) {
        <!-- No Questions Available -->
        <div class="page-header">
          <h1 class="page-header__title font-display">Ejercicios de Practica</h1>
          <p class="page-header__desc">{{ track()?.title ?? '' }}</p>
        </div>

        <div class="card-section">
          <div class="empty-state">
            <div class="empty-state__icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                stroke-linejoin="round">
                <path
                  d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
                />
              </svg>
            </div>
            <h3 class="empty-state__title">Sin Preguntas de Practica Disponibles</h3>
            <p class="empty-state__desc">Aun no hay preguntas de practica para este track.</p>
          </div>

          <div class="flex flex-wrap gap-3 mt-5">
            <a class="btn btn-primary" [routerLink]="['/study/flashcards', trackId]"
              >Probar Flashcards</a
            >
            <a class="btn btn-secondary" [routerLink]="['/tracks', trackId]">Volver al Track</a>
          </div>
        </div>
      } @else {
        <!-- Practice Mode - Active -->
        <div class="page-header">
          <h1 class="page-header__title font-display">Practica: {{ track()?.title ?? 'Track' }}</h1>
          <p class="page-header__desc">
            Pregunta {{ currentIndex() + 1 }} de {{ questions().length }}
            <span class="text-pine ml-3">
              {{ correctCount() }} correctas, {{ incorrectCount() }} incorrectas
            </span>
          </p>
        </div>

        <!-- Progress Bar -->
        <div class="progress-labeled">
          <div class="progress">
            <div class="progress__bar" [style.width.%]="progressPercent()"></div>
          </div>
          <span class="progress-labeled__value"
            >{{ currentIndex() + 1 }}/{{ questions().length }}</span
          >
        </div>

        <!-- Question Card -->
        <div class="card animate-fadeInUp">
          <div class="flex items-center gap-2 mb-4">
            <span class="badge badge-info">{{ currentQuestion()!.domainCode }}</span>
            <span class="tag">{{ currentQuestion()!.difficulty }}</span>
          </div>

          @if (currentQuestion()!.context) {
            <div class="alert alert-info mb-4">
              <div class="alert__content">
                <span>{{ currentQuestion()!.context }}</span>
              </div>
            </div>
          }

          <p class="font-semibold text-[1.0625rem] mb-1">
            {{ currentQuestion()!.text }}
          </p>
          @if (currentQuestion()!.textEs) {
            <p class="text-sm text-pine mb-5 py-2 px-3 bg-gray-50 rounded-lg border-l-[3px] border-moss leading-relaxed">
              {{ currentQuestion()!.textEs }}
            </p>
          }

          <!-- Options -->
          <div class="flex flex-col gap-2">
            @for (option of currentQuestion()!.options; track option.id) {
              <button
                class="card-compact w-full text-left cursor-pointer border-2 border-transparent transition-all"
                [class.option-selected]="selectedOptionId() === option.id"
                [class.option-correct]="
                  answered() && option.id === currentQuestion()!.correctOptionId
                "
                [class.option-incorrect]="
                  answered() &&
                  selectedOptionId() === option.id &&
                  option.id !== currentQuestion()!.correctOptionId
                "
                [disabled]="answered()"
                (click)="selectOption(option.id)"
                [attr.aria-label]="'Opcion ' + getOptionLabel(option.order) + ': ' + option.text"
              >
                <div class="flex items-start gap-2">
                  @if (answered() && option.id === currentQuestion()!.correctOptionId) {
                    <span class="text-green-600 shrink-0 font-bold">&#10003;</span>
                  } @else if (
                    answered() &&
                    selectedOptionId() === option.id &&
                    option.id !== currentQuestion()!.correctOptionId
                  ) {
                    <span class="text-red-500 shrink-0 font-bold">&#10007;</span>
                  } @else {
                    <span class="shrink-0 invisible">&#10003;</span>
                  }
                  <div class="flex-1">
                    <span>{{ option.text }}</span>
                    @if (option.textEs) {
                      <div class="text-xs text-pine mt-0.5 italic">{{ option.textEs }}</div>
                    }
                  </div>
                </div>
              </button>
            }
          </div>

          <!-- Explanation (shown after answering) -->
          @if (answered()) {
            <div class="alert alert-info animate-fadeInUp mt-5">
              <div class="alert__content">
                <div class="alert__title">
                  {{ isCurrentCorrect() ? 'Correcto!' : 'Incorrecto' }}
                </div>
                @if (currentQuestion()!.explanationEs) {
                  <div class="mb-2">{{ currentQuestion()!.explanationEs }}</div>
                  <div class="text-xs text-gray-500 border-t border-gray-100 pt-2">
                    <strong>EN:</strong> {{ currentQuestion()!.explanation }}
                  </div>
                } @else {
                  <span>{{ currentQuestion()!.explanation }}</span>
                }
              </div>
            </div>
          }
        </div>

        <!-- Navigation -->
        <div class="flex justify-between gap-3">
          <div>
            @if (currentIndex() > 0) {
              <button class="btn btn-ghost" (click)="goToPrevious()">Anterior</button>
            }
          </div>
          <div>
            @if (answered()) {
              @if (isLastQuestion()) {
                <button class="btn btn-primary" (click)="finishPractice()">
                  Finalizar Practica
                </button>
              } @else {
                <button class="btn btn-primary" (click)="goToNext()">Siguiente Pregunta</button>
              }
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .option-selected {
        border-color: var(--forest-300, #C9D1C8) !important;
      }
      .option-correct {
        border-color: #16a34a !important;
        background: #f0fdf4 !important;
      }
      .option-incorrect {
        border-color: #ef4444 !important;
        background: #fef2f2 !important;
      }
      button.card-compact:hover:not(:disabled) {
        border-color: var(--forest-300, #C9D1C8);
      }
      button.card-compact:disabled {
        cursor: default;
      }
    `,
  ],
})
export class TrackPracticeComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private curriculum = inject(CurriculumService);
  private questionBank = inject(QuestionBankService);
  private logger = inject(LoggingService);

  /** Route param */
  trackId = this.route.snapshot.paramMap.get('trackId') ?? '';

  /** State signals */
  loading = signal(true);
  error = signal<string | null>(null);
  track = signal<LearningTrack | undefined>(undefined);
  questions = signal<Question[]>([]);
  currentIndex = signal(0);
  selectedOptionId = signal<string | null>(null);
  answered = signal(false);
  completed = signal(false);

  /** Track answers per question index: stores { selectedOptionId, isCorrect } */
  private answers = signal<Map<number, { selectedOptionId: string; isCorrect: boolean }>>(
    new Map(),
  );

  /** Computed values */
  currentQuestion = computed(() => {
    const qs = this.questions();
    const idx = this.currentIndex();
    return qs.length > 0 ? qs[idx] : null;
  });

  correctCount = computed(() => {
    let count = 0;
    for (const answer of this.answers().values()) {
      if (answer.isCorrect) count++;
    }
    return count;
  });

  incorrectCount = computed(() => {
    let count = 0;
    for (const answer of this.answers().values()) {
      if (!answer.isCorrect) count++;
    }
    return count;
  });

  scorePercent = computed(() => {
    const total = this.answers().size;
    return total > 0 ? Math.round((this.correctCount() / total) * 100) : 0;
  });

  progressPercent = computed(() => {
    const total = this.questions().length;
    return total > 0 ? Math.round(((this.currentIndex() + 1) / total) * 100) : 0;
  });

  isCurrentCorrect = computed(() => {
    const q = this.currentQuestion();
    return q ? this.selectedOptionId() === q.correctOptionId : false;
  });

  isLastQuestion = computed(() => {
    return this.currentIndex() >= this.questions().length - 1;
  });

  /** Obtiene la etiqueta de la opcion (A, B, C, D) */
  protected getOptionLabel = getOptionLabel;

  ngOnInit(): void {
    if (!this.trackId) {
      this.error.set('No se proporciono ID de track.');
      this.loading.set(false);
      return;
    }

    // Load catalog first, then track info and questions
    this.curriculum
      .loadCatalog()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          const trackInfo = this.curriculum.getTrackById(this.trackId);
          this.track.set(trackInfo);
          this._loadQuestions();
        },
        error: (err) => {
          this.logger.error('loadCatalog error', 'TrackPractice', err);
          // Still try to load questions even if catalog fails
          this._loadQuestions();
        },
      });
  }

  selectOption(optionId: string): void {
    if (this.answered()) return;

    this.selectedOptionId.set(optionId);
    this.answered.set(true);

    // Record result with the selected option
    const q = this.currentQuestion();
    const isCorrect = q ? optionId === q.correctOptionId : false;
    const newAnswers = new Map(this.answers());
    newAnswers.set(this.currentIndex(), { selectedOptionId: optionId, isCorrect });
    this.answers.set(newAnswers);
  }

  goToNext(): void {
    if (this.currentIndex() < this.questions().length - 1) {
      this.currentIndex.set(this.currentIndex() + 1);
      this._resetQuestionState();
    }
  }

  goToPrevious(): void {
    if (this.currentIndex() > 0) {
      this.currentIndex.set(this.currentIndex() - 1);
      this._restoreQuestionState();
    }
  }

  finishPractice(): void {
    this.completed.set(true);
  }

  retry(): void {
    this.currentIndex.set(0);
    this.selectedOptionId.set(null);
    this.answered.set(false);
    this.completed.set(false);
    this.answers.set(new Map());

    // Shuffle questions for a fresh experience
    this.questions.set(shuffleArray(this.questions()));
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private _loadQuestions(): void {
    // Load ALL questions for this track (no contentType filter)
    this.questionBank
      .getQuestionsByTrack(this.trackId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (questions) => {
          if (questions.length > 0) {
            this.questions.set(shuffleArray(questions));
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Error al cargar las preguntas para este track.');
          this.loading.set(false);
          this.logger.error('getQuestionsByTrack error', 'TrackPractice', err);
        },
      });
  }

  private _resetQuestionState(): void {
    const idx = this.currentIndex();
    const prevAnswer = this.answers().get(idx);

    if (prevAnswer) {
      // Already answered this question, restore state
      this.selectedOptionId.set(prevAnswer.selectedOptionId);
      this.answered.set(true);
    } else {
      this.selectedOptionId.set(null);
      this.answered.set(false);
    }
  }

  private _restoreQuestionState(): void {
    const idx = this.currentIndex();
    const prevAnswer = this.answers().get(idx);

    if (prevAnswer) {
      this.selectedOptionId.set(prevAnswer.selectedOptionId);
      this.answered.set(true);
    } else {
      this.selectedOptionId.set(null);
      this.answered.set(false);
    }
  }
}
