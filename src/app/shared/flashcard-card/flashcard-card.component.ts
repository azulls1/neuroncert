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
    <div
      class="fc-scene cursor-pointer mb-5"
      (click)="flip.emit()"
      role="button"
      aria-label="Voltear tarjeta"
      tabindex="0"
      (keydown.enter)="flip.emit()"
      (keydown.space)="flip.emit(); $event.preventDefault()"
    >
      <div class="fc-card" [class.fc-card--flipped]="showAnswer()" aria-live="polite">
        <!-- Front face: Question -->
        <div class="fc-face fc-face--front card-section">
          <div class="flex items-center gap-2.5 mb-5">
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

          <div class="flex flex-col gap-1.5 mb-4">
            <h3 class="text-[17px] font-semibold text-gray-900 leading-relaxed m-0">
              {{ question().text }}
            </h3>
            <p class="fc-question-es">
              {{ question().textEs || '' }}
            </p>
          </div>

          @if (question().context) {
            <div
              class="bg-gray-50 border border-gray-200 rounded-lg p-2.5 mb-3 flex flex-col gap-1"
            >
              <span class="text-xs font-semibold text-gray-700">Contexto:</span>
              <span class="text-xs text-gray-700 leading-snug">{{ question().context }}</span>
            </div>
          }

          <!-- Options on front (selectable) -->
          <div class="flex flex-col gap-1.5 mb-2" (click)="$event.stopPropagation()">
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
                <span class="font-bold min-w-[20px] text-sm">{{
                  getOptionLabel(option.order)
                }}</span>
                <div class="flex-1 text-left">
                  <div class="text-xs leading-snug text-forest">{{ option.text }}</div>
                  <div class="text-xs text-forest leading-tight mt-0.5 italic">
                    {{ option.textEs || '' }}
                  </div>
                </div>
              </button>
            }
          </div>

          @if (answered()) {
            <div
              class="flex items-center justify-center gap-1.5 text-xs text-emerald-600 mt-auto pt-4"
            >
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
            <div
              class="flex items-center justify-center gap-1.5 text-xs text-gray-700 mt-auto pt-4"
            >
              Selecciona una opcion o voltea para ver la respuesta
            </div>
          }
        </div>

        <!-- Back face: Answer -->
        <div class="fc-face fc-face--back card-section">
          <div class="flex items-center justify-between mb-4">
            <span class="font-display text-forest text-base font-bold">Respuesta</span>
            <span class="tag font-mono">{{ question().domainCode }}</span>
          </div>

          <div class="stack mb-4">
            @for (option of question().options; track option.id) {
              <div
                class="fc-option"
                [class.fc-option--correct]="option.id === question().correctOptionId"
              >
                <span
                  class="font-bold min-w-[20px] text-sm"
                  [class.text-forest]="option.id === question().correctOptionId"
                >
                  {{ getOptionLabel(option.order) }}
                </span>
                <div class="flex-1">
                  <div class="text-sm leading-snug">{{ option.text }}</div>
                  @if (option.textEs) {
                    <div class="text-xs text-gray-600 leading-tight mt-0.5">
                      {{ option.textEs }}
                    </div>
                  }
                </div>
                @if (option.id === question().correctOptionId) {
                  <span class="badge badge-active shrink-0">Correcta</span>
                }
              </div>
            }
          </div>

          <div class="divider-subtle my-3"></div>

          <div class="alert alert-info mb-3">
            <div class="text-xs font-semibold mb-1">Explicacion</div>
            @if (question().explanationEs) {
              <div class="text-xs leading-relaxed mb-2">
                {{ question().explanationEs }}
              </div>
              <div
                class="text-xs leading-snug text-gray-700 border-t border-gray-100 pt-2"
              >
                <span class="font-semibold">EN:</span> {{ question().explanation }}
              </div>
            } @else {
              <div class="text-xs leading-relaxed">{{ question().explanation }}</div>
            }
          </div>

          @if (question().references && (question().references || []).length > 0) {
            <div class="mt-2">
              <div class="text-xs font-semibold text-gray-700 mb-1">Referencias:</div>
              <ul class="list-none p-0 m-0">
                @for (ref of question().references; track ref) {
                  <li class="text-xs text-gray-700 mb-0.5">{{ ref }}</li>
                }
              </ul>
            </div>
          }

          <div
            class="flex items-center justify-center gap-1.5 text-xs text-gray-700 mt-auto pt-4"
          >
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
    <div class="flex items-center justify-between" role="navigation" aria-label="Navegacion de flashcards">
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

      <span
        class="font-mono text-sm text-gray-700"
        aria-live="polite"
        [attr.aria-label]="'Tarjeta ' + (index() + 1) + ' de ' + total()"
      >
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

      /* Front options */
      .fc-front-option {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 10px 14px;
        border: 2px solid var(--color-border-subtle, #dfe4e0);
        border-radius: var(--radius-lg);
        background: white;
        cursor: pointer;
        transition: all var(--duration-normal) var(--ease-apple);
        text-align: left;
        width: 100%;
      }

      .fc-front-option:hover:not(:disabled) {
        border-color: #5b7065;
        background: #f7f9f8;
      }

      .fc-front-option--selected {
        border-color: var(--forest-900) !important;
        background: var(--forest-50) !important;
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
