import { Component, DestroyRef, OnInit, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ExamStateService } from '../../../core/services/exam-state.service';
import { CurriculumService } from '../../../core/services/curriculum.service';
import { ExamParams } from '../../../core/models/exam-params.model';
import { CCAFConfig } from '../../../core/models';
import { LoggingService } from '../../../core/services/logging.service';

/**
 * CCA-F Exam Config Component - Configure and start a CCA-F certification exam.
 * Loads exam parameters dynamically from the catalog via CurriculumService.
 */
@Component({
  selector: 'app-ccaf-exam',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="stack-lg animate-fadeInUp">
      <!-- Page Header -->
      <div class="page-header">
        <h1 class="page-header__title">Configurar Examen CCA-F</h1>
        <p class="page-header__desc">
          Revisa los parametros del examen a continuacion y comienza cuando estes listo. Esta
          simulacion replica las condiciones reales del examen de certificacion CCA-F.
        </p>
      </div>

      @if (catalogLoading()) {
        <div class="card-section animate-fadeInUp text-center py-12">
          <span class="text-forest">Cargando configuracion del examen...</span>
        </div>
      } @else if (ccafConfig()) {
        <!-- Exam Details Card -->
        <div class="card-section animate-fadeInUp">
          <div class="grid-stats stagger-children">
            <div class="card-stat animate-fadeInUp">
              <div class="card-stat__value">{{ totalQuestions() }}</div>
              <div class="card-stat__label">Preguntas</div>
              <div class="card-stat__desc">Opcion multiple y basadas en escenarios</div>
            </div>

            <div class="card-stat animate-fadeInUp delay-100">
              <div class="card-stat__value">{{ durationMinutes() }}</div>
              <div class="card-stat__label">Minutos</div>
              <div class="card-stat__desc">{{ durationHoursLabel() }} de duracion total</div>
            </div>

            <div class="card-stat animate-fadeInUp delay-200">
              <div class="card-stat__value">{{ passingScore() }}</div>
              <div class="card-stat__label">Score para Aprobar</div>
              <div class="card-stat__desc">De un maximo de {{ maxScore() }}</div>
            </div>

            <div class="card-stat animate-fadeInUp">
              <div class="card-stat__value">{{ domainCount() }}</div>
              <div class="card-stat__label">Dominios</div>
              <div class="card-stat__desc">Puntuacion ponderada por dominio</div>
            </div>
          </div>
        </div>

        <!-- Domain Weights Summary -->
        <div class="card-section animate-fadeInUp">
          <h3 class="page-header__title text-lg">Pesos por Dominio</h3>
          <div class="stack mt-3">
            @for (domain of domainWeights(); track domain.code) {
              <div class="flex items-center gap-3">
                <span
                  class="badge badge-info font-mono min-w-[36px] text-center"
                  >{{ domain.code }}</span
                >
                <span class="flex-1 text-sm text-forest">{{
                  domain.name
                }}</span>
                <div class="progress-labeled flex-1">
                  <div class="progress">
                    <div class="progress__bar" [style.width.%]="domain.weight"></div>
                  </div>
                  <span class="progress-labeled__value">{{ domain.weight }}%</span>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Warning Alert -->
        <div class="alert alert-warning animate-fadeInUp">
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
              <path
                d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div class="alert__content">
            <div class="alert__title">Condiciones del Examen</div>
            <span
              >Este examen simula las condiciones reales del CCA-F. No se permite pausar. Asegurate
              de tener {{ durationHoursLabel() }} ininterrumpidas antes de comenzar.</span
            >
          </div>
        </div>
      }

      <!-- Action Buttons -->
      <div class="flex gap-3 justify-center animate-fadeInUp">
        <a routerLink="/ccaf" class="btn btn-secondary">Volver</a>
        <button
          class="btn btn-cta"
          (click)="startExam()"
          [disabled]="isLoading || catalogLoading() || !ccafConfig()"
        >
          {{ isLoading ? 'Iniciando...' : 'Comenzar Examen' }}
        </button>
      </div>
    </div>
  `,
  styles: [],
})
export class CCAFExamComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private examStateService = inject(ExamStateService);
  private curriculumService = inject(CurriculumService);
  private router = inject(Router);
  private logger = inject(LoggingService);

  isLoading = false;
  catalogLoading = signal(true);

  /** CCA-F configuration loaded from catalog */
  ccafConfig = signal<CCAFConfig | null>(null);

  /** Computed signals derived from the config */
  totalQuestions = computed(() => this.ccafConfig()?.totalQuestions ?? 0);
  durationMinutes = computed(() => Math.round((this.ccafConfig()?.durationSec ?? 0) / 60));
  durationHoursLabel = computed(() => {
    const minutes = this.durationMinutes();
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;
    if (remaining === 0) return `${hours} hora${hours !== 1 ? 's' : ''}`;
    return `${hours}h ${remaining}m`;
  });
  passingScore = computed(() => this.ccafConfig()?.passingScore ?? 0);
  maxScore = computed(() => this.ccafConfig()?.maxScore ?? 0);
  domainCount = computed(() => this.ccafConfig()?.domains.length ?? 0);
  domainWeights = computed(() =>
    (this.ccafConfig()?.domains ?? []).map((d) => ({
      code: d.code,
      name: d.name,
      weight: d.weight,
    })),
  );

  ngOnInit(): void {
    this.curriculumService
      .loadCatalog()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.ccafConfig.set(this.curriculumService.getCCAFConfig());
          this.catalogLoading.set(false);
        },
        error: (err) => {
          this.logger.error('Failed to load CCA-F catalog', 'CCAFExam', err);
          this.catalogLoading.set(false);
        },
      });
  }

  /** Start the CCA-F exam */
  startExam(): void {
    const config = this.ccafConfig();
    if (!config) return;

    this.isLoading = true;

    const params: ExamParams = {
      mode: 'ccaf',
      count: config.totalQuestions,
      durationSec: config.durationSec,
      difficulty: 'any',
      domains: config.domains.map((d) => d.code),
    };

    this.examStateService
      .startExam(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.router.navigate(['/exam/run']);
        },
        error: (err) => {
          this.logger.error('Failed to start CCA-F exam', 'CCAFExam', err);
          this.isLoading = false;
        },
      });
  }
}
