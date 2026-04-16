import { Component, DestroyRef, OnInit, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Question } from '../../../core/models';
import { QuestionBankService } from '../../../core/services';
import { FlashcardCardComponent } from '../../../shared/flashcard-card/flashcard-card.component';

/**
 * FlashcardComponent - Pagina de estudio con flashcards
 * Carga preguntas de un track y permite navegar entre ellas con flip 3D.
 */
@Component({
  selector: 'app-flashcard',
  standalone: true,
  imports: [CommonModule, FlashcardCardComponent],
  template: `
    <div class="page-medium">
      <!-- Header -->
      <div class="page-header animate-fadeInUp">
        <h1 class="page-header__title">Flashcards</h1>
        <p class="page-header__desc">
          Modo estudio para el track: <strong class="text-forest">{{ trackId() }}</strong>
        </p>
      </div>

      @if (loading()) {
        <div class="card-section" style="text-align: center; padding: 60px 20px;">
          <p style="font-size: 16px; color: var(--color-text-muted);">Cargando flashcards...</p>
        </div>
      } @else if (filteredQuestions().length === 0) {
        <div class="card-section animate-fadeInUp" style="text-align: center; padding: 60px 20px;">
          <p style="font-size: 16px; color: var(--color-text-muted); margin-bottom: 16px;">
            No se encontraron flashcards para este track.
          </p>
          <button type="button" class="btn btn-secondary" (click)="goBack()">
            Volver a Tracks
          </button>
        </div>
      } @else {
        <!-- Progress -->
        <div class="animate-fadeInUp" style="margin-bottom: 24px;" role="status" aria-live="polite" [attr.aria-label]="'Progreso: tarjeta ' + (currentIndex() + 1) + ' de ' + filteredQuestions().length">
          <div class="progress-labeled">
            <span class="progress-labeled__value font-mono">
              {{ currentIndex() + 1 }} de {{ filteredQuestions().length }}
            </span>
          </div>
          <div class="progress" role="progressbar" [attr.aria-valuenow]="progressPercent()" aria-valuemin="0" aria-valuemax="100" [attr.aria-label]="'Progreso: ' + progressPercent() + '%'" style="margin-top: 8px;">
            <div class="progress__bar" [style.width.%]="progressPercent()"></div>
          </div>
        </div>

        <!-- Flashcard -->
        <div class="animate-scaleIn">
          <app-flashcard-card
            [question]="currentQuestion()!"
            [showAnswer]="showAnswer()"
            [index]="currentIndex()"
            [total]="filteredQuestions().length"
            (flip)="toggleFlip()"
            (next)="goNext()"
            (previous)="goPrevious()"
          />
        </div>

        <!-- Difficulty filter -->
        <div class="animate-fadeInUp" style="margin-top: 28px;">
          <div
            style="font-size: 13px; font-weight: 600; color: var(--color-text-secondary); margin-bottom: 8px;"
          >
            Filtrar por dificultad
          </div>
          <div class="filter-pills" role="group" aria-label="Filtrar por dificultad">
            @for (pill of difficultyPills; track pill.value) {
              <button
                type="button"
                class="filter-pill"
                [class.filter-pill--active]="selectedDifficulty() === pill.value"
                (click)="setDifficulty(pill.value)"
                [attr.aria-label]="'Filtrar dificultad: ' + pill.label"
                [attr.aria-pressed]="selectedDifficulty() === pill.value"
              >
                {{ pill.label }}
              </button>
            }
          </div>
        </div>

        <!-- Stats -->
        <div class="divider" style="margin: 24px 0;"></div>
        <div
          class="animate-fadeInUp"
          style="display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 24px;"
        >
          <div class="card-stat">
            <span class="font-mono text-forest" style="font-size: 24px; font-weight: 700;">{{
              reviewedCount()
            }}</span>
            <span style="font-size: 13px; color: var(--color-text-muted);">Revisadas</span>
          </div>
          <div class="card-stat">
            <span class="font-mono text-pine" style="font-size: 24px; font-weight: 700;">{{
              remainingCount()
            }}</span>
            <span style="font-size: 13px; color: var(--color-text-muted);">Pendientes</span>
          </div>
          <div class="card-stat">
            <span class="font-mono" style="font-size: 24px; font-weight: 700;">{{
              filteredQuestions().length
            }}</span>
            <span style="font-size: 13px; color: var(--color-text-muted);">Total</span>
          </div>
        </div>
      }

      <!-- Back button -->
      <div style="margin-top: 16px;">
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
      .filter-pill--active {
        background: var(--forest-900) !important;
        color: white !important;
        border-color: var(--forest-900) !important;
      }
    `,
  ],
})
export class FlashcardComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private questionBank = inject(QuestionBankService);

  // State signals
  trackId = signal('');
  allQuestions = signal<Question[]>([]);
  currentIndex = signal(0);
  showAnswer = signal(false);
  selectedDifficulty = signal<string>('all');
  loading = signal(true);
  reviewedSet = signal<Set<number>>(new Set());

  // Difficulty filter pills
  readonly difficultyPills = [
    { value: 'all', label: 'Todas' },
    { value: 'easy', label: 'Facil' },
    { value: 'medium', label: 'Medio' },
    { value: 'hard', label: 'Dificil' },
  ];

  // Computed
  filteredQuestions = computed(() => {
    const diff = this.selectedDifficulty();
    const all = this.allQuestions();
    if (diff === 'all') return all;
    return all.filter((q) => q.difficulty === diff);
  });

  currentQuestion = computed(() => {
    const questions = this.filteredQuestions();
    const idx = this.currentIndex();
    return questions.length > 0 ? questions[idx] : null;
  });

  progressPercent = computed(() => {
    const total = this.filteredQuestions().length;
    if (total === 0) return 0;
    return Math.round(((this.currentIndex() + 1) / total) * 100);
  });

  reviewedCount = computed(() => this.reviewedSet().size);

  remainingCount = computed(() => {
    return this.filteredQuestions().length - this.reviewedSet().size;
  });

  ngOnInit(): void {
    const trackId = this.route.snapshot.paramMap.get('trackId') ?? '';
    this.trackId.set(trackId);

    this.questionBank.getFlashcards(trackId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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

  toggleFlip(): void {
    this.showAnswer.update((v) => !v);
    // Mark card as reviewed when flipped to answer
    if (this.showAnswer()) {
      this.reviewedSet.update((set) => {
        const next = new Set(set);
        next.add(this.currentIndex());
        return next;
      });
    }
  }

  goNext(): void {
    const max = this.filteredQuestions().length - 1;
    if (this.currentIndex() < max) {
      this.currentIndex.update((i) => i + 1);
      this.showAnswer.set(false);
    }
  }

  goPrevious(): void {
    if (this.currentIndex() > 0) {
      this.currentIndex.update((i) => i - 1);
      this.showAnswer.set(false);
    }
  }

  setDifficulty(value: string): void {
    this.selectedDifficulty.set(value);
    this.currentIndex.set(0);
    this.showAnswer.set(false);
  }

  goBack(): void {
    this.router.navigate(['/tracks']);
  }
}
