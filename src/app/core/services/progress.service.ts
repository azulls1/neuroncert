import { Injectable, inject, signal, Signal } from '@angular/core';
import { CurriculumProgress, OverallProgress, LearningLevelNumber } from '../models';
import { SupabaseService } from './supabase.service';

/** Clave de almacenamiento en localStorage */
const STORAGE_KEY = 'claude_learning_progress';

/**
 * Estructura interna persistida en localStorage.
 */
interface StoredProgress {
  tracks: Record<string, CurriculumProgress>;
  overall: OverallProgress;
}

/**
 * Servicio de progreso de aprendizaje
 * Registra y consulta el avance del usuario en localStorage.
 */
@Injectable({
  providedIn: 'root'
})
export class ProgressService {

  private supabase = inject(SupabaseService);

  /** Progreso por track */
  private trackProgressMap = new Map<string, CurriculumProgress>();

  /** Progreso global como signal */
  private _overallProgress = signal<OverallProgress>(this._defaultOverallProgress());

  constructor() {
    this._loadFromLocalStorage();
    // Sync from Supabase on startup (non-blocking) to ensure Supabase is primary
    this.syncFromSupabase().catch(() => {
      // Supabase unavailable — localStorage data is already loaded as fallback
    });
  }

  // ---------------------------------------------------------------------------
  // Consulta
  // ---------------------------------------------------------------------------

  /**
   * Obtiene el progreso de un track especifico.
   * Si no existe, devuelve un registro vacio por defecto.
   */
  getTrackProgress(trackId: string): CurriculumProgress {
    return this.trackProgressMap.get(trackId) ?? this._defaultTrackProgress(trackId);
  }

  /**
   * Signal de solo lectura con el progreso global.
   */
  getOverallProgress(): Signal<OverallProgress> {
    return this._overallProgress.asReadonly();
  }

  /**
   * Devuelve el porcentaje de completitud de un track (0-100).
   */
  getCompletionPercentage(trackId: string): number {
    const progress = this.trackProgressMap.get(trackId);
    if (!progress) return 0;

    let points = 0;
    const total = 3; // theory + practice + at least one exam passed

    if (progress.theoryCompleted) points++;
    if (progress.practiceCompleted) points++;
    if (progress.bestExamScore >= 70) points++;

    return Math.round((points / total) * 100);
  }

  // ---------------------------------------------------------------------------
  // Actualizacion
  // ---------------------------------------------------------------------------

  /**
   * Actualiza parcialmente el progreso de un track.
   */
  updateTrackProgress(trackId: string, update: Partial<CurriculumProgress>): void {
    const current = this.getTrackProgress(trackId);
    const updated: CurriculumProgress = {
      ...current,
      ...update,
      trackId, // asegurar que el trackId no se sobreescriba
      lastAccessedAt: new Date().toISOString()
    };
    this.trackProgressMap.set(trackId, updated);
    this._recalculateOverall();
    this._saveToLocalStorage();

    // Fire-and-forget: sync to Supabase
    try {
      this.supabase.saveProgress(trackId, updated).catch(err =>
        console.warn('[ProgressService] Supabase saveProgress error:', err)
      );
    } catch (err) {
      console.warn('[ProgressService] Supabase saveProgress error:', err);
    }
  }

  /**
   * Marca un modulo como completado dentro de un track.
   */
  markModuleComplete(trackId: string, moduleId: string): void {
    const current = this.getTrackProgress(trackId);
    const completedModules = new Set(current.completedModules);
    completedModules.add(moduleId);

    this.updateTrackProgress(trackId, {
      completedModules: [...completedModules]
    });
  }

  /**
   * Registra un intento de examen para un track.
   */
  recordExamAttempt(trackId: string, score: number): void {
    const current = this.getTrackProgress(trackId);

    this.updateTrackProgress(trackId, {
      examAttempts: current.examAttempts + 1,
      bestExamScore: Math.max(current.bestExamScore, score)
    });

    // Actualizar contadores globales de examenes
    const overall = this._overallProgress();
    this._overallProgress.set({
      ...overall,
      totalExamsTaken: overall.totalExamsTaken + 1,
      lastUpdated: new Date().toISOString()
    });

    this._saveToLocalStorage();

    // Fire-and-forget: sync updated progress to Supabase
    try {
      const updatedProgress = this.getTrackProgress(trackId);
      this.supabase.saveProgress(trackId, updatedProgress).catch(err =>
        console.warn('[ProgressService] Supabase recordExamAttempt sync error:', err)
      );
    } catch (err) {
      console.warn('[ProgressService] Supabase recordExamAttempt sync error:', err);
    }
  }

