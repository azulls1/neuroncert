import { Component, input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimerService } from '../../core/services/timer.service';
import { ConfigService } from '../../core/services/config.service';

/**
 * Componente TimerBadge - Muestra el tiempo restante del examen
 * Incluye indicadores visuales para tiempo bajo
 */
@Component({
  selector: 'app-timer-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="tag-counter relative overflow-hidden transition-slow"
      role="timer"
      aria-live="polite"
      [attr.aria-atomic]="true"
      [class.tb-warning]="isTimeLow()"
      [class.tb-critical]="isTimeCritical()"
      [attr.aria-label]="ariaLabel()"
    >
      <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
        <path
          fill-rule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
          clip-rule="evenodd"
        ></path>
      </svg>
      <span class="font-mono text-base font-bold leading-none">{{
        formattedTime()
      }}</span>
      @if (showProgress()) {
        <div class="progress progress--sm absolute bottom-0 left-0 right-0 rounded-none opacity-40">
          <div class="progress__bar" [style.width.%]="progressPercentage()"></div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
      }

      .tb-warning {
        background: #fffbeb;
        border-color: #d97706;
        color: #92400e;
        animation: tb-pulse 2s ease-in-out infinite;
      }

      .tb-critical {
        background: #fef2f2;
        border-color: #dc2626;
        color: #991b1b;
        animation: tb-pulse-critical 1s ease-in-out infinite;
      }

      @keyframes tb-pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.8;
        }
      }

      @keyframes tb-pulse-critical {
        0%,
        100% {
          opacity: 1;
          transform: scale(1);
        }
        50% {
          opacity: 0.9;
          transform: scale(1.02);
        }
      }

      @media (max-width: 640px) {
        .tag-counter {
          padding: 4px 10px;
          font-size: 13px;
        }
      }
    `,
  ],
})
export class TimerBadgeComponent {
  private readonly config = inject(ConfigService);

  // Inputs
  remainingSeconds = input.required<number>();
  showProgress = input<boolean>(true);
  warningThreshold = input<number>(this.config.timerWarningThreshold);
  criticalThreshold = input<number>(this.config.timerCriticalThreshold);

  // Inyección de dependencias
  private timer = inject(TimerService);

  /**
   * Tiempo formateado (mm:ss)
   */
  formattedTime = computed(() => {
    return this.timer.formatTime(this.remainingSeconds());
  });

  /**
   * Porcentaje de progreso del tiempo
   */
  progressPercentage = computed(() => {
    const total = this.timer.totalSeconds();
    const remaining = this.remainingSeconds();
    if (total === 0) return 0;
    return Math.round(((total - remaining) / total) * 100);
  });

  /**
   * Verifica si el tiempo está bajo (warning)
   */
  isTimeLow = computed(() => {
    return (
      this.remainingSeconds() <= this.warningThreshold() &&
      this.remainingSeconds() > this.criticalThreshold()
    );
  });

  /**
   * Verifica si el tiempo está crítico
   */
  isTimeCritical = computed(() => {
    return this.remainingSeconds() <= this.criticalThreshold();
  });

  /**
   * Label de accesibilidad
   */
  ariaLabel = computed(() => {
    const time = this.formattedTime();
    if (this.isTimeCritical()) {
      return `Tiempo critico: ${time} restantes`;
    } else if (this.isTimeLow()) {
      return `Tiempo bajo: ${time} restantes`;
    } else {
      return `Tiempo restante: ${time}`;
    }
  });
}
