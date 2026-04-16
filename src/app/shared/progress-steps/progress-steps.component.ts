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
      <div style="margin-bottom: 12px;">
        <h3
          class="font-display"
          style="font-size: 14px; font-weight: 700; color: var(--color-text-primary); margin: 0 0 8px 0;"
        >
          Progreso
        </h3>
        <div class="ps-stats">
          <div class="ps-stat-item">
            <span class="ps-stat-number text-forest">{{ answeredCount() }}</span>
            <span class="ps-stat-label">Resp.</span>
          </div>
          <div class="ps-stat-item">
            <span class="ps-stat-number" style="color: #D97706;">{{ flaggedCount() }}</span>
            <span class="ps-stat-label">Marc.</span>
          </div>
          <div class="ps-stat-item">
            <span class="ps-stat-number" style="color: var(--color-text-muted);">{{
              remainingCount()
            }}</span>
            <span class="ps-stat-label">Rest.</span>
          </div>
        </div>
      </div>

      <!-- Barra de progreso general -->
      <div class="progress-labeled" style="margin-bottom: 16px;">
        <div class="progress progress--success">
          <div class="progress__bar" [style.width.%]="progressPercentage()"></div>
        </div>
        <span class="progress-labeled__value">{{ progressPercentage() }}%</span>
      </div>

      <!-- Grid de preguntas -->
      <div
        class="ps-questions-grid"
        role="group"
        aria-label="Navegacion de preguntas"
        (keydown)="onGridKeydown($event)"
        style="margin-bottom: 16px;"
      >
        @for (status of questionStatuses(); track status.index) {
          <button
            type="button"
            class="pagination__btn"
            [class.ps-answered]="status.answered"
            [class.ps-flagged]="status.flagged"
            [class.ps-current]="status.current"
            [attr.aria-label]="getQuestionAriaLabel(status)"
            (click)="onQuestionClick()(status.index)"
          >
            <span style="font-size: 12px; font-weight: 600;">{{ status.index + 1 }}</span>
            @if (status.flagged) {
              <span class="ps-flag-indicator" aria-label="Marcada para revisar">!</span>
            }
          </button>
        }
      </div>

      <!-- Leyenda -->
      <div class="divider-subtle" style="margin-bottom: 12px;"></div>
      <div class="ps-legend">
        <div class="ps-legend-item">
          <div class="ps-legend-dot ps-legend-dot--answered"></div>
          <span style="font-size: 12px; color: var(--color-text-muted);">Respondida</span>
        </div>
        <div class="ps-legend-item">
          <div class="ps-legend-dot ps-legend-dot--flagged"></div>
          <span style="font-size: 12px; color: var(--color-text-muted);">Marcada</span>
        </div>
        <div class="ps-legend-item">
          <div class="ps-legend-dot ps-legend-dot--current"></div>
          <span style="font-size: 12px; color: var(--color-text-muted);">Actual</span>
        </div>
        <div class="ps-legend-item">
          <div class="ps-legend-dot ps-legend-dot--unanswered"></div>
          <span style="font-size: 12px; color: var(--color-text-muted);">Sin responder</span>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .ps-stats {
        display: flex;
        gap: 8px;
        justify-content: space-between;
      }

      .ps-stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        flex: 1;
        padding: 6px 4px;
        background: var(--color-bg-muted, #f7f8f7);
        border-radius: 8px;
      }

      .ps-stat-number {
        font-size: 18px;
        font-weight: 700;
        line-height: 1;
      }

      .ps-stat-label {
        font-size: 10px;
        color: var(--color-text-muted);
        margin-top: 2px;
      }

      .ps-questions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(36px, 1fr));
        gap: 6px;
        max-height: 192px;
        overflow-y: auto;
        padding: 4px;
      }

      .ps-questions-grid .pagination__btn {
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

      .ps-questions-grid .pagination__btn:hover:not(:disabled) {
        background: var(--color-bg-hover);
        border-color: var(--color-text-accent);
      }

      .ps-questions-grid .pagination__btn.ps-answered {
        background: var(--forest-900);
        border-color: var(--forest-900);
        color: white;
      }

      .ps-questions-grid .pagination__btn.ps-flagged {
        background: #d97706;
        border-color: #b45309;
        color: white;
      }

      .ps-questions-grid .pagination__btn.ps-current {
        border-color: var(--forest-900);
        background: var(--forest-50);
        color: var(--forest-900);
        box-shadow: 0 0 0 2px rgba(4, 32, 44, 0.2);
      }

      .ps-flag-indicator {
        position: absolute;
        top: -4px;
        right: -4px;
        width: 14px;
        height: 14px;
        background: #d97706;
        color: white;
        border-radius: 50%;
        font-size: 9px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
      }

      .ps-legend {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
      }

      .ps-legend-item {
        display: flex;
        align-items: center;
        gap: 5px;
      }

      .ps-legend-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 1px solid var(--color-border);
      }

      .ps-legend-dot--answered {
        background: var(--forest-900);
        border-color: var(--forest-900);
      }

      .ps-legend-dot--flagged {
        background: #d97706;
        border-color: #b45309;
      }

      .ps-legend-dot--current {
        background: var(--forest-50);
        border-color: var(--forest-900);
      }

      .ps-legend-dot--unanswered {
        background: white;
        border-color: var(--color-border);
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