  /**
   * Registra un intento de examen CCA-F y actualiza el best score si es mayor.
   * Persiste en localStorage y sincroniza con Supabase (fire-and-forget).
   * @param weightedScore Score ponderado del intento (0-1000).
   */
  recordCCAFAttempt(weightedScore: number): void {
    const overall = this._overallProgress();
    const newBest = Math.max(overall.ccafBestScore, weightedScore);

    this._overallProgress.set({
      ...overall,
      ccafAttempts: overall.ccafAttempts + 1,
      ccafBestScore: newBest,
      totalExamsTaken: overall.totalExamsTaken + 1,
      lastUpdated: new Date().toISOString()
    });

    this._saveToLocalStorage();

    // Fire-and-forget: sync CCAF overall progress to Supabase via a synthetic track entry.
    // We persist ccaf data under a reserved trackId '__ccaf_overall' so it round-trips
    // through the existing progress table and can be restored by syncFromSupabase().
    try {
      const overall = this._overallProgress();
      this.supabase.saveProgress('__ccaf_overall', {
        trackId: '__ccaf_overall',
        completedModules: [],
        theoryCompleted: false,
        practiceCompleted: false,
        examAttempts: overall.ccafAttempts,
        bestExamScore: overall.ccafBestScore,
        lastAccessedAt: overall.lastUpdated,
        totalTimeSpentSec: 0
      }).catch(err =>
        console.warn('[ProgressService] Supabase recordCCAFAttempt sync error:', err)
      );
    } catch (err) {
      console.warn('[ProgressService] Supabase recordCCAFAttempt sync error:', err);
    }
  }

  // ---------------------------------------------------------------------------
  // Persistencia
  // ---------------------------------------------------------------------------

  /**
   * Guarda el estado completo en localStorage.
   */
  private _saveToLocalStorage(): void {
    try {
      const tracks: Record<string, CurriculumProgress> = {};
      for (const [key, value] of this.trackProgressMap) {
        tracks[key] = value;
      }

      const data: StoredProgress = {
        tracks,
        overall: this._overallProgress()
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('No se pudo guardar el progreso en localStorage:', error);
    }
  }

  /**
   * Carga el estado desde localStorage.
   * Intenta cargar primero desde Supabase y fusionar con localStorage.
   */
  private _loadFromLocalStorage(): void {
    // 1. Cargar datos locales primero (siempre disponibles de inmediato)
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data: StoredProgress = JSON.parse(raw);

        if (data.tracks) {
          for (const [key, value] of Object.entries(data.tracks)) {
            this.trackProgressMap.set(key, value);
          }
        }

        if (data.overall) {
          this._overallProgress.set(data.overall);
        }
      }
    } catch (error) {
      console.warn('No se pudo cargar el progreso desde localStorage:', error);
    }

