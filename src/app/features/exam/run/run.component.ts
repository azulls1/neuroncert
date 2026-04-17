import {
  Component,
  OnInit,
  DestroyRef,
  inject,
  signal,
  computed,
  HostListener,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ExamStateService } from '../../../core/services';
import { ExamParams, ExamQuestion } from '../../../core/models';
import {
  TimerBadgeComponent,
  ProgressStepsComponent,
  QuestionCardComponent,
} from '../../../shared';
import { LoggingService } from '../../../core/services/logging.service';

/**
 * RunComponent - Exam execution screen
 * Displays questions, timer, navigation and progress using Forest DS classes.
 * Uses ONLY ExamStateService for all exam logic.
 */
@Component({
  selector: 'app-run',
  standalone: true,
  imports: [CommonModule, TimerBadgeComponent, ProgressStepsComponent, QuestionCardComponent],
  template: `
    <!-- Header -->
    <header class="card card-compact mb-4">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="font-display text-lg font-bold">Simulador CCA-F Claude AI</h1>
          <p class="text-sm text-forest">Examen en progreso</p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex flex-wrap items-center gap-2">
            <span class="badge badge-info">
              {{ examState().progress.answered }} / {{ examState().progress.total }} respondidas
            </span>
            <span class="badge badge-warning"> {{ examState().progress.flagged }} marcadas </span>
          </div>
          <app-timer-badge
            [remainingSeconds]="examState().timer.remainingTime"
            [showProgress]="true"
          ></app-timer-badge>
        </div>
      </div>
    </header>

    <!-- Progress bar -->
    <div class="progress-labeled mb-6">
      <div class="progress">
        <div
          class="progress__bar"
          [style.width.%]="
            examState().progress.total > 0
              ? (examState().progress.answered / examState().progress.total) * 100
              : 0
          "
        ></div>
      </div>
      <span class="progress-labeled__value">
        {{
          examState().progress.total > 0
            ? ((examState().progress.answered / examState().progress.total) * 100 | number: '1.0-0')
            : 0
        }}% completado
      </span>
    </div>

    <!-- Error messages (assertive for screen readers) -->
    @if (errorMessage()) {
      <div
        role="alert"
        aria-live="assertive"
        class="alert alert-error mb-4"
      >
        <div class="alert__content">{{ errorMessage() }}</div>
      </div>
    }

    <!-- Main content -->
    <div class="exam-layout" [attr.aria-busy]="!currentQuestion()">
      <!-- Question area (primary) -->
      <main>
        @if (currentQuestion()) {
          <app-question-card
            [question]="currentQuestion()!"
            [questionNumber]="examState().currentIndex + 1"
            [domainName]="getDomainName(currentQuestion()!.domainCode)"
            (optionSelected)="onOptionSelected($event)"
            (flagToggled)="onFlagToggled()"
          ></app-question-card>

          <!-- Navigation -->
          <nav class="flex items-center justify-between mt-6">
            <button
              type="button"
              class="btn btn-secondary"
              [disabled]="!examState().navigation.canGoPrevious"
              (click)="goToPrevious()"
              aria-label="Pregunta anterior"
            >
              &larr; Anterior
            </button>

            <span class="text-sm text-forest">
              <strong>{{ examState().currentIndex + 1 }}</strong> de
              <strong>{{ examState().questions.length }}</strong>
            </span>

            <button
              type="button"
              class="btn btn-primary"
              [disabled]="!examState().navigation.canGoNext"
              (click)="goToNext()"
              aria-label="Siguiente pregunta"
            >
              Siguiente &rarr;
            </button>
          </nav>
        } @else {
          <div
            class="empty-state animate-fadeInUp"
            role="status"
            aria-busy="true"
            aria-live="polite"
          >
            <div class="loading-dots"><span></span><span></span><span></span></div>
            <p class="empty-state__desc">Cargando pregunta...</p>
          </div>
        }
      </main>

      <!-- Sidebar (secondary) -->
      <aside class="exam-sidebar">
        <app-progress-steps
          [totalQuestions]="examState().questions.length"
          [answeredQuestions]="answeredIndices()"
          [flaggedQuestions]="flaggedIndices()"
          [currentQuestionIndex]="examState().currentIndex"
          [onQuestionClick]="goToQuestion.bind(this)"
        ></app-progress-steps>
      </aside>
    </div>

    <!-- Footer action bar -->
    <footer class="action-bar mt-8 flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="btn btn-secondary"
          (click)="togglePause()"
          [disabled]="examState().status !== 'running' && examState().status !== 'paused'"
        >
          {{ examState().status === 'paused' ? 'Reanudar' : 'Pausar' }}
        </button>

        <button
          type="button"
          class="btn btn-primary"
          (click)="goToSubmit()"
          [disabled]="examState().status !== 'running' && examState().status !== 'paused'"
        >
          Finalizar Examen
        </button>
      </div>

      <div class="flex flex-wrap gap-3 text-sm text-forest">
        <span>
          <strong>{{ examState().progress.answered }}</strong> Respondidas
        </span>
        <span>
          <strong>{{ examState().progress.flagged }}</strong> Marcadas
        </span>
        <span>
          <strong>{{ examState().progress.total - examState().progress.answered }}</strong>
          Restantes
        </span>
      </div>
    </footer>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .exam-layout {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }
      .exam-sidebar {
        height: fit-content;
        order: -1;
      }
      @media (min-width: 1024px) {
        .exam-layout {
          grid-template-columns: 1fr 280px;
          gap: 2rem;
        }
        .exam-sidebar {
          position: sticky;
          top: 4.5rem;
          order: 2;
        }
      }
    `,
  ],
})
export class RunComponent implements OnInit {
  // Dependencies (Angular 20 inject style)
  private examStateService = inject(ExamStateService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private logger = inject(LoggingService);

  // Error message signal for accessible error announcements
  errorMessage = signal<string | null>(null);

  // Use service signals directly + observable for timer
  private _timerState = signal<{ remainingTime: number }>({ remainingTime: 0 });

  // Expose service signals as a combined state for the template
  examState = computed(() => ({
    status: this.examStateService.status(),
    questions: this.examStateService.questions(),
    currentIndex: this.examStateService.currentIndex(),
    progress: this.examStateService.progress(),
    navigation: this.examStateService.navigation(),
    timer: this._timerState(),
  }));

  // Computed signals
  currentQuestion = computed(() => {
    return this.examStateService.currentQuestion() ?? null;
  });

  answeredIndices = computed(() => {
    return this.examStateService
      .questions()
      .map((q: ExamQuestion, i: number) => (q.selectedOptionId ? i : -1))
      .filter((i: number) => i !== -1);
  });

  flaggedIndices = computed(() => {
    return this.examStateService
      .questions()
      .map((q: ExamQuestion, i: number) => (q.flagged ? i : -1))
      .filter((i: number) => i !== -1);
  });

  // --- Lifecycle ---

  ngOnInit(): void {
    // Check for exam params passed via navigation state
    const navigationState = this.router.getCurrentNavigation()?.extras?.state;

    if (navigationState?.['examParams']) {
      this.startExam(navigationState['examParams']);
    } else {
      // If no params, check whether an exam is already in progress
      const currentState = this.examStateService.getState();
      if (currentState.status === 'idle') {
        this.router.navigate(['/exam/start']);
        return;
      }
    }

    // Subscribe to timer updates only (auto-unsubscribed via DestroyRef)
    this.examStateService.examState$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => {
        this._timerState.set({ remainingTime: state.timer.remainingTime });
      });
  }

