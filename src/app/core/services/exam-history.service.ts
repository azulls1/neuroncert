import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService, StudySessionRow } from './supabase.service';

export interface ExamQuestionHistory {
  id: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  difficulty: string;
  timestamp: Date;
  questionNumber: number;
}

export interface ExamSession {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  totalQuestions: number;
  correctAnswers: number;
  difficulty: string;
  questions: ExamQuestionHistory[];
}

@Injectable({
  providedIn: 'root'
})
export class ExamHistoryService {
  private readonly STORAGE_KEY = 'exam_history_sessions';
  private supabase = inject(SupabaseService);
  private _currentSession = signal<ExamSession | null>(null);
  private _sessions = signal<ExamSession[]>([]);

  constructor() {
    this.loadSessionsFromStorage();
    // Non-blocking: fetch Supabase history and merge with localStorage data
    this.loadFromSupabase().catch(() => {
      // Supabase unavailable — localStorage data is already loaded as fallback
    });
  }

  // Getters
  get currentSession() { return this._currentSession.asReadonly(); }
  get sessions() { return this._sessions.asReadonly(); }

  /**
   * Inicia una nueva sesión de examen
   */
  startNewSession(difficulty: string): string {
    const sessionId = this.generateSessionId();
    const newSession: ExamSession = {
      sessionId,
      startTime: new Date(),
      totalQuestions: 0,
      correctAnswers: 0,
      difficulty,
      questions: []
    };

    this._currentSession.set(newSession);
    this.saveSessionsToStorage();

    return sessionId;
  }

  /**
   * Agrega una pregunta al historial actual
   */
  addQuestionToHistory(
    question: string,
    options: { A: string; B: string; C: string; D: string },
    userAnswer: string,
    correctAnswer: string,
    isCorrect: boolean,
    difficulty: string
  ): void {
    const currentSession = this._currentSession();
    if (!currentSession) {
      return;
    }

    const questionHistory: ExamQuestionHistory = {
      id: this.generateQuestionId(),
      question,
      options,
      userAnswer,
      correctAnswer,
      isCorrect,
      difficulty,
      timestamp: new Date(),
      questionNumber: currentSession.questions.length + 1
    };

    // Actualizar la sesión actual
    const updatedSession: ExamSession = {
      ...currentSession,
      totalQuestions: currentSession.totalQuestions + 1,
      correctAnswers: isCorrect ? currentSession.correctAnswers + 1 : currentSession.correctAnswers,
      questions: [...currentSession.questions, questionHistory]
    };

    this._currentSession.set(updatedSession);
    this.saveSessionsToStorage();
  }

  /**
   * Finaliza la sesión actual
   */
  endCurrentSession(): ExamSession | null {
    const currentSession = this._currentSession();
    if (!currentSession) {
      return null;
    }

    const endedSession: ExamSession = {
      ...currentSession,
      endTime: new Date()
    };

    // Agregar a la lista de sesiones
    const updatedSessions = [...this._sessions(), endedSession];
    this._sessions.set(updatedSessions);

    // Limpiar sesión actual
    this._currentSession.set(null);
    this.saveSessionsToStorage();

    return endedSession;
  }

  /**
   * Obtiene el historial de una sesión específica
   */
  getSessionHistory(sessionId: string): ExamSession | null {
    return this._sessions().find(session => session.sessionId === sessionId) || null;
  }

  /**
   * Obtiene todas las sesiones
   */
  getAllSessions(): ExamSession[] {
    return this._sessions();
  }

