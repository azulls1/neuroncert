import { Component, input, output, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Question } from '../../core/models';
import { getOptionLabel, getDifficultyLabel } from '../../core/utils/exam.utils';

/**
 * FlashcardCardComponent - Tarjeta con efecto flip 3D
 * Muestra pregunta en el frente y respuesta/explicacion en el reverso.
 */
@Component({
  selector: 'app-flashcard-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fc-scene" (click)="flip.emit()" role="button" aria-label="Voltear tarjeta" tabindex="0" (keydown.enter)="flip.emit()" (keydown.space)="flip.emit(); $event.preventDefault()">
      <div class="fc-card" [class.fc-card--flipped]="showAnswer()" aria-live="polite">
        <!-- Front face: Question -->
        <div class="fc-face fc-face--front card-section">
          <div class="fc-front-header">
            <span class="tag font-mono">{{ question().domainCode }}</span>
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

          <div class="fc-question-text">
            <h3
              style="font-size: 17px; font-weight: 600; color: var(--color-text-primary); line-height: 1.6; margin: 0;"
            >
              {{ question().text }}
            </h3>
            <p class="fc-question-es">
              {{ question().textEs || '' }}
            </p>
          </div>

          @if (question().context) {
            <div class="fc-context">
              <span style="font-size: 13px; font-weight: 600; color: var(--color-text-secondary);"
                >Contexto:</span
              >
              <span style="font-size: 13px; color: var(--color-text-muted); line-height: 1.5;">{{
                question().context
              }}</span>
            </div>
          }

          <!-- Options on front (selectable) -->
          <div class="fc-front-options" (click)="$event.stopPropagation()">
            @for (option of question().options; track option.id) {
              <button
                class="fc-front-option"
                [class.fc-front-option--selected]="selectedOption() === option.id"
                [class.fc-front-option--correct]="
                  answered() && option.id === question().correctOptionId
                "
                [class.fc-front-option--wrong]="
                  answered() &&
                  selectedOption() === option.id &&
                  option.id !== question().correctOptionId
                "
                [disabled]="answered()"
                (click)="selectOption(option.id)"
                [attr.aria-label]="'Opcion ' + getOptionLabel(option.order) + ': ' + option.text"
              >
                <span class="fc-option-label">{{ getOptionLabel(option.order) }}</span>
                <div style="flex: 1; text-align: left;">
                  <div style="font-size: 13px; line-height: 1.4; color: #04202C;">
                    {{ option.text }}
                  </div>
                  <div
                    style="font-size: 12px; color: #5B7065; line-height: 1.3; margin-top: 3px; font-style: italic;"
                  >
                    {{ option.textEs || '' }}
                  </div>
                </div>
              </button>
            }
          </div>

          @if (answered()) {
            <div class="fc-flip-hint" style="color: var(--color-forest-600, #16a34a);">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                  clip-rule="evenodd"
                />
              </svg>
              Voltea la tarjeta para ver la explicacion
            </div>
          } @else {
            <div class="fc-flip-hint">Selecciona una opcion o voltea para ver la respuesta</div>
          }
        </div>

        <!-- Back face: Answer -->
        <div class="fc-face fc-face--back card-section">
          <div class="fc-back-header">
            <span class="font-display text-forest" style="font-size: 16px; font-weight: 700;"
              >Respuesta</span
            >
            <span class="tag font-mono">{{ question().domainCode }}</span>
          </div>

          <div class="stack" style="margin-bottom: 16px;">
            @for (option of question().options; track option.id) {
              <div
                class="fc-option"
                [class.fc-option--correct]="option.id === question().correctOptionId"
              >
                <span
                  class="fc-option-label"
                  [class.text-forest]="option.id === question().correctOptionId"
                >
                  {{ getOptionLabel(option.order) }}
                </span>
                <div style="flex: 1;">
                  <div style="font-size: 14px; line-height: 1.5;">{{ option.text }}</div>
                  @if (option.textEs) {
                    <div
                      style="font-size: 12px; color: #7D8F84; line-height: 1.3; margin-top: 2px;"
                    >
                      {{ option.textEs }}
                    </div>
                  }
                </div>
                @if (option.id === question().correctOptionId) {
                  <span class="badge badge-active" style="flex-shrink: 0;">Correcta</span>
                }
              </div>
            }
          </div>

          <div class="divider-subtle" style="margin: 12px 0;"></div>

          <div class="alert alert-info" style="margin-bottom: 12px;">
            <div style="font-size: 13px; font-weight: 600; margin-bottom: 4px;">Explicacion</div>
            @if (question().explanationEs) {
              <div style="font-size: 13px; line-height: 1.6; margin-bottom: 8px;">
                {{ question().explanationEs }}
              </div>
              <div
                style="font-size: 12px; line-height: 1.5; color: var(--color-text-muted); border-top: 1px solid var(--color-border-subtle, #EFF2F0); padding-top: 8px;"
              >
                <span style="font-weight: 600;">EN:</span> {{ question().explanation }}
              </div>
            } @else {
              <div style="font-size: 13px; line-height: 1.6;">{{ question().explanation }}</div>
            }
          </div>

          @if (question().references && (question().references || []).length > 0) {
            <div style="margin-top: 8px;">
              <div
                style="font-size: 13px; font-weight: 600; color: var(--color-text-secondary); margin-bottom: 4px;"
              >
                Referencias:
              </div>
              <ul style="list-style: none; padding: 0; margin: 0;">
                @for (ref of question().references; track ref) {
                  <li style="font-size: 12px; color: var(--color-text-muted); margin-bottom: 2px;">
                    {{ ref }}
                  </li>
                }
              </ul>
            </div>
          }

          <div class="fc-flip-hint">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                clip-rule="evenodd"
              />
            </svg>
            Clic para volver a la pregunta
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <div class="fc-nav" role="navigation" aria-label="Navegacion de flashcards">
      <button
        type="button"
        class="btn btn-ghost"
        [disabled]="index() <= 0"
        (click)="previous.emit(); $event.stopPropagation()"
        aria-label="Tarjeta anterior"
      >
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path
            fill-rule="evenodd"
            d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
            clip-rule="evenodd"
          />
        </svg>
        Anterior
      </button>

      <span class="font-mono" style="font-size: 14px; color: var(--color-text-secondary);" aria-live="polite" [attr.aria-label]="'Tarjeta ' + (index() + 1) + ' de ' + total()">
        {{ index() + 1 }} / {{ total() }}
      </span>

      <button
        type="button"
        class="btn btn-ghost"
        [disabled]="index() >= total() - 1"
        (click)="next.emit(); $event.stopPropagation()"
        aria-label="Tarjeta siguiente"
      >
        Siguiente
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path
            fill-rule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
            clip-rule="evenodd"
          />
        </svg>
      </button>
    </div>
  `,
  styles: [
    `
      /* 3D Flip scene */
      .fc-scene {
        perspective: 1000px;
        cursor: pointer;
        margin-bottom: 20px;
      }

      .fc-card {
        position: relative;
        width: 100%;
        min-height: 500px;
        transform-style: preserve-3d;
        transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .fc-card--flipped {
        transform: rotateY(180deg);
      }

      .fc-face {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        min-height: 500px;
        backface-visibility: hidden;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
      }

      .fc-face--back {
        transform: rotateY(180deg);
      }

      /* Front layout */
      .fc-front-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 20px;
      }

      .fc-question-text {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 16px;
      }

      .fc-question-es {
        font-size: 14px;
        color: #5b7065;
        margin: 0;
        line-height: 1.5;
        padding: 8px 12px;
        background: #f7f9f8;
        border-radius: 8px;
        border-left: 3px solid #9eada3;
        min-height: 20px;
      }

      .fc-question-es:empty {
        display: none;
      }

      .fc-context {
        background: var(--color-bg-muted);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        padding: 10px;
        margin-bottom: 12px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .fc-flip-hint {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        font-size: 13px;
        color: var(--color-text-muted);
        margin-top: auto;
        padding-top: 16px;
      }

      /* Back layout */
      .fc-back-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
      }

      .fc-option {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 10px 12px;
        border: 2px solid var(--color-border-subtle);
        border-radius: var(--radius-md);
        background: var(--color-bg-surface);
        font-size: 14px;
      }

      .fc-option--correct {
        border-color: #16a34a;
        background: #f0fdf4;
      }

      .fc-option-label {
        font-weight: 700;
        min-width: 20px;
        font-size: 14px;
      }

      /* Front options */
      .fc-front-options {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 8px;
      }

      .fc-front-option {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 10px 14px;
        border: 2px solid var(--color-border-subtle, #dfe4e0);
        border-radius: 10px;
        background: white;
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: left;
        width: 100%;
      }

      .fc-front-option:hover:not(:disabled) {
        border-color: #5b7065;
        background: #f7f9f8;
      }

      .fc-front-option--selected {
        border-color: #04202c !important;
        background: #eff2f0 !important;
      }

      .fc-front-option--correct {
        border-color: #16a34a !important;
        background: #f0fdf4 !important;
      }

      .fc-front-option--wrong {
        border-color: #ef4444 !important;
        background: #fef2f2 !important;
      }

      .fc-front-option:disabled {
        cursor: default;
      }

      /* Navigation */
      .fc-nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      @media (max-width: 768px) {
        .fc-card {
          min-height: 420px;
        }

        .fc-face {
          min-height: 420px;
        }
      }
    `,
  ],
})
export class FlashcardCardComponent {
  // Inputs
  question = input.required<Question>();
  showAnswer = input.required<boolean>();
  index = input.required<number>();
  total = input.required<number>();

  // Local state
  selectedOption = signal<string | null>(null);
  answered = signal(false);

  // Outputs
  flip = output<void>();
  next = output<void>();
  previous = output<void>();

  constructor() {
    // Reset selection when question changes (index changes)
    effect(() => {
      this.index(); // track dependency
      this.selectedOption.set(null);
      this.answered.set(false);
    });
  }

  selectOption(optionId: string): void {
    if (this.answered()) return;
    this.selectedOption.set(optionId);
    this.answered.set(true);
  }

  /**
   * Label de dificultad en espanol
   */
  difficultyLabel = computed(() => getDifficultyLabel(this.question().difficulty));

  /**
   * Obtiene la etiqueta de la opcion (A, B, C, D)
   */
  protected getOptionLabel = getOptionLabel;
}
