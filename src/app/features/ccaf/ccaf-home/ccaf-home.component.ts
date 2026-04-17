import { Component, DestroyRef, inject, signal, computed, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CurriculumService } from '../../../core/services/curriculum.service';
import { ProgressService } from '../../../core/services/progress.service';
import { ConfigService } from '../../../core/services/config.service';
import { CCAFConfig, CCAFDomain } from '../../../core/models';
import { LoggingService } from '../../../core/services/logging.service';

/**
 * CCA-F Home Component - Overview of the CCA-F certification and domain breakdown.
 * Loads domain data dynamically from CurriculumService and stats from ProgressService.
 */
@Component({
  selector: 'app-ccaf-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="stack-lg animate-fadeInUp">
      <div class="mb-4">
        <a routerLink="/certifications" class="btn btn-ghost">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Todas las Certificaciones
        </a>
      </div>
      @if (loading()) {
        <div class="card text-center py-12">
          <p class="text-pine">Cargando configuracion CCA-F...</p>
        </div>
      } @else if (error()) {
        <div class="alert alert-warning">
          <div class="alert__content">
            <div class="alert__title">No se pudo cargar la configuracion CCA-F</div>
            <span>{{ error() }}</span>
          </div>
        </div>
      } @else {
        <!-- Hero Section -->
        <div class="card-hero gradient-dark dark-surface">
          <h1 class="card-hero__title">Simulador de Certificacion CCA-F</h1>
          <p class="card-hero__desc">
            Preparate para el examen Claude Certified Architect — Foundations. Practica con
            preguntas realistas en los {{ domains().length }} dominios y mide tu preparacion.
          </p>

          @if (overallProgress().ccafAttempts > 0) {
            <div class="flex gap-6 mt-4 justify-center">
              <div>
                <span class="text-on-dark-muted text-xs">Mejor Score</span>
                <div class="text-on-dark font-mono text-2xl font-bold">
                  {{ overallProgress().ccafBestScore }}/{{
                    ccafConfig()?.maxScore ?? configSvc.ccafMaxScore
                  }}
                </div>
              </div>
              <div>
                <span class="text-on-dark-muted text-xs">Intentos</span>
                <div class="text-on-dark font-mono text-2xl font-bold">
                  {{ overallProgress().ccafAttempts }}
                </div>
              </div>
            </div>
          }

          <div class="mt-6">
            <a routerLink="/ccaf/exam" class="btn btn-cta">Comenzar Examen CCA-F</a>
          </div>
        </div>

        <!-- Exam Info Alert -->
        <div class="alert alert-info animate-fadeInUp">
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
            <div class="alert__title">Formato del Examen CCA-F</div>
            <span
              >{{ examTotalQuestions() }} preguntas, {{ examDurationMin() }} minutos,
              {{ examPassingScore() }}/{{ ccafConfig()?.maxScore ?? configSvc.ccafMaxScore }} para
              aprobar. Cubre {{ domains().length }} dominios con puntuacion ponderada.</span
            >
          </div>
        </div>

        <!-- Domain Breakdown -->
        <section class="animate-fadeInUp">
          <h2 class="page-header__title">Desglose por Dominio</h2>
          <p class="page-header__desc">
            El examen CCA-F evalua conocimientos en {{ domains().length }} dominios principales con
            puntuacion ponderada.
          </p>

          <div class="grid-features stagger-children mt-4">
            @for (domain of domains(); track domain.code) {
              <div class="card-feature hover-lift animate-fadeInUp">
                <div class="flex items-center justify-between mb-2">
                  <span class="badge badge-info">{{ domain.code }}</span>
                  <span class="tag font-mono tag-counter">{{ domainWeightPercent(domain) }}%</span>
                </div>

                <h3 class="text-forest font-semibold mt-2 mb-1">
                  {{ domain.name }}
                </h3>
                <p class="text-pine text-sm mb-3">
                  {{ domain.description }}
                </p>

                <div class="progress-labeled">
                  <div class="progress">
                    <div class="progress__bar" [style.width.%]="domainWeightPercent(domain)"></div>
                  </div>
                  <span class="progress-labeled__value">{{ domainWeightPercent(domain) }}%</span>
                </div>
              </div>
            }
          </div>
        </section>

        <!-- Study Resources -->
        <section class="card-section animate-fadeInUp">
          <h2 class="page-header__title">Recursos de Estudio</h2>
          <p class="page-header__desc">Cursos y materiales recomendados para cada dominio.</p>

          <div class="grid-features stagger-children mt-4">
            @for (domain of domains(); track domain.code) {
              <div class="card-feature hover-lift p-4">
                <div class="flex items-center gap-2 mb-2">
                  <span class="badge badge-info font-mono text-xs">{{
                    domain.code
                  }}</span>
                  <span class="text-forest font-semibold text-sm">{{
                    domain.name
                  }}</span>
                </div>
                <a
                  routerLink="/tracks"
                  class="btn btn-ghost w-full justify-center text-sm"
                  >Ver Cursos</a
                >
              </div>
            }
          </div>
        </section>

        <div class="divider"></div>

        <!-- Bottom CTA -->
        <div class="text-center animate-fadeInUp">
          <a routerLink="/ccaf/exam" class="btn btn-primary">Configurar e Iniciar Examen</a>
          <span class="text-pine mx-3">o</span>
          <a routerLink="/tracks" class="btn btn-secondary">Explorar Tracks de Aprendizaje</a>
        </div>
      }
    </div>
  `,
  styles: [],
})
export class CCAFHomeComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private curriculum = inject(CurriculumService);
  private progress = inject(ProgressService);
  private logger = inject(LoggingService);
  protected readonly configSvc = inject(ConfigService);

  /** Loading/error state */
  loading = signal(true);
  error = signal<string | null>(null);

  /** CCA-F configuration from catalog */
  ccafConfig = signal<CCAFConfig | null>(null);

  /** Domains derived from config */
  domains = computed<CCAFDomain[]>(() => this.ccafConfig()?.domains ?? []);

  /** Overall progress (reactive signal from ProgressService) */
  overallProgress = this.progress.getOverallProgress();

  /** Exam format info computed from config */
  examTotalQuestions = computed(
    () => this.ccafConfig()?.totalQuestions ?? this.configSvc.ccafQuestionCount,
  );
  examDurationMin = computed(() =>
    Math.round((this.ccafConfig()?.durationSec ?? this.configSvc.ccafDurationSec) / 60),
  );
  examPassingScore = computed(
    () => this.ccafConfig()?.passingScore ?? this.configSvc.ccafPassingScore,
  );

  ngOnInit(): void {
    this.curriculum
      .loadCatalog()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          const config = this.curriculum.getCCAFConfig();
          if (config) {
            this.ccafConfig.set(config);
          } else {
            this.error.set('Configuracion CCA-F no encontrada en el catalogo.');
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Error al cargar el catalogo. Por favor intenta de nuevo.');
          this.loading.set(false);
          this.logger.error('loadCatalog error', 'CCAFHome', err);
        },
      });
  }

  /** Convert domain weight (0-1 decimal) to percentage for display */
  domainWeightPercent(domain: CCAFDomain): number {
    // Support both formats: weight as 0.27 (fraction) or 27 (percentage)
    return domain.weight <= 1 ? Math.round(domain.weight * 100) : domain.weight;
  }
}
