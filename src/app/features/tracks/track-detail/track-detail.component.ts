import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { LearningTrack } from '../../../core/models';
import { CurriculumService, ProgressService } from '../../../core/services';

/**
 * Track Detail Component - Shows a learning track's modules and content tabs.
 */
@Component({
  selector: 'app-track-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    @if (isLoading()) {
      <div class="empty-state animate-fadeInUp">
        <div class="loading-dots"><span></span><span></span><span></span></div>
        <p class="empty-state__desc">Cargando track...</p>
      </div>
    } @else if (track(); as t) {
      <div class="stack-lg animate-fadeInUp">
        <!-- Page Header -->
        <div class="page-header">
          <h1 class="page-header__title font-display">{{ t.title }}</h1>
          <p class="page-header__desc">{{ t.description }}</p>
          <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px; flex-wrap: wrap;">
            <span class="badge badge-info">Nivel {{ t.level }}</span>
            <span class="tag font-mono">{{ t.platform }}</span>
            <span style="font-size: 0.875rem;" class="text-pine">{{ t.estimatedHours }}h estimadas</span>
          </div>
        </div>

        <!-- Progress -->
        <div class="progress-labeled">
          <div class="progress">
            <div class="progress__bar" [style.width.%]="completionPercentage()"></div>
          </div>
          <span class="progress-labeled__value">{{ completionPercentage() }}%</span>
        </div>

        <!-- Tabs -->
        <div class="tabs">
          <button
            class="tab"
            [class.active]="activeTab() === 'theory'"
            (click)="activeTab.set('theory')"
          >Teoria</button>
          <button
            class="tab"
            [class.active]="activeTab() === 'practice'"
            (click)="activeTab.set('practice')"
          >Practica</button>
          <button
            class="tab"
            [class.active]="activeTab() === 'exam'"
            (click)="activeTab.set('exam')"
          >Examen</button>
        </div>

        <!-- Theory Tab -->
        @if (activeTab() === 'theory') {
          <div class="tab-panel animate-fadeInUp">
            <div class="alert alert-info">
              <div class="alert__icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
              </div>
              <div class="alert__content">
                <span class="alert__title">Estudia los conceptos clave antes de tomar el examen</span>
              </div>
            </div>
            <div style="display: flex; gap: 12px; margin-top: 16px; flex-wrap: wrap;">
              <a class="btn btn-primary" [routerLink]="['/study/flashcards', t.id]">Iniciar Flashcards</a>
              <a class="btn btn-secondary" [routerLink]="['/study/review', t.id]">Repaso de Conceptos</a>
            </div>
          </div>
        }

        <!-- Practice Tab -->
        @if (activeTab() === 'practice') {
          <div class="tab-panel animate-fadeInUp">
            <div class="alert alert-info" style="margin-bottom: 20px;">
              <div class="alert__icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                </svg>
              </div>
              <div class="alert__content">
                <span class="alert__title">Practica con preguntas de este track</span>
                <span>Responde preguntas una por una con feedback inmediato.</span>
              </div>
            </div>
            <div class="grid-stats" style="margin-bottom: 20px;">
              <div class="card-stat">
                <span class="card-stat__value">{{ totalQuestions() }}</span>
                <span class="card-stat__label">Preguntas</span>
              </div>
              <div class="card-stat">
                <span class="card-stat__value">{{ t.modules.length }}</span>
                <span class="card-stat__label">Modulos</span>
              </div>
              <div class="card-stat">
                <span class="card-stat__value">{{ t.estimatedHours }}h</span>
                <span class="card-stat__label">Estimado</span>
              </div>
            </div>
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
              <a class="btn btn-primary" [routerLink]="['/tracks', t.id, 'practice']">Iniciar Practica</a>
              <a class="btn btn-secondary" [routerLink]="['/study/flashcards', t.id]">Flashcards</a>
              <a class="btn btn-ghost" [routerLink]="['/study/review', t.id]">Repaso de Conceptos</a>
            </div>
          </div>
        }

        <!-- Exam Tab -->
        @if (activeTab() === 'exam') {
          <div class="tab-panel animate-fadeInUp">
            <div class="grid-stats">
              <div class="card-stat">
                <span class="card-stat__value">{{ totalQuestions() }}</span>
                <span class="card-stat__label">Preguntas Disponibles</span>
              </div>
              <div class="card-stat">
                <span class="card-stat__value">{{ estimatedExamDuration() }}</span>
                <span class="card-stat__label">Duracion</span>
              </div>
              <div class="card-stat">
                <span class="card-stat__value">{{ difficultyLabel() }}</span>
                <span class="card-stat__label">Dificultad</span>
              </div>
            </div>
            <div style="margin-top: 16px;">
              <a class="btn btn-cta" [routerLink]="['/exam/start']" [queryParams]="{ trackId: t.id }">Comenzar Examen</a>
            </div>
          </div>
        }

        <!-- Module List -->
        <div class="divider"></div>
        <h2 class="text-forest" style="font-size: 1.25rem; font-weight: 600;">Modulos</h2>
        <div class="stack">
          @for (mod of t.modules; track mod.id) {
            <div class="card-compact hover-lift">
              <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
                <div style="flex: 1; min-width: 0;">
                  <h3 style="font-weight: 600; margin: 0 0 4px;" class="text-forest">{{ mod.title }}</h3>
                  <p style="margin: 0; font-size: 0.875rem;" class="text-pine">{{ mod.description }}</p>
                </div>
                <span class="badge badge-info" style="flex-shrink: 0;">{{ mod.questionCount }} preguntas</span>
              </div>
            </div>
          }
        </div>

        <!-- Back Button -->
        <a class="btn btn-secondary" routerLink="/tracks">Volver a Tracks</a>
      </div>
    } @else {
      <div class="empty-state animate-fadeInUp">
        <div class="empty-state__icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
        <h3 class="empty-state__title">Track no encontrado</h3>
        <p class="empty-state__desc">El track de aprendizaje solicitado no pudo ser encontrado.</p>
        <a class="btn btn-secondary" routerLink="/tracks" style="margin-top: 16px;">Volver a Tracks</a>
      </div>
    }
  `,
  styles: [`:host { display: block; }`]
})
export class TrackDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private curriculum = inject(CurriculumService);
  private progress = inject(ProgressService);

  /** Active content tab */
  activeTab = signal<'theory' | 'practice' | 'exam'>('theory');

  /** Current track data resolved from catalog */
  track = signal<LearningTrack | null>(null);

  /** Loading state while catalog is fetched */
  isLoading = signal<boolean>(true);

  /** Completion percentage from ProgressService */
  completionPercentage = signal<number>(0);

  /** Total questions computed from the track's modules */
  totalQuestions = computed(() => {
    const t = this.track();
    if (!t) return 0;
    return t.modules.reduce((sum, mod) => sum + mod.questionCount, 0);
  });

  /** Estimated exam duration derived from question count (~1.5 min/question) */
  estimatedExamDuration = computed(() => {
    const total = this.totalQuestions();
    const minutes = Math.max(Math.round(total * 1.5), 10);
    return `${minutes} min`;
  });

  /** Difficulty label derived from the track level */
  difficultyLabel = computed(() => {
    const t = this.track();
    if (!t) return '';
    if (t.level <= 2) return 'Principiante';
    if (t.level <= 4) return 'Intermedio';
    if (t.level <= 5) return 'Avanzado';
    return 'Experto';
  });

  ngOnInit(): void {
    const trackId = this.route.snapshot.paramMap.get('trackId');
    if (!trackId) {
      this.isLoading.set(false);
      return;
    }

    this.curriculum.loadCatalog().subscribe({
      next: () => {
        const found = this.curriculum.getTrackById(trackId) ?? null;
        this.track.set(found);
        if (found) {
          this.completionPercentage.set(this.progress.getCompletionPercentage(trackId));
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.track.set(null);
        this.isLoading.set(false);
      }
    });
  }
}
