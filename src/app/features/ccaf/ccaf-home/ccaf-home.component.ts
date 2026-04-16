import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CurriculumService } from '../../../core/services/curriculum.service';
import { ProgressService } from '../../../core/services/progress.service';
import { CCAFConfig, CCAFDomain } from '../../../core/models';

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
      <div style="margin-bottom: 16px;">
        <a routerLink="/certifications" class="btn btn-ghost" style="font-size: 12px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Todas las Certificaciones
        </a>
      </div>
      @if (loading()) {
        <div class="card" style="text-align: center; padding: 48px;">
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
            Preparate para el examen Claude Certified Architect — Foundations.
            Practica con preguntas realistas en los {{ domains().length }} dominios y mide tu preparacion.
          </p>

          @if (overallProgress().ccafAttempts > 0) {
            <div style="display: flex; gap: 24px; margin-top: 16px;">
              <div>
                <span class="text-pine" style="font-size: 0.8125rem;">Mejor Score</span>
                <div class="text-forest font-mono" style="font-size: 1.5rem; font-weight: 700;">
                  {{ overallProgress().ccafBestScore }}/{{ ccafConfig()?.maxScore ?? 1000 }}
                </div>
              </div>
              <div>
                <span class="text-pine" style="font-size: 0.8125rem;">Intentos</span>
                <div class="text-forest font-mono" style="font-size: 1.5rem; font-weight: 700;">
                  {{ overallProgress().ccafAttempts }}
                </div>
              </div>
            </div>
          }

          <div style="margin-top: 24px;">
            <a routerLink="/ccaf/exam" class="btn btn-cta">Comenzar Examen CCA-F</a>
          </div>
        </div>

        <!-- Exam Info Alert -->
        <div class="alert alert-info animate-fadeInUp">
          <div class="alert__icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </div>
          <div class="alert__content">
            <div class="alert__title">Formato del Examen CCA-F</div>
            <span>{{ examTotalQuestions() }} preguntas, {{ examDurationMin() }} minutos, {{ examPassingScore() }}/{{ ccafConfig()?.maxScore ?? 1000 }} para aprobar. Cubre {{ domains().length }} dominios con puntuacion ponderada.</span>
          </div>
        </div>

        <!-- Domain Breakdown -->
        <section class="animate-fadeInUp">
          <h2 class="page-header__title">Desglose por Dominio</h2>
          <p class="page-header__desc">El examen CCA-F evalua conocimientos en {{ domains().length }} dominios principales con puntuacion ponderada.</p>

          <div class="grid-features stagger-children" style="margin-top: 16px;">
            @for (domain of domains(); track domain.code) {
              <div class="card hover-lift animate-fadeInUp">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                  <span class="badge badge-info">{{ domain.code }}</span>
                  <span class="tag font-mono tag-counter">{{ domainWeightPercent(domain) }}%</span>
                </div>

                <h3 style="margin: 8px 0 4px; font-weight: 600;" class="text-forest">{{ domain.name }}</h3>
                <p style="margin: 0 0 12px; font-size: 0.875rem;" class="text-pine">{{ domain.description }}</p>

                <div class="progress-labeled">
                  <div class="progress">
                    <div
                      class="progress__bar"
                      [style.width.%]="domainWeightPercent(domain)"
                    ></div>
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

          <div class="grid-features stagger-children" style="margin-top: 16px;">
            @for (domain of domains(); track domain.code) {
              <div class="card-compact hover-lift" style="padding: 16px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                  <span class="badge badge-info font-mono" style="font-size: 11px;">{{ domain.code }}</span>
                  <span class="text-forest" style="font-weight: 600; font-size: 0.875rem;">{{ domain.name }}</span>
                </div>
                <a routerLink="/tracks" class="btn btn-ghost" style="font-size: 0.8125rem; width: 100%; justify-content: center;">Ver Cursos</a>
              </div>
            }
          </div>
        </section>

        <div class="divider"></div>

        <!-- Bottom CTA -->
        <div style="text-align: center;" class="animate-fadeInUp">
          <a routerLink="/ccaf/exam" class="btn btn-primary">Configurar e Iniciar Examen</a>
          <span style="margin: 0 12px;" class="text-pine">o</span>
          <a routerLink="/tracks" class="btn btn-secondary">Explorar Tracks de Aprendizaje</a>
        </div>
      }
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class CCAFHomeComponent implements OnInit {

  private curriculum = inject(CurriculumService);
  private progress = inject(ProgressService);

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
  examTotalQuestions = computed(() => this.ccafConfig()?.totalQuestions ?? 60);
  examDurationMin = computed(() => Math.round((this.ccafConfig()?.durationSec ?? 7200) / 60));
  examPassingScore = computed(() => this.ccafConfig()?.passingScore ?? 720);

  ngOnInit(): void {
    this.curriculum.loadCatalog().subscribe({
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
        console.error('[CCAFHomeComponent] loadCatalog error:', err);
      }
    });
  }

  /** Convert domain weight (0-1 decimal) to percentage for display */
  domainWeightPercent(domain: CCAFDomain): number {
    // Support both formats: weight as 0.27 (fraction) or 27 (percentage)
    return domain.weight <= 1 ? Math.round(domain.weight * 100) : domain.weight;
  }
}
