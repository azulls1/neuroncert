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
    <header class="card card-compact" style="margin-bottom: 1rem;">
      <div
        style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;"
      >
        <div>
          <h1 class="h4">Simulador CCA-F Claude AI</h1>
          <p class="text-muted">Examen en progreso</p>
        </div>
        <div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;">
          <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;">
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
    <div class="progress-labeled" style="margin-bottom: 1.5rem;">
      <div class="progress-bar">
        <div
          class="progress-fill"
          [style.width.%]="
            examState().progress.total > 0
              ? (examState().progress.answered / examState().progress.total) * 100
              : 0
          "
        ></div>
      </div>
      <span class="progress-text">
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
        class="badge badge-error"
        style="margin-bottom: 1rem; display: block; padding: 0.75rem 1rem;"
      >
        {{ errorMessage() }}
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
          <nav
            class="pagination"
            style="margin-top:1.5rem;display:flex;justify-content:space-between;align-items:center;"
          >
            <button
              type="button"
              class="btn btn-outline"
              [disabled]="!examState().navigation.canGoPrevious"
              (click)="goToPrevious()"
              aria-label="Pregunta anterior"
            >
              &larr; Anterior
            </button>

            <span class="text-muted">
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
            class="loading-dots"
            role="status"
            aria-busy="true"
            aria-live="polite"
            style="padding:2rem;text-align:center;"
          >
            <span>Cargando pregunta...</span>
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
    <footer
      class="action-bar"
      style="margin-top:2rem;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.75rem;"
    >
      <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
        <button
          type="button"
          class="btn btn-outline"
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

      <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">
        <span class="text-muted">
          <strong>{{ examState().progress.answered }}</strong> Respondidas
        </span>
        <span class="text-muted">
          <strong>{{ examState().progress.flagged }}</strong> Marcadas
        </span>
        <span class="text-muted">
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
        console.log('Examen iniciado exitosamente');
      },
      error: (error) => {
        console.error('Error iniciando examen:', error);
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
