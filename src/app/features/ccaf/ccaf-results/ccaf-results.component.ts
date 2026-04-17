import { Component, DestroyRef, OnInit, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ExamStateService, ScoreService } from '../../../core/services';
import { CurriculumService } from '../../../core/services/curriculum.service';
import { ConfigService } from '../../../core/services/config.service';
import { ExamResult, DomainScore, CCAFConfig } from '../../../core/models';
import { formatTime } from '../../../core/utils/exam.utils';
import { LoggingService } from '../../../core/services/logging.service';

/**
 * CCA-F Results Component
 * Displays weighted domain scoring results for the CCA-F certification exam.
 */
@Component({
  selector: 'app-ccaf-results',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-medium animate-fadeInUp stagger-children">
      <!-- Pass / Fail Indicator -->
      @if (passed) {
        <div class="card-hero animate-fadeInUp bg-emerald-50 border-l-4 border-emerald-500 text-center">
          <div class="flex flex-col items-center gap-3 py-6">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#22c55e"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M9 12l2 2 4-4" />
              <circle cx="12" cy="12" r="10" />
            </svg>
            <span class="font-display text-3xl font-bold text-emerald-500">APROBADO</span>
          </div>
        </div>
      } @else {
        <div class="card-hero animate-fadeInUp bg-red-50 border-l-4 border-red-500 text-center">
          <div class="flex flex-col items-center gap-3 py-6">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ef4444"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span class="font-display text-3xl font-bold text-red-500">NO APROBADO</span>
          </div>
        </div>
      }

      <!-- Weighted Score Display -->
      <div class="flex justify-center my-6 animate-fadeInUp">
        <div class="card-stat text-center p-6 w-full max-w-[400px]">
          <div class="card-stat__label">Score Ponderado</div>
          <div class="card-stat__value font-display text-[clamp(2rem,6vw,3rem)]">
            {{ weightedScore }} / {{ configMaxScore() }}
          </div>
          <div class="text-pine text-sm mt-2">
            Score para aprobar: {{ configPassingScore() }} / {{ configMaxScore() }}
          </div>
        </div>
      </div>

      <!-- Domain Breakdown -->
      <div class="card-section animate-fadeInUp delay-100">
        <h2 class="font-display mb-4">Desglose por Dominio</h2>

        <div class="stack">
          @for (domain of domainScores; track domain.domainCode) {
            <div class="card-feature p-4">
              <div class="flex items-center justify-between mb-2 flex-wrap gap-1.5">
                <span class="font-display text-sm flex-1 min-w-[120px]">{{
                  domain.domainName
                }}</span>
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="tag font-mono text-xs"
                    >{{ (domain.weight * 100).toFixed(0) }}%</span
                  >
                  <span class="font-mono text-xs"
                    >{{ domain.correct }}/{{ domain.total }}</span
                  >
                  <span class="badge text-xs"
                    >{{ domain.weightedContribution }} pts</span
                  >
                </div>
              </div>
              <div class="progress-labeled">
                <div class="progress" [ngClass]="getProgressClass(domain.rawPercentage)">
                  <div class="progress__bar" [style.width.%]="domain.rawPercentage"></div>
                </div>
                <span class="progress-labeled__value font-mono">{{ domain.rawPercentage }}%</span>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Summary Stats -->
      <div class="grid-stats stagger-children animate-fadeInUp delay-100">
        <div class="card-stat hover-lift">
          <div class="card-stat__label">Correctas / Total</div>
          <div class="card-stat__value font-mono">{{ totalCorrect }} / {{ totalQuestions }}</div>
        </div>
        <div class="card-stat hover-lift">
          <div class="card-stat__label">Tiempo Empleado</div>
          <div class="card-stat__value font-mono">{{ formatTime(timeSpent) }}</div>
        </div>
        <div class="card-stat hover-lift">
          <div class="card-stat__label">Promedio por Pregunta</div>
          <div class="card-stat__value font-mono">{{ formatTime(avgTimePerQuestion) }}</div>
        </div>
      </div>

      <!-- Recommendations -->
      <div class="card-section animate-fadeInUp delay-200">
        @if (weakDomains.length > 0) {
          <div class="alert alert-warning">
            <div class="alert__content">
              <div class="alert__title">Enfocate en estos dominios:</div>
              <ul class="mt-2 pl-5">
                @for (domain of weakDomains; track domain.domainCode) {
                  <li>
                    {{ domain.domainName }} ({{ domain.domainCode }}) &mdash;
                    {{ domain.rawPercentage }}%
                  </li>
                }
              </ul>
            </div>
          </div>
        } @else {
          <div class="alert alert-success">
            <div class="alert__content">
              <div class="alert__title">Excelente desempeno en todos los dominios!</div>
              <p>Obtuviste {{ weakDomainThreshold }}% o mas en cada dominio. Sigue asi!</p>
            </div>
          </div>
        }
      </div>

      <!-- Actions -->
      <div class="flex gap-3 justify-center flex-wrap animate-fadeInUp">
        <a routerLink="/ccaf/exam" class="btn btn-primary hover-lift">Intentar de Nuevo</a>
        <a routerLink="/ccaf" class="btn btn-secondary hover-lift">Volver a CCA-F</a>
        <a routerLink="/exam/history" class="btn btn-ghost">Ver Historial</a>
      </div>
    </div>
  `,
  styles: [],
})
export class CCAFResultsComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private examState = inject(ExamStateService);
  private scoreService = inject(ScoreService);
  private curriculumService = inject(CurriculumService);
  private router = inject(Router);
  private logger = inject(LoggingService);
  private readonly configSvc = inject(ConfigService);

  examResult: ExamResult | null = null;
  domainScores: DomainScore[] = [];
  weakDomains: DomainScore[] = [];
  passed = false;
  weightedScore = 0;
  totalCorrect = 0;
  totalQuestions = 0;
  timeSpent = 0;
  avgTimePerQuestion = 0;

  /** CCA-F config loaded from catalog */
  private ccafConfig = signal<CCAFConfig | null>(null);

  /** Passing score from config (e.g. 720), falls back to environment default */
  configPassingScore = computed(
    () => this.ccafConfig()?.passingScore ?? this.configSvc.ccafPassingScore,
  );

  /** Max score from config (e.g. 1000), falls back to environment default */
  configMaxScore = computed(() => this.ccafConfig()?.maxScore ?? this.configSvc.ccafMaxScore);

  /**
   * Threshold percentage below which a domain is considered weak.
   * Derived from the passing score ratio (passingScore / maxScore * 100),
   * rounded down. Example: 720/1000 = 72%. Falls back to 70%.
   */
  weakDomainThreshold = 70;

  ngOnInit(): void {
    this.examResult = this.examState.examResult() ?? null;

    if (!this.examResult) {
      this.router.navigate(['/ccaf']);
      return;
    }

    // Load CCA-F config from catalog for dynamic score labels
    this.curriculumService
      .loadCatalog()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          const config = this.curriculumService.getCCAFConfig();
          this.ccafConfig.set(config);
          if (config) {
            // Derive weak-domain threshold from passing ratio
            this.weakDomainThreshold = Math.floor((config.passingScore / config.maxScore) * 100);
            // Recompute weak domains with the config-based threshold
            this.weakDomains = this.domainScores.filter(
              (ds) => ds.rawPercentage < this.weakDomainThreshold,
            );
          }
        },
        error: (err) => {
          this.logger.error('Failed to load CCA-F catalog for results', 'CCAFResults', err);
        },
      });

    // Use pre-computed values from the result if available
    this.domainScores = this.examResult.domainScores ?? [];
    this.passed = this.examResult.passed ?? false;
    this.weightedScore = this.examResult.weightedScore ?? 0;

    // Summary stats
    this.totalCorrect = this.examResult.summary.correct;
    this.totalQuestions =
      this.examResult.summary.correct +
      this.examResult.summary.incorrect +
      this.examResult.summary.skipped;
    this.timeSpent = this.examResult.summary.totalTimeSpent;
    this.avgTimePerQuestion =
      this.totalQuestions > 0 ? Math.round(this.timeSpent / this.totalQuestions) : 0;

    // Identify weak domains with default threshold (will be recalculated when config loads)
    this.weakDomains = this.domainScores.filter(
      (ds) => ds.rawPercentage < this.weakDomainThreshold,
    );
  }

  /**
   * Returns progress bar class based on raw percentage.
   */
  getProgressClass(rawPercentage: number): string {
    if (rawPercentage >= 70) return 'progress--success';
    if (rawPercentage >= 50) return '';
    return 'progress--error';
  }

  /**
   * Formatea segundos en formato mm:ss
   */
  protected formatTime = formatTime;
}
