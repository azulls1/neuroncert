import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurriculumService } from '../../../core/services/curriculum.service';
import { LearningTrack } from '../../../core/models';

/**
 * Track Theory Component - Shows track info with links to study resources and the external course.
 */
@Component({
  selector: 'app-track-theory',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-medium animate-fadeInUp">
      @if (track(); as t) {
        <!-- Breadcrumb -->
        <nav class="breadcrumb mb-6">
          <a routerLink="/tracks">Tracks</a>
          <span>/</span>
          <span class="breadcrumb__current">{{ t.title }}</span>
        </nav>

        <div class="card-section mb-6">
          <h2 class="font-display text-2xl font-bold text-forest mb-2">{{ t.title }}</h2>
          <p class="text-forest mb-4">{{ t.description }}</p>

          <div class="flex flex-wrap gap-2 mb-4">
            @for (tag of t.tags; track tag) {
              <span class="badge badge-info">{{ tag }}</span>
            }
          </div>

          <div class="flex flex-wrap gap-3 items-center">
            <a [routerLink]="['/study/flashcards', trackId()]" class="btn btn-primary hover-lift">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                ></path>
              </svg>
              Estudiar con Flashcards
            </a>

            @if (t.externalUrl) {
              <a
                [href]="t.externalUrl"
                target="_blank"
                rel="noopener"
                class="btn btn-secondary hover-lift"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  ></path>
                </svg>
                Ir al Curso Oficial
              </a>
            }
          </div>
        </div>

        <!-- Modules overview -->
        @if (t.modules.length > 0) {
          <div class="card-section">
            <h3 class="font-display text-lg font-bold text-forest mb-4">Modulos del Track</h3>
            <div class="flex flex-col gap-2">
              @for (mod of t.modules; track mod.id; let i = $index) {
                <div class="card-stat hover-lift px-4 py-3">
                  <div class="flex items-center gap-3">
                    <span class="badge badge-active min-w-[28px] text-center">{{ i + 1 }}</span>
                    <div>
                      <div class="font-semibold text-forest">{{ mod.title }}</div>
                      @if (mod.description) {
                        <div class="text-forest text-[13px]">{{ mod.description }}</div>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        }
      } @else {
        <div class="card-section text-center">
          <h2 class="text-forest mb-4">Track no encontrado</h2>
          <p class="text-forest">No se pudo cargar la informacion del track.</p>
          <a routerLink="/tracks" class="btn btn-secondary mt-4">Volver a Tracks</a>
        </div>
      }
    </div>
  `,
  styles: [],
})
export class TrackTheoryComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private curriculum = inject(CurriculumService);

  trackId = signal<string>('');
  track = computed<LearningTrack | null>(() => {
    const id = this.trackId();
    return id ? (this.curriculum.getTrackById(id) ?? null) : null;
  });

  ngOnInit(): void {
    this.trackId.set(this.route.snapshot.paramMap.get('trackId') ?? '');
  }
}
