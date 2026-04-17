import { Component, DestroyRef, OnInit, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Question } from '../../../core/models';
import { QuestionBankService } from '../../../core/services';
import { getOptionLabel, getDifficultyLabel } from '../../../core/utils/exam.utils';

/**
 * ConceptReviewComponent - Guia de estudio con todas las preguntas y respuestas
 * Muestra preguntas con opciones, respuesta correcta destacada y explicacion.
 */
@Component({
  selector: 'app-concept-review',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-medium">
      <!-- Header -->
      <div class="page-header animate-fadeInUp">
        <h1 class="page-header__title">Revision de Conceptos</h1>
        <p class="page-header__desc">
          Guia de estudio para el track: <strong class="text-forest">{{ trackId() }}</strong>
          <span class="font-mono ml-2">({{ filteredQuestions().length }} preguntas)</span>
        </p>
      </div>

      @if (loading()) {
        <div class="card-section text-center py-16 px-5">
          <div class="loading-dots mx-auto"><span></span><span></span><span></span></div>
          <p class="text-gray-500 text-base mt-4">Cargando preguntas...</p>
        </div>
      } @else if (allQuestions().length === 0) {
        <div class="card-section animate-fadeInUp text-center py-16 px-5">
          <p class="text-gray-500 text-base mb-4">
            No se encontraron preguntas para este track.
          </p>
          <button type="button" class="btn btn-secondary" (click)="goBack()">
            Volver a Tracks
          </button>
        </div>
      } @else {
        <!-- Filters -->
        <div class="animate-fadeInUp mb-6">
          <!-- Domain filter -->
          <div class="mb-3">
            <div class="label mb-2">Filtrar por dominio</div>
            <div class="filter-pills" role="group" aria-label="Filtrar por dominio">
              <button
                type="button"
                class="filter-pill"
                [class.active]="selectedDomain() === 'all'"
                (click)="setDomain('all')"
                aria-label="Filtrar dominio: Todos"
                [attr.aria-pressed]="selectedDomain() === 'all'"
              >
                Todos
              </button>
              @for (domain of availableDomains(); track domain) {
                <button
                  type="button"
                  class="filter-pill"
                  [class.active]="selectedDomain() === domain"
                  (click)="setDomain(domain)"
                  [attr.aria-label]="'Filtrar dominio: ' + domain"
                  [attr.aria-pressed]="selectedDomain() === domain"
                >
                  {{ domain }}
                </button>
              }
            </div>
          </div>

          <!-- Difficulty filter -->
          <div>
            <div class="label mb-2">Filtrar por dificultad</div>
            <div class="filter-pills" role="group" aria-label="Filtrar por dificultad">
              @for (pill of difficultyPills; track pill.value) {
                <button
                  type="button"
                  class="filter-pill"
                  [class.active]="selectedDifficulty() === pill.value"
                  (click)="setDifficulty(pill.value)"
                  [attr.aria-label]="'Filtrar dificultad: ' + pill.label"
                  [attr.aria-pressed]="selectedDifficulty() === pill.value"
                >
                  {{ pill.label }}
                </button>
              }
            </div>
          </div>
        </div>

        <!-- Questions list -->
        <div class="stack-lg stagger-children">
          @for (question of paginatedQuestions(); track question.id; let i = $index) {
            <div class="card hover-lift animate-fadeInUp">
              <div class="card-section">
                <!-- Question header -->
                <div class="cr-header">
                  <span class="font-display text-forest text-base font-bold">
                    Pregunta {{ getGlobalIndex(i) }}
                  </span>
                  <div class="flex items-center gap-2">
                    <span class="tag font-mono">{{ question.domainCode }}</span>
                    <span
                      class="badge"
                      [ngClass]="{
                        'badge-active': question.difficulty === 'easy',
                        'badge-warning': question.difficulty === 'medium',
                        'badge-error': question.difficulty === 'hard',
                      }"
                    >
                      {{ getDifficultyLabel(question.difficulty) }}
                    </span>
                  </div>
                </div>

                <!-- Question text -->
                <h3 class="text-base font-semibold text-forest leading-relaxed mt-4 mb-1">
                  {{ question.text }}
                </h3>
                @if (question.textEs) {
                  <p class="text-[13px] text-pine mb-3 py-2 px-3 bg-gray-50 rounded-lg border-l-[3px] border-moss leading-relaxed">
                    {{ question.textEs }}
                  </p>
                }

                <!-- Options -->
                <div class="stack mb-4">
                  @for (option of question.options; track option.id) {
                    <div
                      class="cr-option"
                      [class.cr-option--correct]="option.id === question.correctOptionId"
                    >
                      <span
                        class="cr-option-label"
                        [class.text-forest]="option.id === question.correctOptionId"
                      >
                        {{ getOptionLabel(option.order) }}
                      </span>
                      <div class="flex-1">
                        <div class="text-sm leading-relaxed">{{ option.text }}</div>
                        @if (option.textEs) {
                          <div class="text-xs text-pine mt-0.5 italic">{{ option.textEs }}</div>
                        }
                      </div>
                      @if (option.id === question.correctOptionId) {
                        <span class="badge badge-active shrink-0">Correcta</span>
                      }
                    </div>
                  }
                </div>

                <!-- Explanation -->
                <div class="alert alert-info">
                  <div class="alert__content">
                    <div class="text-[13px] font-semibold mb-1">Explicacion</div>
                    @if (question.explanationEs) {
                      <div class="text-[13px] leading-relaxed mb-2">{{ question.explanationEs }}</div>
                      <div class="text-xs text-gray-500 border-t border-gray-100 pt-2">
                        <strong>EN:</strong> {{ question.explanation }}
                      </div>
                    } @else {
                      <div class="text-[13px] leading-relaxed">{{ question.explanation }}</div>
                    }
                  </div>
                </div>

                <!-- References -->
                @if (question.references && question.references.length > 0) {
                  <div class="mt-3">
                    <div class="label mb-1">Referencias:</div>
                    <ul class="list-none p-0 m-0">
                      @for (ref of question.references; track ref) {
                        <li class="text-xs text-gray-500 mb-0.5">{{ ref }}</li>
                      }
                    </ul>
                  </div>
                }
              </div>
            </div>
          }
        </div>

        <!-- Pagination -->
        @if (totalPages() > 1) {
          <nav class="pagination mt-8" aria-label="Paginacion de preguntas">
            <button
              type="button"
              class="pagination__btn"
              [disabled]="currentPage() <= 1"
              (click)="goToPage(currentPage() - 1)"
              aria-label="Pagina anterior"
            >
              Anterior
            </button>

            @for (page of pageNumbers(); track page) {
              <button
                type="button"
                class="pagination__btn"
                [class.active]="page === currentPage()"
                (click)="goToPage(page)"
                [attr.aria-label]="'Ir a pagina ' + page"
                [attr.aria-current]="page === currentPage() ? 'page' : null"
              >
                {{ page }}
              </button>
            }

            <button
              type="button"
              class="pagination__btn"
              [disabled]="currentPage() >= totalPages()"
              (click)="goToPage(currentPage() + 1)"
              aria-label="Pagina siguiente"
            >
              Siguiente
            </button>
          </nav>
        }
      }

      <!-- Back button -->
      <div class="mt-6">
        <button type="button" class="btn btn-secondary" (click)="goBack()">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clip-rule="evenodd"
            />
          </svg>
          Volver a Tracks
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .cr-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 10px;
      }
      .cr-option {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 10px 12px;
        border: 2px solid var(--color-border-subtle);
        border-radius: var(--radius-md);
        background: var(--color-bg-surface);
      }
      .cr-option--correct {
        border-color: #16a34a;
        background: #f0fdf4;
      }
      .cr-option-label {
        font-weight: 700;
        min-width: 20px;
        font-size: 14px;
      }
      @media (max-width: 768px) {
        .cr-header {
          flex-direction: column;
          align-items: flex-start;
        }
      }
    `,
  ],
})
export class ConceptReviewComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private questionBank = inject(QuestionBankService);

  // Config
  readonly PAGE_SIZE = 10;

  // State signals
  trackId = signal('');
  allQuestions = signal<Question[]>([]);
  selectedDomain = signal('all');
  selectedDifficulty = signal('all');
  currentPage = signal(1);
  loading = signal(true);

  // Difficulty pills
  readonly difficultyPills = [
    { value: 'all', label: 'Todas' },
    { value: 'easy', label: 'Facil' },
    { value: 'medium', label: 'Medio' },
    { value: 'hard', label: 'Dificil' },
  ];

  // Computed
  availableDomains = computed(() => {
    const domains = this.allQuestions().map((q) => q.domainCode);
    return [...new Set(domains)].sort();
  });

  filteredQuestions = computed(() => {
    let questions = this.allQuestions();
    const domain = this.selectedDomain();
    const diff = this.selectedDifficulty();

    if (domain !== 'all') {
      questions = questions.filter((q) => q.domainCode === domain);
    }
    if (diff !== 'all') {
      questions = questions.filter((q) => q.difficulty === diff);
    }
    return questions;
  });

  totalPages = computed(() => {
    return Math.max(1, Math.ceil(this.filteredQuestions().length / this.PAGE_SIZE));
  });

  paginatedQuestions = computed(() => {
    const start = (this.currentPage() - 1) * this.PAGE_SIZE;
    return this.filteredQuestions().slice(start, start + this.PAGE_SIZE);
  });

  pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    // Show at most 5 page buttons centered on current
    let startPage = Math.max(1, current - 2);
    let endPage = Math.min(total, startPage + 4);
    startPage = Math.max(1, endPage - 4);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  });

  ngOnInit(): void {
    const trackId = this.route.snapshot.paramMap.get('trackId') ?? '';
    this.trackId.set(trackId);

    this.questionBank
      .getQuestionsByTrack(trackId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (questions) => {
          this.allQuestions.set(questions);
          this.loading.set(false);
        },
        error: () => {
          this.allQuestions.set([]);
          this.loading.set(false);
        },
      });
  }

  setDomain(domain: string): void {
    this.selectedDomain.set(domain);
    this.currentPage.set(1);
  }

  setDifficulty(value: string): void {
    this.selectedDifficulty.set(value);
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Calcula el indice global de la pregunta (considerando paginacion)
   */
  getGlobalIndex(localIndex: number): number {
    return (this.currentPage() - 1) * this.PAGE_SIZE + localIndex + 1;
  }

  protected getDifficultyLabel = getDifficultyLabel;

  protected getOptionLabel = getOptionLabel;

  goBack(): void {
    this.router.navigate(['/tracks']);
  }
}
