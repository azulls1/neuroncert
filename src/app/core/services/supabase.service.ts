import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ExamResult, DomainScore, ExamSummary } from '../models/exam-result.model';
import { CurriculumProgress } from '../models/curriculum-progress.model';
import { ExamMode } from '../models/content-type.model';
import { DeviceIdService } from './device-id.service';
import { environment } from '../../../environments/environment';

// ---------------------------------------------------------------------------
// Table name constants (hyphenated names require quoting in SQL)
// ---------------------------------------------------------------------------
const TABLE_EXAM_RESULTS = 'iagentek_simuexamen_exam_results';
const TABLE_PROGRESS = 'iagentek_simuexamen_progress';
const TABLE_STUDY_SESSIONS = 'iagentek_simuexamen_study_sessions';
const TABLE_LEADERBOARD = 'iagentek_simuexamen_leaderboard';

// ---------------------------------------------------------------------------
// DTOs (row shapes for Supabase inserts / selects)
// ---------------------------------------------------------------------------

/** Row shape for exam_results table */
export interface ExamResultRow {
  examId: string;
  score: number;
  weightedScore: number | null;
  passed: boolean | null;
  mode: ExamMode;
  domains: string[];
  summary: ExamSummary;
  domainScores: DomainScore[] | null;
  completedAt: string;
  durationSec: number;
}

/** Row shape for progress table */
export interface ProgressRow {
  trackId: string;
  completedModules: string[];
  theoryCompleted: boolean;
  practiceCompleted: boolean;
  examAttempts: number;
  bestExamScore: number;
  lastAccessedAt: string;
  totalTimeSpentSec: number;
}

/** Row shape for study_sessions table */
export interface StudySessionRow {
  sessionId: string;
  trackId: string;
  contentType: string;
  questionsAnswered: number;
  correctAnswers: number;
  durationSec: number;
  startedAt: string;
}

/** Row shape for leaderboard view */
export interface LeaderboardRow {
  rank: number;
  score: number;
  mode: string;
  completedAt: string;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase!: SupabaseClient;
  private _clientPromise: Promise<SupabaseClient> | null = null;
  private deviceId = inject(DeviceIdService);
  private platformId = inject(PLATFORM_ID);
  private isBrowser: boolean;

  /** Reactive connection status */
  private _connected = signal<boolean>(false);
  get connected() {
    return this._connected.asReadonly();
  }

  /** Last error message (for debugging UI) */
  private _lastError = signal<string | null>(null);
  get lastError() {
    return this._lastError.asReadonly();
  }

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  /**
   * Lazily initializes the Supabase client on first use via dynamic import.
   * This avoids loading the ~194KB Supabase JS bundle eagerly at startup.
   */
  private async ensureClient(): Promise<SupabaseClient> {
    if (this.supabase) return this.supabase;
    if (!this.isBrowser) throw new Error('SupabaseService: Not in browser environment');

    if (!this._clientPromise) {
      this._clientPromise = import('@supabase/supabase-js').then(({ createClient }) => {
        const supabaseUrl = environment.supabase.url.startsWith('http')
          ? environment.supabase.url
          : `${window.location.origin}${environment.supabase.url}`;
        this.supabase = createClient(supabaseUrl, environment.supabase.anonKey, {
          global: {
            headers: { 'x-device-id': this.deviceId.getDeviceId() },
          },
        });
        this.verifyConnection();
        return this.supabase;
      });
    }
    return this._clientPromise;
  }

  /**
   * Pings Supabase with a lightweight query to confirm the connection is alive.
   * Sets `_connected` to true only when Supabase responds successfully.
   */
  private async verifyConnection(): Promise<void> {
    try {
      const client = await this.ensureClient();
      const { error } = await client
        .from(TABLE_EXAM_RESULTS)
        .select('examId', { count: 'exact', head: true })
        .limit(1);

      if (error) {
        this._connected.set(false);
        this._lastError.set(`Connection verification failed: ${error.message}`);
        return;
      }

      this._connected.set(true);
      this._lastError.set(null);
    } catch (err: unknown) {
      this._connected.set(false);
      const message = err instanceof Error ? err.message : String(err);
      this._lastError.set(`Connection verification failed: ${message}`);
    }
  }

  // =========================================================================
  // Exam Results
  // =========================================================================

  /**
   * Persists a completed exam result to Supabase.
   * Returns the inserted row or null on error.
   */
  async saveExamResult(result: ExamResult): Promise<ExamResultRow | null> {
    if (!this.isBrowser) {
      return null;
    }
    const row: ExamResultRow = {
      examId: result.examId,
      score: result.score,
      weightedScore: result.weightedScore ?? null,
      passed: result.passed ?? null,
      mode: result.mode ?? 'standard',
      domains: result.domains,
      summary: result.summary,
      domainScores: result.domainScores ?? null,
      completedAt:
        result.completedAt instanceof Date
          ? result.completedAt.toISOString()
          : String(result.completedAt),
      durationSec: result.summary.totalTimeSpent,
    };

    const client = await this.ensureClient();
    const { data, error } = await client
      .from(TABLE_EXAM_RESULTS)
      .insert({ ...row, device_id: this.deviceId.getDeviceId() })
      .select()
      .single();

    if (error) {
      this._lastError.set(`saveExamResult: ${error.message}`);
      return null;
    }

    this._lastError.set(null);
    return data as ExamResultRow;
  }