  /**
   * Previene el cierre accidental de la pestana/ventana durante un examen activo
   */
  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    const status = this.examStateService.status();
    if (status === 'running' || status === 'paused') {
      event.preventDefault();
    }
  }

  // --- Actions ---

  private startExam(params: ExamParams): void {
    this.examStateService.startExam(params).subscribe({
      next: () => {
        this.logger.info('Examen iniciado exitosamente', 'Run');
      },
      error: (error) => {
        this.logger.error('Error iniciando examen', 'Run', error);
        this.errorMessage.set('Error al iniciar el examen. Redirigiendo...');
        this.router.navigate(['/exam/start']);
      },
    });
  }

  getDomainName(domainCode: string): string {
    return domainCode;
  }

  onOptionSelected(optionId: string): void {
    this.examStateService.selectOption(optionId);
  }

  onFlagToggled(): void {
    this.examStateService.toggleFlag();
  }

  goToPrevious(): void {
    this.examStateService.previous();
  }

  goToNext(): void {
    this.examStateService.next();
  }

  goToQuestion(index: number): void {
    this.examStateService.goToQuestion(index);
  }

  togglePause(): void {
    const state = this.examState();
    if (state.status === 'running') {
      this.examStateService.pauseExam();
    } else if (state.status === 'paused') {
      this.examStateService.resumeExam();
    }
  }

  goToSubmit(): void {
    this.router.navigate(['/exam/submit']);
  }

  /**
   * Keyboard shortcuts para navegacion del examen
   * N = siguiente pregunta, P = pregunta anterior
   * Solo se activan cuando no hay un input/textarea con focus
   */
  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    // No interceptar si el usuario está escribiendo en un input o textarea
    const target = event.target as HTMLElement;
    const tagName = target?.tagName?.toLowerCase();
    if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
      return;
    }

    const state = this.examState();
    if (state.status !== 'running') return;

    switch (event.key.toLowerCase()) {
      case 'n':
        if (state.navigation.canGoNext) {
          event.preventDefault();
          this.goToNext();
        }
        break;
      case 'p':
        if (state.navigation.canGoPrevious) {
          event.preventDefault();
          this.goToPrevious();
        }
        break;
    }
  }
}
