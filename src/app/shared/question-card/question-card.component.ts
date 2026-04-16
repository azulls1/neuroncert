import {
  Component,
  input,
  output,
  computed,
  effect,
  ElementRef,
  viewChildren,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExamQuestion, Option } from '../../core/models';
import { formatTime, getOptionLabel, getDifficultyLabel } from '../../core/utils/exam.utils';

/**
 * Componente QuestionCard - Muestra una pregunta del examen
 * Incluye opciones de respuesta y funcionalidad de marcar para revisar
 */
@Component({
  selector: 'app-question-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card-section hover-lift" aria-live="polite" [attr.aria-atomic]="true">
      <!-- Header de la pregunta -->
      <div class="qc-header">
        <div class="qc-meta">
          <span class="font-display text-forest" style="font-size: 18px; font-weight: 700;"
            >Pregunta {{ questionNumber() }}</span
          >
          <span class="tag">{{ domainName() }}</span>
          <span
            class="badge"
            [ngClass]="{
              'badge-active': question().difficulty === 'easy',
              'badge-warning': question().difficulty === 'medium',
              'badge-error': question().difficulty === 'hard',
            }"
          >
            {{ difficultyLabel() }}
          </span>
        </div>
        <button
          type="button"
          class="btn btn-ghost"
          [class.qc-flag-active]="question().flagged"
          [attr.aria-label]="flagAriaLabel()"
          (click)="onToggleFlag()"
        >
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
            <path
              d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"
            ></path>
          </svg>
          {{ question().flagged ? 'Marcada' : 'Marcar' }}
        </button>
      </div>

      <div class="divider-subtle" style="margin: 16px 0;"></div>

      <!-- Texto de la pregunta -->
      <div style="margin-bottom: 24px;">
        <h2
          style="font-size: 18px; font-weight: 600; color: var(--color-text-primary); line-height: 1.6; margin: 0;"
        >
          {{ question().text }}
        </h2>
        @if (question().textEs) {
          <p
            style="font-size: 14px; color: #5B7065; margin: 6px 0 0; line-height: 1.5; padding: 8px 12px; background: #F7F9F8; border-radius: 8px; border-left: 3px solid #9EADA3;"
          >
            {{ question().textEs }}
          </p>
        }

        @if (question().context) {
          <div class="qc-context">
            <div
              style="font-size: 13px; font-weight: 600; color: var(--color-text-secondary); margin-bottom: 6px;"
            >
              Contexto:
            </div>
            <div style="font-size: 13px; color: var(--color-text-muted); line-height: 1.5;">
              {{ question().context }}
            </div>
          </div>
        }
      </div>

      <!-- Opciones de respuesta -->
      <div
        class="stack"
        role="radiogroup"
        [attr.aria-label]="'Opciones para la pregunta ' + questionNumber()"
        (keydown)="onRadiogroupKeydown($event)"
        style="margin-bottom: 20px;"
      >
        @for (option of question().options; track option.id) {
          <label
            class="qc-option hover-lift"
            [class.qc-option--selected]="isOptionSelected(option.id)"
            [attr.aria-label]="'Opcion ' + option.order + ': ' + option.text"
          >
            <input
              #optionInput
              type="radio"
              name="question-{{ question().id }}"
              [value]="option.id"
              [checked]="isOptionSelected(option.id)"
              (change)="onOptionSelect(option.id)"
              class="qc-radio"
            />
            <div class="qc-option-content">
              <span class="qc-option-label text-forest">{{ getOptionLabel(option.order) }}</span>
              <div style="flex: 1;">
                <div style="font-size: 14px; color: var(--color-text-primary); line-height: 1.5;">
                  {{ option.text }}
                </div>
                @if (option.textEs) {
                  <div
                    style="font-size: 12px; color: #5B7065; line-height: 1.3; margin-top: 3px; font-style: italic;"
                  >
                    {{ option.textEs }}
                  </div>
                }
              </div>
            </div>
          </label>
        }
      </div>

      <!-- Footer de la pregunta -->
      <div class="divider-subtle" style="margin-bottom: 12px;"></div>
      <div class="qc-footer">
        @if (question().timeSpent && (question().timeSpent || 0) > 0) {
          <div class="qc-time">
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clip-rule="evenodd"
              ></path>
            </svg>
            <span class="font-mono" style="font-size: 13px;">{{
              formatTime(question().timeSpent || 0)
            }}</span>
          </div>
        }

        @if (question().references && (question().references || []).length > 0) {
          <div style="flex: 1;">
            <div
              style="font-size: 13px; font-weight: 600; color: var(--color-text-secondary); margin-bottom: 4px;"
            >
              Referencias:
            </div>
            <ul style="list-style: none; padding: 0; margin: 0;">
              @for (ref of question().references; track ref) {
                <li style="font-size: 13px; color: var(--color-text-muted); margin-bottom: 2px;">
                  {{ ref }}
                </li>
              }
            </ul>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .qc-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }

      .qc-meta {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }

      .qc-flag-active {
        background: #d97706 !important;
        color: white !important;
        border-color: #b45309 !important;
      }

      .qc-context {
        background: var(--color-bg-muted);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        padding: 12px;
      }

      .qc-option {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 14px;
        border: 2px solid var(--color-border-subtle);
        border-radius: var(--radius-lg);
        background: var(--color-bg-surface);
        cursor: pointer;
        transition: all var(--duration-normal) var(--ease-apple);
      }

      .qc-option:hover {
        border-color: var(--forest-300);
        background: var(--forest-50);
      }

      .qc-option--selected {
        border-color: var(--forest-900);
        background: var(--forest-50);
      }

      .qc-radio {
        margin: 0;
        width: 18px;
        height: 18px;
        accent-color: var(--forest-900);
        flex-shrink: 0;
        margin-top: 2px;
      }

      .qc-option-content {
        flex: 1;
        display: flex;
        align-items: flex-start;
        gap: 10px;
      }

      .qc-option-label {
        font-weight: 700;
        min-width: 20px;
        font-size: 15px;
      }

      .qc-footer {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
      }

      .qc-time {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--color-text-muted);
      }

      @media (max-width: 768px) {
        .qc-header {
          flex-direction: column;
          gap: 12px;
        }

        .qc-option {
          padding: 10px;
        }

        .qc-option-content {
          flex-direction: column;
          gap: 6px;
        }

        .qc-footer {
          flex-direction: column;
          gap: 12px;
        }
      }
    `,
  ],
})
export class QuestionCardComponent {
  // Inputs
  question = input.required<ExamQuestion>();
  questionNumber = input.required<number>();
  domainName = input.required<string>();

  // Outputs
  optionSelected = output<string>();
  flagToggled = output<void>();

  // ViewChildren for radio inputs (focus management)
  optionInputs = viewChildren<ElementRef>('optionInput');

  /**
   * Effect: mueve el focus a la primera opcion cuando cambia la pregunta
   */
  private focusEffect = effect(() => {
    // Track the question id to detect question changes
    const _questionId = this.question().id;
    const inputs = this.optionInputs();
    // Use setTimeout to run after the DOM has updated
    if (inputs.length > 0) {
      setTimeout(() => {
        inputs[0]?.nativeElement?.focus();
      });
    }
  });

  /**
   * Computed: Label de dificultad
   */
  difficultyLabel = computed(() => getDifficultyLabel(this.question().difficulty));

  /**
   * Computed: Label de accesibilidad para el botón de marcar
   */
  flagAriaLabel = computed(() => {
    return this.question().flagged
      ? 'Desmarcar pregunta para revisar'
      : 'Marcar pregunta para revisar';
  });

  /**
   * Verifica si una opción está seleccionada
   */
  isOptionSelected(optionId: string): boolean {
    return this.question().selectedOptionId === optionId;
  }

  /**
   * Obtiene la etiqueta de la opcion (A, B, C, D)
   */
  protected getOptionLabel = getOptionLabel;

  /**
   * Formatea el tiempo en mm:ss
   */
  protected formatTime = formatTime;

  /**
   * Maneja la selección de una opción
   */
  onOptionSelect(optionId: string): void {
    this.optionSelected.emit(optionId);
  }

  /**
   * Maneja el toggle del flag
   */
  onToggleFlag(): void {
    this.flagToggled.emit();
  }

  /**
   * Maneja la navegacion con flechas arriba/abajo entre opciones del radiogroup
   */
  onRadiogroupKeydown(event: KeyboardEvent): void {
    const inputs = this.optionInputs();
    if (inputs.length === 0) return;

    const nativeInputs = inputs.map((ref) => ref.nativeElement as HTMLInputElement);
    const currentIndex = nativeInputs.findIndex((el) => el === document.activeElement);
    if (currentIndex === -1) return;

    let nextIndex = -1;

    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      nextIndex = (currentIndex + 1) % nativeInputs.length;
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      nextIndex = (currentIndex - 1 + nativeInputs.length) % nativeInputs.length;
    }

    if (nextIndex !== -1) {
      nativeInputs[nextIndex].focus();
      nativeInputs[nextIndex].click();
    }
  }
}
