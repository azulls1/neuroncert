import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Estado de una pregunta en el progreso
 */
export interface QuestionStatus {
  index: number;
  answered: boolean;
  flagged: boolean;
  current: boolean;
}

/**
 * Componente ProgressSteps - Muestra el progreso del examen
 * Permite navegación rápida entre preguntas
 */
@Component({
  selector: 'app-progress-steps',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card-section" role="navigation" aria-label="Progreso del examen">
      <!-- Header del progreso -->
      <div class="mb-3">
        <h3 class="font-display text-sm font-bold text-gray-900 m-0 mb-2">Progreso</h3>
        <div class="flex gap-2 justify-between">
          <div
            class="flex flex-col items-center text-center flex-1 py-1.5 px-1 bg-gray-50 rounded-lg"
          >
            <span class="text-lg font-bold leading-none text-forest">{{ answeredCount() }}</span>
            <span class="text-[10px] text-gray-700 mt-0.5">Resp.</span>
          </div>
          <div
            class="flex flex-col items-center text-center flex-1 py-1.5 px-1 bg-gray-50 rounded-lg"
          >
            <span class="text-lg font-bold leading-none text-amber-600">{{ flaggedCount() }}</span>
            <span class="text-[10px] text-gray-700 mt-0.5">Marc.</span>
          </div>
          <div
            class="flex flex-col items-center text-center flex-1 py-1.5 px-1 bg-gray-50 rounded-lg"
          >
            <span class="text-lg font-bold leading-none text-gray-700">{{
              remainingCount()
            }}</span>
            <span class="text-[10px] text-gray-700 mt-0.5">Rest.</span>
          </div>
        </div>
      </div>

      <!-- Barra de progreso general -->
      <div class="progress-labeled mb-4">
        <div class="progress progress--success">
          <div class="progress__bar" [style.width.%]="progressPercentage()"></div>
        </div>
        <span class="progress-labeled__value">{{ progressPercentage() }}%</span>
      </div>

      <!-- Grid de preguntas -->
      <div
        class="ps-questions-grid mb-4"
        role="group"
        aria-label="Navegacion de preguntas"
        (keydown)="onGridKeydown($event)"
      >
        @for (status of questionStatuses(); track status.index) {
          <button
            type="button"
            class="pagination__btn ps-grid-btn"
            [class.ps-answered]="status.answered"
            [class.ps-flagged]="status.flagged"
            [class.ps-current]="status.current"
            [attr.aria-label]="getQuestionAriaLabel(status)"
            (click)="onQuestionClick()(status.index)"
          >
            <span class="text-xs font-semibold">{{ status.index + 1 }}</span>
            @if (status.flagged) {
              <span
                class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center leading-none"
                aria-label="Marcada para revisar"
                >!</span
              >
            }
          </button>
        }
      </div>

      <!-- Leyenda -->
      <div class="divider-subtle mb-3"></div>
      <div class="grid grid-cols-2 gap-1.5">
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-3 rounded-full bg-forest border border-forest"></div>
          <span class="text-xs text-gray-700">Respondida</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-3 rounded-full bg-amber-600 border border-amber-700"></div>
          <span class="text-xs text-gray-700">Marcada</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-3 rounded-full bg-gray-50 border-2 border-forest"></div>
          <span class="text-xs text-gray-700">Actual</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-3 rounded-full bg-white border border-gray-200"></div>
          <span class="text-xs text-gray-700">Sin responder</span>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .ps-questions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(36px, 1fr));
        gap: 6px;
        max-height: 192px;
        overflow-y: auto;
        padding: 4px;
      }

      .ps-grid-btn {
        position: relative;
        width: 36px;
        height: 36px;
        border: 2px solid var(--color-border);
        border-radius: var(--radius-md);
        background: var(--color-bg-surface);
        color: var(--color-text-accent);
        cursor: pointer;
        transition: all var(--duration-normal) var(--ease-apple);
      }

      .ps-grid-btn:hover:not(:disabled) {
        background: var(--color-bg-hover);
        border-color: var(--color-text-accent);
      }

      .ps-grid-btn.ps-answered {
        background: var(--forest-900);
        border-color: var(--forest-900);
        color: white;
      }

      .ps-grid-btn.ps-flagged {
        background: #d97706;
        border-color: #b45309;
        color: white;
      }

      .ps-grid-btn.ps-current {
        border-color: var(--forest-900);
        background: var(--forest-50);
        color: var(--forest-900);
        box-shadow: 0 0 0 2px rgba(4, 32, 44, 0.2);
      }

      @media (max-width: 1023px) {
        .ps-questions-grid {
          grid-template-columns: repeat(auto-fill, minmax(32px, 1fr));
          max-height: 120px;
        }
      }
    `,
  ],
})
export class ProgressStepsComponent {
  // Inputs
  totalQuestions = input.required<number>();
  answeredQuestions = input.required<number[]>();
  flaggedQuestions = input.required<number[]>();
  currentQuestionIndex = input.required<number>();
  onQuestionClick = input.required<(index: number) => void>();

  /**
   * Computed: Estado de todas las preguntas
   */
  questionStatuses = computed(() => {
    const total = this.totalQuestions();
    const answered = this.answeredQuestions();
    const flagged = this.flaggedQuestions();
    const current = this.currentQuestionIndex();

    return Array.from({ length: total }, (_, index) => ({
      index,
      answered: answered.includes(index),
      flagged: flagged.includes(index),
      current: index === current,
    }));
  });

  /**
   * Computed: Número de preguntas respondidas
   */
  answeredCount = computed(() => {
    return this.answeredQuestions().length;
  });

  /**
   * Computed: Número de preguntas marcadas
   */
  flaggedCount = computed(() => {
    return this.flaggedQuestions().length;
  });

  /**
   * Computed: Número de preguntas restantes
   */
  remainingCount = computed(() => {
    return this.totalQuestions() - this.answeredCount();
  });

  /**
   * Computed: Porcentaje de progreso
   */
  progressPercentage = computed(() => {
    const total = this.totalQuestions();
    if (total === 0) return 0;
    return Math.round((this.answeredCount() / total) * 100);
  });

  /**
   * Genera el label de accesibilidad para una pregunta
   */
  getQuestionAriaLabel(status: QuestionStatus): string {
    const questionNum = status.index + 1;
    let label = `Pregunta ${questionNum}`;

    if (status.current) {
      label += ', pregunta actual';
    }

    if (status.answered) {
      label += ', respondida';
    }

    if (status.flagged) {
      label += ', marcada para revisar';
    }

    return label;
  }

  /**
   * Maneja la navegacion con flechas izquierda/derecha entre botones del grid
   */
  onGridKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    if (!target || target.tagName !== 'BUTTON') return;

    const grid = target.closest('.ps-questions-grid');
    if (!grid) return;

    const buttons = Array.from(grid.querySelectorAll('button')) as HTMLButtonElement[];
    const currentIndex = buttons.indexOf(target as HTMLButtonElement);
    if (currentIndex === -1) return;

    let nextIndex = -1;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      nextIndex = (currentIndex + 1) % buttons.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
    } else if (event.key === 'Home') {
      event.preventDefault();
      nextIndex = 0;
    } else if (event.key === 'End') {
      event.preventDefault();
      nextIndex = buttons.length - 1;
    }

    if (nextIndex !== -1) {
      buttons[nextIndex].focus();
    }
  }
}
