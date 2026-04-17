import { Component, DestroyRef, signal, computed, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CurriculumService } from '../../../core/services/curriculum.service';
import { ProgressService } from '../../../core/services/progress.service';

/**
 * Track List Component - Browse and filter learning tracks.
 */
@Component({
  selector: 'app-track-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stack-lg animate-fadeInUp">
      <!-- Page Header -->
      <div class="page-header">
        <h1 class="page-header__title">Tracks de Aprendizaje</h1>
        <p class="page-header__desc">
          Explora rutas de aprendizaje estructuradas para dominar Claude AI — desde cursos
          introductorios hasta preparacion para certificaciones.
        </p>
      </div>

      <!-- Level Filter -->
      <div class="filter-pills">
        <button
          class="filter-pill"
          [class.active]="selectedLevel() === 0"
          (click)="selectedLevel.set(0)"
        >
          Todos los Niveles
        </button>
        @for (lvl of availableLevels(); track lvl) {
          <button
            class="filter-pill"
            [class.active]="selectedLevel() === lvl"
            (click)="selectedLevel.set(lvl)"
          >
            Nivel {{ lvl }}
          </button>
        }
      </div>

      <!-- Platform Filter -->
      <div class="filter-pills">
        <button
          class="filter-pill"
          [class.active]="selectedPlatform() === 'all'"
          (click)="selectedPlatform.set('all')"
        >
          Todas las Plataformas
        </button>
        @for (p of availablePlatforms(); track p.key) {
          <button
            class="filter-pill"
            [class.active]="selectedPlatform() === p.key"
            (click)="selectedPlatform.set(p.key)"
          >
            {{ p.label }}
          </button>
        }
      </div>

      <!-- Track Cards Grid -->
      @if (filteredTracks().length > 0) {
        <div class="grid-features stagger-children">
          @for (track of filteredTracks(); track track.id) {
            <div class="card-feature hover-lift animate-fadeInUp">
              <div class="flex items-center justify-between mb-2">
                <span
                  class="badge"
                  [class.badge-active]="isStarted(track.id)"
                  [class.badge-info]="!isStarted(track.id)"
                >
                  Nivel {{ track.level }}
                </span>
                <span class="tag font-mono">{{ getPlatformLabel(track.platform) }}</span>
              </div>

              <h2 class="text-forest font-semibold text-base mt-2 mb-1">
                {{ track.title }}
              </h2>
              <p class="text-pine text-sm mb-3">
                {{ track.description }}
              </p>

              <div class="flex items-center gap-2 mb-3">
                <svg
                  width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round"
                  stroke-linejoin="round" class="text-moss"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span class="text-pine text-[0.8125rem]"
                  >{{ track.estimatedHours }}h estimadas</span
                >
              </div>

              @if (isStarted(track.id) && getProgress(track.id) > 0) {
                <div class="progress-labeled mb-3">
                  <div class="progress">
                    <div
                      class="progress__bar"
                      [class.progress--success]="getProgress(track.id) === 100"
                      [style.width.%]="getProgress(track.id)"
                    ></div>
                  </div>
                  <span class="progress-labeled__value">{{ getProgress(track.id) }}%</span>
                </div>
              }

              <button
                class="btn w-full"
                [class.btn-primary]="!isStarted(track.id)"
                [class.btn-secondary]="isStarted(track.id)"
                (click)="goToTrack(track.id)"
              >
                {{ isStarted(track.id) ? 'Continuar' : 'Comenzar' }}
              </button>
            </div>
          }
        </div>
      } @else {
        <div class="empty-state animate-fadeInUp">
          <div class="empty-state__icon">
            <svg
              width="40" height="40" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <h2 class="empty-state__title">No se encontraron tracks</h2>
          <p class="empty-state__desc">
            Intenta ajustar los filtros para encontrar tracks disponibles.
          </p>
        </div>
      }
    </div>
  `,
  styles: [],
})
export class TrackListComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private curriculum = inject(CurriculumService);
  private progress = inject(ProgressService);
  private router = inject(Router);

  /** Filter signals */
  selectedLevel = signal(0);
  selectedPlatform = signal('all');

  /** All tracks from the catalog */
  private tracks = this.curriculum.getTracks();

  /** Available levels derived from actual tracks */
  availableLevels = computed(() => {
    const levels = this.tracks().map((t) => t.level);
    return [...new Set(levels)].sort((a, b) => a - b);
  });

  /** Platform label map */
  private platformLabels: Record<string, string> = {
    academy: 'Academy',
    coursera: 'Coursera',
    'deeplearning-ai': 'DeepLearning.AI',
    'github-courses': 'GitHub Courses',
    'cca-f': 'CCA-F',
  };

  /** Platform options derived from actual tracks */
  availablePlatforms = computed(() => {
    const platforms = [...new Set(this.tracks().map((t) => t.platform))];
    return platforms.map((key) => ({
      key,
      label: this.platformLabels[key] ?? key,
    }));
  });

  /** Filtered tracks based on selected filters */
  filteredTracks = computed(() => {
    const level = this.selectedLevel();
    const platform = this.selectedPlatform();

    return this.tracks().filter((t) => {
      const matchLevel = level === 0 || t.level === level;
      const matchPlatform = platform === 'all' || t.platform === platform;
      return matchLevel && matchPlatform;
    });
  });

  ngOnInit(): void {
    this.curriculum.loadCatalog().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  /** Check if a track has been started */
  isStarted(trackId: string): boolean {
    const tp = this.progress.getTrackProgress(trackId);
    return tp.examAttempts > 0 || this.progress.getCompletionPercentage(trackId) > 0;
  }

  /** Get completion percentage for a track */
  getProgress(trackId: string): number {
    return this.progress.getCompletionPercentage(trackId);
  }

  /** Navigate to track detail */
  goToTrack(trackId: string): void {
    this.router.navigate(['/tracks', trackId]);
  }

  /** Get display label for a platform key */
  getPlatformLabel(key: string): string {
    return this.platformLabels[key] ?? key;
  }
}
