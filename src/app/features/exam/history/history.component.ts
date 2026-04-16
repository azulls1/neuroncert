import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ExamHistoryService, ExamSession } from '../../../core/services/exam-history.service';
import { ConfigService } from '../../../core/services/config.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-medium animate-fadeInUp stagger-children">

      <!-- Breadcrumb -->
      <div class="breadcrumb animate-fadeInUp">
        <a routerLink="/">Inicio</a>
        <span>/</span>
        <span class="breadcrumb__current">Historial de Examenes</span>
      </div>

      <!-- Header -->
      <div class="page-header animate-fadeInUp">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 4px;">
          <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(4, 32, 44, 0.1); display: flex; align-items: center; justify-content: center;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#04202C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div>
            <h1 class="page-header__title font-display">Historial de Examenes</h1>
            <p class="page-header__desc">Revisa tus intentos anteriores y monitorea tu progreso.</p>
          </div>
        </div>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="card-section" style="display: flex; justify-content: center; padding: 48px;">
          <div class="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      }

      <!-- Empty State -->
      @if (!loading() && sessions().length === 0) {
        <div class="card-section animate-fadeInUp">
          <div class="empty-state">
            <svg class="empty-state__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
              <line x1="9" y1="12" x2="15" y2="12"/>
              <line x1="9" y1="16" x2="13" y2="16"/>
            </svg>
            <div class="empty-state__title">No hay examenes registrados</div>
            <div class="empty-state__desc" style="margin-bottom: 20px;">Realiza tu primer examen para comenzar a ver tu historial aqui.</div>
            <a routerLink="/exam/start" class="btn btn-primary hover-lift">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              Iniciar Examen
            </a>
          </div>
        </div>
      }

      <!-- Summary Stats -->
      @if (!loading() && sessions().length > 0) {
        <div class="grid-stats mb-6 stagger-children animate-fadeInUp">
          <div class="card-stat hover-lift">
            <div class="card-stat__label">Total Examenes</div>
            <div class="card-stat__value font-display">{{ sessions().length }}</div>
          </div>
          <div class="card-stat hover-lift">
            <div class="card-stat__label">Mejor Score</div>
            <div class="card-stat__value font-display">{{ bestScore() }}%</div>
          </div>
          <div class="card-stat hover-lift">
            <div class="card-stat__label">Promedio</div>
            <div class="card-stat__value font-display">{{ averageScore() }}%</div>
          </div>
          <div class="card-stat hover-lift">
            <div class="card-stat__label">Aprobados</div>
            <div class="card-stat__value font-display">{{ passedCount() }}</div>
          </div>
        </div>

        <!-- Session List -->
        <div class="stack animate-fadeInUp">
          @for (session of sessions(); track session.sessionId) {
            <div class="card hover-lift" style="padding: 20px;">
              <div style="display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px;">

                <!-- Left: info -->
                <div style="flex: 1; min-width: 200px;">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;">
                    <span class="badge" [ngClass]="getModeBadgeClass(session.difficulty)">
                      {{ getModeLabel(session.difficulty) }}
                    </span>
                    <span class="badge" [ngClass]="getScoreBadgeClass(getScorePercent(session))">
                      {{ getScorePercent(session) }}%
                    </span>
                    @if (isPassed(session)) {
                      <span class="badge badge-active">Aprobado</span>
                    } @else {
                      <span class="badge badge-error">No Aprobado</span>
                    }
                  </div>

                  <div style="font-size: 14px; color: var(--color-text-secondary); display: flex; flex-wrap: wrap; gap: 16px;">
                    <span style="display: flex; align-items: center; gap: 4px;">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      {{ formatDate(session.startTime) }}
                    </span>
                    <span style="display: flex; align-items: center; gap: 4px;">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      {{ getDuration(session) }}
                    </span>
                    <span style="display: flex; align-items: center; gap: 4px;">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                        <rect x="9" y="3" width="6" height="4" rx="1"/>
                      </svg>
                      {{ session.correctAnswers }}/{{ session.totalQuestions }} correctas
                    </span>
                  </div>
                </div>

                <!-- Right: score circle -->
                <div style="display: flex; align-items: center; justify-content: center; min-width: 64px;">
                  <div style="width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px;"
                    [style.background]="getScoreCircleBg(getScorePercent(session))"
                    [style.color]="getScoreCircleColor(getScorePercent(session))">
                    {{ getScorePercent(session) }}%
                  </div>
                </div>
              </div>

              <!-- Progress bar -->
              <div style="margin-top: 12px;">
                <div class="progress" [ngClass]="getProgressClass(getScorePercent(session))">
                  <div class="progress__bar" [style.width.%]="getScorePercent(session)"></div>
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Actions -->
      <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-top: 32px;" class="animate-fadeInUp">
        <a routerLink="/exam/start" class="btn btn-primary hover-lift">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          Nuevo Examen
        </a>
        <a routerLink="/" class="btn btn-secondary hover-lift">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          </svg>
          Volver al Dashboard
        </a>
        @if (sessions().length > 0) {
          <button type="button" (click)="clearHistory()" class="btn btn-ghost">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
            Limpiar Historial
          </button>
        }
      </div>

    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    .mb-6 {
      margin-bottom: 24px;
    }
  `]
})
export class HistoryComponent implements OnInit {
  private historyService = inject(ExamHistoryService);
  private configService = inject(ConfigService);

  loading = signal(true);
  sessions = computed(() => {
    const all = this.historyService.sessions();
    // Sort by start time descending (most recent first)
    return [...all].sort((a, b) =>
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  });

  bestScore = computed(() => {
    const s = this.sessions();
    if (s.length === 0) return 0;
    return Math.max(...s.map(session => this.getScorePercent(session)));
  });

  averageScore = computed(() => {
    const s = this.sessions();
    if (s.length === 0) return 0;
    const total = s.reduce((sum, session) => sum + this.getScorePercent(session), 0);
    return Math.round(total / s.length);
  });

  passedCount = computed(() => {
    return this.sessions().filter(s => this.isPassed(s)).length;
  });

  async ngOnInit(): Promise<void> {
    try {
      await this.historyService.loadFromSupabase();
    } catch {
      // Supabase sync failed — local data is still available
    } finally {
      this.loading.set(false);
    }
  }

  getScorePercent(session: ExamSession): number {
    if (!session.totalQuestions || session.totalQuestions === 0) return 0;
    return Math.round((session.correctAnswers / session.totalQuestions) * 100);
  }

  isPassed(session: ExamSession): boolean {
    return this.getScorePercent(session) >= this.configService.passingPercent;
  }

  getModeLabel(mode: string): string {
    switch (mode) {
      case 'ccaf': return 'CCA-F';
      case 'practice': return 'Practica';
      case 'study': return 'Estudio';
      case 'standard': return 'Estandar';
      default: return mode || 'Estandar';
    }
  }

  getModeBadgeClass(mode: string): string {
    switch (mode) {
      case 'ccaf': return 'badge badge-info';
      case 'practice': return 'badge badge-warning';
      case 'study': return 'badge badge-inactive';
      default: return 'badge badge-inactive';
    }
  }

  getScoreBadgeClass(score: number): string {
    if (score >= this.configService.passingPercent) return 'badge badge-active';
    if (score >= 50) return 'badge badge-warning';
    return 'badge badge-error';
  }

  getProgressClass(score: number): string {
    if (score >= this.configService.passingPercent) return 'progress--success';
    if (score >= 50) return 'progress--warning';
    return 'progress--error';
  }

  getScoreCircleBg(score: number): string {
    if (score >= this.configService.passingPercent) return '#ECFDF5';
    if (score >= 50) return '#FFFBEB';
    return '#FEF2F2';
  }

  getScoreCircleColor(score: number): string {
    if (score >= this.configService.passingPercent) return '#059669';
    if (score >= 50) return '#D97706';
    return '#DC2626';
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getDuration(session: ExamSession): string {
    if (!session.endTime) return 'En progreso';
    const start = new Date(session.startTime).getTime();
    const end = new Date(session.endTime).getTime();
    const diffMs = end - start;
    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }

  clearHistory(): void {
    if (confirm('Estas seguro de que quieres eliminar todo el historial? Esta accion no se puede deshacer.')) {
      this.historyService.clearAllHistory();
    }
  }
}
