import { Injectable, signal, computed } from '@angular/core';
import { interval, Observable, BehaviorSubject, Subscription } from 'rxjs';
import { map, takeWhile } from 'rxjs/operators';
import { formatTime } from '../utils/exam.utils';

/**
 * Servicio de temporizador para el examen
 * Maneja el tiempo restante, pausa/resume y notificaciones
 */
@Injectable({
  providedIn: 'root'
})
export class TimerService {

  // Signals para el estado del temporizador
  private _isRunning = signal(false);
  private _isPaused = signal(false);
  private _remainingSeconds = signal(0);
  private _totalSeconds = signal(0);

  // Observable para el tiempo restante
  private _remainingTime$ = new BehaviorSubject<number>(0);

  // Subscription del intervalo
  private _timerSubscription?: Subscription;

  // Callbacks para eventos
  private _onTimeUp?: () => void;
  private _onWarning?: () => void;

  // Configuración
  private _warningThreshold = 300; // 5 minutos antes del final

  /**
   * Signal que indica si el temporizador está corriendo
   */
  get isRunning() {
    return this._isRunning.asReadonly();
  }

  /**
   * Signal que indica si el temporizador está pausado
   */
  get isPaused() {
    return this._isPaused.asReadonly();
  }

  /**
   * Signal con los segundos restantes
   */
  get remainingSeconds() {
    return this._remainingSeconds.asReadonly();
  }

  /**
   * Signal con el tiempo total configurado
   */
  get totalSeconds() {
    return this._totalSeconds.asReadonly();
  }

  /**
   * Signal computado con el tiempo restante formateado (mm:ss)
   */
  get formattedTime() {
    return computed(() => this.formatTime(this._remainingSeconds()));
  }

  /**
   * Signal computado con el porcentaje de tiempo transcurrido
   */
  get progressPercentage() {
    return computed(() => {
      const total = this._totalSeconds();
      const remaining = this._remainingSeconds();
      if (total === 0) return 0;
      return Math.round(((total - remaining) / total) * 100);
    });
  }

  /**
   * Observable con el tiempo restante
   */
  get remainingTime$(): Observable<number> {
    return this._remainingTime$.asObservable();
  }

  /**
   * Observable con el tiempo formateado
   */
  get formattedTime$(): Observable<string> {
    return this._remainingTime$.pipe(
      map(seconds => this.formatTime(seconds))
    );
  }

  /**
   * Inicia el temporizador con la duración especificada
   * @param durationSec Duración en segundos
   * @param onTimeUp Callback cuando se agota el tiempo
   * @param onWarning Callback cuando queda poco tiempo
   */
  start(durationSec: number, onTimeUp?: () => void, onWarning?: () => void): void {
    if (this._isRunning()) {
      return;
    }

    this._totalSeconds.set(durationSec);
    this._remainingSeconds.set(durationSec);
    this._remainingTime$.next(durationSec);
    this._isRunning.set(true);
    this._isPaused.set(false);

    this._onTimeUp = onTimeUp;
    this._onWarning = onWarning;

    this._startInterval();
  }

  /**
   * Pausa el temporizador
   */
  pause(): void {
    if (!this._isRunning() || this._isPaused()) {
      return;
    }

    this._isPaused.set(true);
  }

  /**
   * Reanuda el temporizador
   */
  resume(): void {
    if (!this._isRunning() || !this._isPaused()) {
      return;
    }

    this._isPaused.set(false);
  }

  /**
   * Detiene el temporizador
   */
  stop(): void {
    this._clearInterval();

    this._isRunning.set(false);
    this._isPaused.set(false);
  }

  /**
   * Reinicia el temporizador con el tiempo original
   */
  reset(): void {
    this.stop();
    this._remainingSeconds.set(this._totalSeconds());
    this._remainingTime$.next(this._totalSeconds());
  }

  /**
   * Agrega tiempo al temporizador
   * @param seconds Segundos a agregar
   */
  addTime(seconds: number): void {
    const current = this._remainingSeconds();
    const newTime = Math.max(0, current + seconds);

    this._remainingSeconds.set(newTime);
    this._remainingTime$.next(newTime);
  }

  /**
   * Crea la subscription al intervalo de 1 segundo.
   * El intervalo solo se completa cuando _isRunning es false (via takeWhile).
   * Cuando esta pausado, simplemente no decrementa.
   */
  private _startInterval(): void {
    this._clearInterval();

    this._timerSubscription = interval(1000)
      .pipe(
        takeWhile(() => this._isRunning())
      )
      .subscribe(() => {
        // Si esta pausado, no decrementar
        if (this._isPaused()) {
          return;
        }

        const current = this._remainingSeconds();
        const newTime = current - 1;

        this._remainingSeconds.set(newTime);
        this._remainingTime$.next(newTime);

        // Verificar si se agotó el tiempo
        if (newTime <= 0) {
          this.stop();
          if (this._onTimeUp) {
            this._onTimeUp();
          }
          return;
        }

        // Verificar si es momento de mostrar advertencia
        if (newTime === this._warningThreshold && this._onWarning) {
          this._onWarning();
        }
      });
  }

  /**
   * Limpia la subscription del intervalo si existe
   */
  private _clearInterval(): void {
    if (this._timerSubscription) {
      this._timerSubscription.unsubscribe();
      this._timerSubscription = undefined;
    }
  }

  /**
   * Formatea segundos en formato mm:ss
   * @param seconds Segundos a formatear
   */
  formatTime = formatTime;

  /**
   * Convierte tiempo formateado (mm:ss) a segundos
   * @param timeString Tiempo en formato mm:ss
   */
  parseTime(timeString: string): number {
    const [minutes, seconds] = timeString.split(':').map(Number);
    return (minutes * 60) + seconds;
  }

  /**
   * Obtiene el tiempo restante en formato legible
   */
  getTimeRemainingText(): string {
    const seconds = this._remainingSeconds();
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Verifica si queda poco tiempo (menos del threshold)
   */
  isTimeRunningLow(): boolean {
    return this._remainingSeconds() <= this._warningThreshold;
  }

  /**
   * Obtiene el estado actual del temporizador
   */
  getState(): {
    isRunning: boolean;
    isPaused: boolean;
    remainingSeconds: number;
    totalSeconds: number;
    formattedTime: string;
    progressPercentage: number;
  } {
    return {
      isRunning: this._isRunning(),
      isPaused: this._isPaused(),
      remainingSeconds: this._remainingSeconds(),
      totalSeconds: this._totalSeconds(),
      formattedTime: this.formatTime(this._remainingSeconds()),
      progressPercentage: this.progressPercentage()
    };
  }

  /**
   * Limpia recursos al destruir el servicio
   */
  ngOnDestroy(): void {
    this.stop();
  }
}
