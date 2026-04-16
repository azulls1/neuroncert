import { Component, DestroyRef, OnInit, signal, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Domain,
  ExamParams,
  ExamDifficulty,
  LearningTrack,
  CCAFConfig,
} from '../../../core/models';
import { ConfigService, ExamStateService, CurriculumService } from '../../../core/services';
import { LoggingService } from '../../../core/services/logging.service';

/**
 * Componente Start - Configuración del examen
 * Permite seleccionar dominios, dificultad y cantidad de preguntas
 */
@Component({
  selector: 'app-start',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-medium">
      <!-- Header -->
      <div class="page-header animate-fadeInUp">
        <h1 class="page-header__title">Configurar Simulacro</h1>
        <p class="page-header__desc">
          {{ headerDescription() }}
        </p>
      </div>

      @if (isLoadingCatalog()) {
        <div class="empty-state animate-fadeInUp">
          <div class="loading-dots"><span></span><span></span><span></span></div>
          <p class="empty-state__desc">Cargando configuraci&oacute;n...</p>
        </div>
      } @else {
        <!-- Formulario de configuracion -->
        <div class="card-section animate-fadeInUp delay-100">
          <form (ngSubmit)="startExam()" #examForm="ngForm">
            <!-- Track context info -->
            @if (currentTrack(); as t) {
              <div class="alert alert-info" style="margin-bottom: 24px;">
                <div class="alert__icon">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </div>
                <div class="alert__content">
                  <div class="alert__title">{{ t.title }}</div>
                  <div style="font-size: 0.875rem; margin-top: 4px;">
                    {{ t.modules.length }} modulos &middot; Nivel {{ t.level }} &middot;
                    {{ t.platform }}
                  </div>
                </div>
              </div>
            }

            <!-- Dificultad -->
            <div class="stack-lg">
              <div>
                <h2 class="label" style="font-size: 16px; margin-bottom: 12px;">
                  Nivel de Dificultad
                </h2>
                <div class="form-grid">
                  @for (difficulty of difficultyOptions; track difficulty.value) {
                    <label
                      class="card-feature hover-lift"
                      style="cursor: pointer; display: flex; align-items: center; gap: 12px;"
                    >
                      <input
                        type="radio"
                        name="difficulty"
                        [value]="difficulty.value"
                        [(ngModel)]="selectedDifficulty"
                        class="input"
                        style="width: 16px; height: 16px; flex-shrink: 0;"
                      />
                      <div>
                        <div
                          class="card-stat__label"
                          style="text-transform: none; font-size: 14px;"
                        >
                          {{ difficulty.label }}
                        </div>
                        <div class="card-stat__desc">{{ difficulty.description }}</div>
                      </div>
                    </label>
                  }
                </div>
              </div>

              <!-- Configuracion del Examen -->
              <div>
                <h2 class="label" style="font-size: 16px; margin-bottom: 12px;">
                  Configuraci&oacute;n del Examen
                </h2>

                <!-- Alert info -->
                <div class="alert alert-info">
                  <div class="alert__icon">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                  </div>
                  <div class="alert__content">
                    <div class="alert__title">
                      {{ examConfigTitle() }}: {{ effectiveQuestionCount() }} preguntas,
                      {{ formatDuration(effectiveDurationSec()) }}
                    </div>
                    <div style="margin-top: 12px;">
                      <div class="grid-stats">
                        <div class="card-stat">
                          <div class="card-stat__value">{{ effectiveQuestionCount() }}</div>
                          <div class="card-stat__label">Preguntas</div>
                        </div>
                        <div class="card-stat">
                          <div class="card-stat__value">
                            {{ formatDuration(effectiveDurationSec()) }}
                          </div>
                          <div class="card-stat__label">Duraci&oacute;n</div>
                        </div>
                        <div class="card-stat">
                          <div class="card-stat__value">4</div>
                          <div class="card-stat__label">Opciones</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Botones de accion -->
              <div class="flex-row flex-row--between" style="justify-content: flex-end; gap: 12px;">
                <button type="button" (click)="goBack()" class="btn btn-secondary">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                  Cancelar
                </button>
                <button
                  type="submit"
                  [disabled]="!canStartExam() || isStarting()"
                  class="btn btn-primary"
                >
                  @if (isStarting()) {
                    <div class="loading-dots"><span></span><span></span><span></span></div>
                    Iniciando...
                  } @else {
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M5 3l14 9-14 9V3z" />
                    </svg>
                    Comenzar Simulacro
                  }
                </button>
              </div>

              @if (error()) {
                <div class="alert alert-error">
                  <div class="alert__content">{{ error() }}</div>
                </div>
              }
            </div>
          </form>
        </div>
      }
    </div>
  `,
  styles: [``],
})
export class StartComponent implements OnInit {
  // Inyeccion de dependencias
  private destroyRef = inject(DestroyRef);
  public config = inject(ConfigService);
  private examState = inject(ExamStateService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private curriculum = inject(CurriculumService);
  private logger = inject(LoggingService);

  // Signals para el estado del componente
  private _availableDomains = signal<Domain[]>([]);
  private _selectedDomains = signal<string[]>([]);
  private _selectedDifficulty = signal<ExamDifficulty>('any');
  private _isStarting = signal<boolean>(false);
  private _error = signal<string | null>(null);

  /** Track loaded from query param (null if generic exam) */
  currentTrack = signal<LearningTrack | null>(null);

  /** CCA-F config loaded from catalog (null if not CCA-F context) */
  ccafConfig = signal<CCAFConfig | null>(null);

  /** Whether catalog is still loading */
  isLoadingCatalog = signal<boolean>(false);

  /** Track ID from query params */
  private _trackId = signal<string | null>(null);

  // Opciones de dificultad
  difficultyOptions = [
    {
      value: 'any',
      label: 'Cualquiera',
      description: 'Dificultad aleatoria (facil, medio o dificil)',
    },
    { value: 'easy', label: 'Facil', description: 'Preguntas basicas y fundamentales' },
    { value: 'medium', label: 'Medio', description: 'Preguntas intermedias' },
    { value: 'hard', label: 'Dificil', description: 'Preguntas avanzadas y complejas' },
  ];

  /** Effective question count based on context */
  effectiveQuestionCount = computed(() => {
    const track = this.currentTrack();
    const ccaf = this.ccafConfig();
    if (ccaf) return ccaf.totalQuestions;
    if (track) return track.modules.reduce((sum, m) => sum + m.questionCount, 0);
    return this.config.defaultQuestionsCount;
  });

  /** Effective duration in seconds based on context */
  effectiveDurationSec = computed(() => {
    const track = this.currentTrack();
    const ccaf = this.ccafConfig();
    if (ccaf) return ccaf.durationSec;
    if (track) {
      // ~1.5 min per question, converted to seconds
      const questions = track.modules.reduce((sum, m) => sum + m.questionCount, 0);
      return Math.max(questions * 90, 600);
    }
    return this.config.defaultDurationSec;
  });

  /** Exam mode based on context */
  effectiveMode = computed<'standard' | 'ccaf'>(() => {
    return this.ccafConfig() ? 'ccaf' : 'standard';
  });

  /** Header description based on context */
  headerDescription = computed(() => {
    const track = this.currentTrack();
    const ccaf = this.ccafConfig();
    if (ccaf) return 'Prepara tu examen CCA-F con la configuracion oficial de la certificacion';
    if (track) return `Configura el simulacro para ${track.title}`;
    return 'Configura tu simulacro de examen con la configuracion estandar';
  });

  /** Title for the exam config section */
  examConfigTitle = computed(() => {
    const track = this.currentTrack();
    const ccaf = this.ccafConfig();
    if (ccaf) return 'Examen CCA-F';
    if (track) return track.title;
    return 'Examen Estandar';
  });

  // Getters para los signals
  get availableDomains() {
    return this._availableDomains.asReadonly();
  }

  get selectedDomains() {
    return this._selectedDomains.asReadonly();
  }

  get selectedDifficulty() {
    return this._selectedDifficulty();
  }

  set selectedDifficulty(value: ExamDifficulty) {
    this._selectedDifficulty.set(value);
  }

  get isStarting() {
    return this._isStarting.asReadonly();
  }

  get error() {
    return this._error.asReadonly();
  }

  ngOnInit(): void {
    const trackId = this.route.snapshot.queryParamMap.get('trackId');
    this._trackId.set(trackId);

    if (trackId) {
      this.isLoadingCatalog.set(true);
      this.curriculum.loadCatalog().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          const track = this.curriculum.getTrackById(trackId) ?? null;
          this.currentTrack.set(track);

          // If the track is CCA-F, also load CCA-F config
          if (track?.platform === 'cca-f') {
            this.ccafConfig.set(this.curriculum.getCCAFConfig());
          }

          this.isLoadingCatalog.set(false);
        },
        error: () => {
          this.isLoadingCatalog.set(false);
        },
      });
    }
  }

  /**
   * Obtiene la etiqueta de dificultad
   */
  getDifficultyLabel(difficulty: ExamDifficulty): string {
    const option = this.difficultyOptions.find((opt) => opt.value === difficulty);
    return option?.label || difficulty;
  }

  /**
   * Formatea la duracion en segundos a formato legible
   */
  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  }

  /**
   * Calcula el tiempo promedio por pregunta
   */
  averageTimePerQuestion(): number {
    const totalMinutes = this.effectiveDurationSec() / 60;
    const totalQuestions = this.effectiveQuestionCount();
    if (totalQuestions === 0) return 0;
    return Math.round((totalMinutes / totalQuestions) * 10) / 10;
  }

  /**
   * Verifica si se puede iniciar el examen
   */
  canStartExam(): boolean {
    return !this.isStarting() && !this.isLoadingCatalog();
  }

  /**
   * Inicia el examen
   */
  startExam(): void {
    if (!this.canStartExam()) return;

    this._isStarting.set(true);
    this._error.set(null);

    const ccaf = this.ccafConfig();
    const trackId = this._trackId();

    const params: ExamParams = {
      domains: ccaf ? ccaf.domains.map((d) => d.code) : [],
      count: this.effectiveQuestionCount(),
      difficulty: this._selectedDifficulty(),
      durationSec: this.effectiveDurationSec(),
      mode: this.effectiveMode(),
      ...(trackId ? { trackId } : {}),
      ...(ccaf ? { scenarioCount: ccaf.scenarioCount } : {}),
    };

    this.examState.startExam(params).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this._isStarting.set(false);
        this.router.navigate(['/exam/run']);
      },
      error: (error) => {
        this.logger.error('Error starting exam', 'Start', error);
        this._error.set('Error al iniciar el examen. Intenta de nuevo.');
        this._isStarting.set(false);
      },
    });
  }

  /**
   * Regresa a la pagina anterior
   */
  goBack(): void {
    const trackId = this._trackId();
    if (trackId) {
      this.router.navigate(['/tracks', trackId]);
    } else {
      this.router.navigate(['/']);
    }
  }
}