  /**
   * Limpia todo el historial
   */
  clearAllHistory(): void {
    this._sessions.set([]);
    this._currentSession.set(null);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Obtiene estadísticas de la sesión actual
   */
  getCurrentSessionStats(): { total: number; correct: number; percentage: number } | null {
    const currentSession = this._currentSession();
    if (!currentSession) return null;

    const total = currentSession.totalQuestions;
    const correct = currentSession.correctAnswers;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

    return { total, correct, percentage };
  }

  /**
   * Carga el historial desde Supabase y lo fusiona con los datos locales.
   * Las sesiones de Supabase se agregan si no existen localmente.
   * Deduplication uses both sessionId and examId to avoid duplicates
   * across the two different ID schemes (session_* vs exam_*).
   */
  async loadFromSupabase(): Promise<void> {
    try {
      const rows = await this.supabase.getExamHistory(50);
      if (rows.length === 0) return;

      // Build a set of all known IDs — both sessionId and examId formats —
      // so we can deduplicate across the two different ID schemes.
      const currentSessions = [...this._sessions()];
      const existingIds = new Set<string>();
      for (const s of currentSessions) {
        existingIds.add(s.sessionId);
      }

      let merged = false;
      for (const row of rows) {
        // Skip if we already have a session with this examId (from a previous sync)
        if (existingIds.has(row.examId)) continue;

        // Also skip if a local session matches by timestamp + score (heuristic
        // dedup for sessions saved locally as session_* and remotely as exam_*)
        const remoteTime = new Date(row.completedAt).getTime();
        const alreadyExists = currentSessions.some(s => {
          const localEnd = s.endTime ? new Date(s.endTime).getTime() : 0;
          return (
            Math.abs(localEnd - remoteTime) < 5000 &&
            s.totalQuestions === (row.summary?.totalQuestions ?? 0) &&
            s.correctAnswers === (row.summary?.correct ?? 0)
          );
        });
        if (alreadyExists) continue;

        const remoteSession: ExamSession = {
          sessionId: row.examId,
          startTime: new Date(remoteTime - row.durationSec * 1000),
          endTime: new Date(remoteTime),
          totalQuestions: row.summary?.totalQuestions ?? 0,
          correctAnswers: row.summary?.correct ?? 0,
          difficulty: row.mode,
          questions: []
        };
        currentSessions.push(remoteSession);
        existingIds.add(row.examId);
        merged = true;
      }

      if (merged) {
        // Sort by start time descending
        currentSessions.sort((a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        );
        this._sessions.set(currentSessions);
        this.saveSessionsToStorage();
      }
    } catch {
      // Supabase sync failed silently — local data is still available
    }
  }

  /**
   * Genera un ID único para la sesión
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Genera un ID único para la pregunta
   */
  private generateQuestionId(): string {
    return `question_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Calcula la duración de una sesión
   */
  private calculateSessionDuration(session: ExamSession): string {
    if (!session.endTime) return 'En progreso';

    const duration = session.endTime.getTime() - session.startTime.getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Guarda las sesiones en localStorage
   */
  private saveSessionsToStorage(): void {
    try {
      const dataToSave = {
        sessions: this._sessions(),
        currentSession: this._currentSession()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('❌ Error al guardar historial en localStorage:', error);
    }

    // Fire-and-forget: persist completed sessions to Supabase
    try {
      const sessions = this._sessions();
      if (sessions.length > 0) {
        const lastSession = sessions[sessions.length - 1];
        if (lastSession.endTime) {
          const durationMs = new Date(lastSession.endTime).getTime() - new Date(lastSession.startTime).getTime();
          const row: StudySessionRow = {
            sessionId: lastSession.sessionId,
            trackId: lastSession.difficulty,
            contentType: 'exam',
            questionsAnswered: lastSession.totalQuestions,
            correctAnswers: lastSession.correctAnswers,
            durationSec: Math.round(durationMs / 1000),
            startedAt: new Date(lastSession.startTime).toISOString()
          };
          this.supabase.saveStudySession(row).catch(() => {
            // Supabase persistence failed — session is still saved locally
          });
        }
      }
    } catch {
      // Supabase sync error — local storage is primary
    }
  }

  /**
   * Carga las sesiones desde localStorage
   */
  private loadSessionsFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this._sessions.set(data.sessions || []);
        this._currentSession.set(data.currentSession || null);
      }
    } catch (error) {
      console.error('❌ Error al cargar historial desde localStorage:', error);
      this._sessions.set([]);
      this._currentSession.set(null);
    }
  }
}