  /**
   * Queries the most recent exam results, ordered by completedAt desc.
   * @param limit Maximum number of results to return (default 20).
   */
  async getExamHistory(limit = 20): Promise<ExamResultRow[]> {
    if (!this.isBrowser) {
      return [];
    }
    const client = await this.ensureClient();
    const { data, error } = await client
      .from(TABLE_EXAM_RESULTS)
      .select('*')
      .eq('device_id', this.deviceId.getDeviceId())
      .order('completedAt', { ascending: false })
      .limit(limit);

    if (error) {
      this._lastError.set(`getExamHistory: ${error.message}`);
      return [];
    }

    this._lastError.set(null);
    return (data ?? []) as ExamResultRow[];
  }

  // =========================================================================
  // Learning Progress
  // =========================================================================

  /**
   * Upserts (insert-or-update) progress for a given track.
   * Uses trackId as the conflict key.
   */
  async saveProgress(
    trackId: string,
    progress: Partial<CurriculumProgress>,
  ): Promise<ProgressRow | null> {
    if (!this.isBrowser) {
      return null;
    }
    const row: ProgressRow = {
      trackId,
      completedModules: progress.completedModules ?? [],
      theoryCompleted: progress.theoryCompleted ?? false,
      practiceCompleted: progress.practiceCompleted ?? false,
      examAttempts: progress.examAttempts ?? 0,
      bestExamScore: progress.bestExamScore ?? 0,
      lastAccessedAt: progress.lastAccessedAt ?? new Date().toISOString(),
      totalTimeSpentSec: progress.totalTimeSpentSec ?? 0,
    };

    const client = await this.ensureClient();
    const { data, error } = await client
      .from(TABLE_PROGRESS)
      .upsert(
        { ...row, device_id: this.deviceId.getDeviceId() },
        { onConflict: 'device_id,trackId' },
      )
      .select()
      .single();

    if (error) {
      this._lastError.set(`saveProgress: ${error.message}`);
      return null;
    }

    this._lastError.set(null);
    return data as ProgressRow;
  }

  /**
   * Gets progress for a specific track or all tracks.
   * @param trackId Optional track filter. When omitted, returns all.
   */
  async getProgress(trackId?: string): Promise<ProgressRow[]> {
    if (!this.isBrowser) {
      return [];
    }
    const client = await this.ensureClient();
    let query = client
      .from(TABLE_PROGRESS)
      .select('*')
      .eq('device_id', this.deviceId.getDeviceId())
      .order('lastAccessedAt', { ascending: false });

    if (trackId) {
      query = query.eq('trackId', trackId);
    }

    const { data, error } = await query;

    if (error) {
      this._lastError.set(`getProgress: ${error.message}`);
      return [];
    }

    this._lastError.set(null);
    return (data ?? []) as ProgressRow[];
  }

  // =========================================================================
  // Leaderboard
  // =========================================================================

  /**
   * Gets the top scores from the leaderboard view.
   * @param limit Number of entries to return (default 10).
   * @deprecated This method is currently unused — no callers exist in the codebase.
   */
  async getLeaderboard(limit = 10): Promise<LeaderboardRow[]> {
    if (!this.isBrowser) {
      return [];
    }
    const client = await this.ensureClient();
    const { data, error } = await client
      .from(TABLE_LEADERBOARD)
      .select('*')
      .order('score', { ascending: false })
      .limit(limit);

    if (error) {
      this._lastError.set(`getLeaderboard: ${error.message}`);
      return [];
    }

    this._lastError.set(null);
    return (data ?? []) as LeaderboardRow[];
  }

  // =========================================================================
  // Study Sessions
  // =========================================================================

  /**
   * Logs a study session to Supabase for analytics.
   */
  async saveStudySession(session: StudySessionRow): Promise<StudySessionRow | null> {
    if (!this.isBrowser) {
      return null;
    }
    const client = await this.ensureClient();
    const { data, error } = await client
      .from(TABLE_STUDY_SESSIONS)
      .insert({ ...session, device_id: this.deviceId.getDeviceId() })
      .select()
      .single();

    if (error) {
      this._lastError.set(`saveStudySession: ${error.message}`);
      return null;
    }

    this._lastError.set(null);
    return data as StudySessionRow;
  }

  // =========================================================================
  // Exam Answer Validation (server-side anti-cheat)
  // =========================================================================

  /**
   * Validates exam answers server-side via Supabase RPC.
   * Receives the answer key as a parameter since questions come from static JSON.
   * Returns the validation result or null on error (caller should fall back to client-side).
   */
  async validateExamAnswers(
    examId: string,
    answers: { questionId: string; optionId: string }[],
    answerKey: Record<string, string>,
  ): Promise<{
    examId: string;
    correct: number;
    incorrect: number;
    skipped: number;
    total: number;
    scorePercentage: number;
    items: {
      questionId: string;
      isCorrect: boolean;
      selectedOptionId: string | null;
      correctOptionId: string;
    }[];
    validatedAt: string;
  } | null> {
    if (!this.isBrowser) return null;
    try {
      const client = await this.ensureClient();
      const { data, error } = await client.rpc('validate_exam_answers', {
        p_exam_id: examId,
        p_answers: answers,
        p_answer_key: answerKey,
        p_device_id: this.deviceId.getDeviceId(),
      });
      if (error) {
        this._lastError.set(`validateExamAnswers: ${error.message}`);
        return null;
      }
      this._lastError.set(null);
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this._lastError.set(`validateExamAnswers: ${message}`);
      return null;
    }
  }

  // =========================================================================
  // Utility
  // =========================================================================

  /**
   * Returns the raw SupabaseClient for advanced / ad-hoc queries.
   * Returns null during SSR when no client is available.
   * @deprecated This method is currently unused — no callers exist in the codebase.
   */
  async getClient(): Promise<SupabaseClient | null> {
    if (!this.isBrowser) {
      return null;
    }
    return this.ensureClient();
  }
}