    // 2. Supabase sync is now handled by syncFromSupabase() called in the constructor.
    // Removed duplicate inline fetch to avoid race conditions.
  }

  // ---------------------------------------------------------------------------
  // Supabase Sync
  // ---------------------------------------------------------------------------

  /**
   * Carga todo el progreso desde Supabase y lo fusiona con localStorage.
   * Uses a "best-of-both" merge strategy that is robust against clock skew:
   * - Higher examAttempts count wins
   * - Higher bestExamScore wins
   * - More completedModules wins
   * - theoryCompleted / practiceCompleted are OR-merged (once done, always done)
   * - The newer lastAccessedAt is kept
   * - Higher totalTimeSpentSec wins
   */
  async syncFromSupabase(): Promise<void> {
    try {
      const rows = await this.supabase.getProgress();
      if (rows.length === 0) return;

      for (const row of rows) {
        // Restore CCAF overall data from the synthetic track entry
        if (row.trackId === '__ccaf_overall') {
          const current = this._overallProgress();
          // Merge using best-of-both: higher attempts/score wins
          this._overallProgress.set({
            ...current,
            ccafAttempts: Math.max(current.ccafAttempts, row.examAttempts),
            ccafBestScore: Math.max(current.ccafBestScore, row.bestExamScore),
            lastUpdated: row.lastAccessedAt > current.lastUpdated
              ? row.lastAccessedAt
              : current.lastUpdated
          });
          continue;
        }

        const local = this.trackProgressMap.get(row.trackId);
        if (!local) {
          // No local data — take Supabase data as-is
          this.trackProgressMap.set(row.trackId, {
            trackId: row.trackId,
            completedModules: row.completedModules,
            theoryCompleted: row.theoryCompleted,
            practiceCompleted: row.practiceCompleted,
            examAttempts: row.examAttempts,
            bestExamScore: row.bestExamScore,
            lastAccessedAt: row.lastAccessedAt,
            totalTimeSpentSec: row.totalTimeSpentSec
          });
        } else {
          // Merge best-of-both to handle clock skew gracefully
          const mergedModules = [...new Set([
            ...local.completedModules,
            ...row.completedModules
          ])];

          this.trackProgressMap.set(row.trackId, {
            trackId: row.trackId,
            completedModules: mergedModules,
            theoryCompleted: local.theoryCompleted || row.theoryCompleted,
            practiceCompleted: local.practiceCompleted || row.practiceCompleted,
            examAttempts: Math.max(local.examAttempts, row.examAttempts),
            bestExamScore: Math.max(local.bestExamScore, row.bestExamScore),
            lastAccessedAt: row.lastAccessedAt > local.lastAccessedAt
              ? row.lastAccessedAt
              : local.lastAccessedAt,
            totalTimeSpentSec: Math.max(local.totalTimeSpentSec, row.totalTimeSpentSec)
          });
        }
      }

      this._recalculateOverall();
      this._saveToLocalStorage();
    } catch (err) {
      console.warn('[ProgressService] syncFromSupabase error:', err);
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Recalcula el progreso global a partir de los tracks individuales.
   */
  private _recalculateOverall(): void {
    const tracks = [...this.trackProgressMap.values()];

    let totalExams = 0;
    let totalScore = 0;
    let tracksCompleted = 0;

    for (const t of tracks) {
      totalExams += t.examAttempts;
      totalScore += t.bestExamScore;
      if (this.getCompletionPercentage(t.trackId) >= 100) {
        tracksCompleted++;
      }
    }

    const averageScore = tracks.length > 0
      ? Math.round(totalScore / tracks.length)
      : 0;

    const current = this._overallProgress();

    this._overallProgress.set({
      ...current,
      tracksStarted: tracks.length,
      tracksCompleted,
      totalExamsTaken: totalExams,
      averageScore,
      lastUpdated: new Date().toISOString()
    });
  }

  /**
   * Progreso por defecto para un track nuevo.
   */
  private _defaultTrackProgress(trackId: string): CurriculumProgress {
    return {
      trackId,
      completedModules: [],
      theoryCompleted: false,
      practiceCompleted: false,
      examAttempts: 0,
      bestExamScore: 0,
      lastAccessedAt: new Date().toISOString(),
      totalTimeSpentSec: 0
    };
  }

  /**
   * Progreso global vacio por defecto.
   */
  private _defaultOverallProgress(): OverallProgress {
    const progressByLevel: Record<LearningLevelNumber, { total: number; completed: number }> = {
      1: { total: 0, completed: 0 },
      2: { total: 0, completed: 0 },
      3: { total: 0, completed: 0 },
      4: { total: 0, completed: 0 },
      5: { total: 0, completed: 0 },
      6: { total: 0, completed: 0 },
      7: { total: 0, completed: 0 }
    };

    return {
      tracksStarted: 0,
      tracksCompleted: 0,
      totalExamsTaken: 0,
      averageScore: 0,
      ccafBestScore: 0,
      ccafAttempts: 0,
      progressByLevel,
      lastUpdated: new Date().toISOString()
    };
  }
}
