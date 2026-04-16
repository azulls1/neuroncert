import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ExamHistoryService, ExamSession } from './exam-history.service';
import { SupabaseService } from './supabase.service';
import { LoggingService } from './logging.service';

describe('ExamHistoryService', () => {
  let service: ExamHistoryService;
  let supabaseSpy: jasmine.SpyObj<SupabaseService>;
  let loggerSpy: jasmine.SpyObj<LoggingService>;

  beforeEach(() => {
    localStorage.removeItem('exam_history_sessions');

    supabaseSpy = jasmine.createSpyObj('SupabaseService', [
      'getExamHistory',
      'saveStudySession',
    ]);
    supabaseSpy.getExamHistory.and.returnValue(Promise.resolve([]));
    supabaseSpy.saveStudySession.and.returnValue(Promise.resolve(null));

    loggerSpy = jasmine.createSpyObj('LoggingService', ['error', 'warn', 'info', 'debug']);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        ExamHistoryService,
        { provide: SupabaseService, useValue: supabaseSpy },
        { provide: LoggingService, useValue: loggerSpy },
      ],
    });

    service = TestBed.inject(ExamHistoryService);
  });

  afterEach(() => {
    localStorage.removeItem('exam_history_sessions');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ---------------------------------------------------------------------------
  // startNewSession()
  // ---------------------------------------------------------------------------

  describe('startNewSession()', () => {
    it('should create a new session with a unique ID', () => {
      const sessionId = service.startNewSession('medium');

      expect(sessionId).toBeTruthy();
      expect(sessionId).toContain('session_');
    });

    it('should set the current session signal', () => {
      service.startNewSession('hard');

      const current = service.currentSession();
      expect(current).toBeTruthy();
      expect(current!.difficulty).toBe('hard');
      expect(current!.totalQuestions).toBe(0);
      expect(current!.correctAnswers).toBe(0);
      expect(current!.questions).toEqual([]);
    });

    it('should set the start time', () => {
      const before = new Date();
      service.startNewSession('easy');
      const after = new Date();

      const current = service.currentSession();
      expect(current!.startTime.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(current!.startTime.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should not have endTime set', () => {
      service.startNewSession('medium');
      expect(service.currentSession()!.endTime).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // addQuestionToHistory()
  // ---------------------------------------------------------------------------

  describe('addQuestionToHistory()', () => {
    it('should add a question to the current session', () => {
      service.startNewSession('medium');

      service.addQuestionToHistory(
        'What is 2+2?',
        { A: '1', B: '2', C: '3', D: '4' },
        'D',
        'D',
        true,
        'medium',
      );

      const current = service.currentSession()!;
      expect(current.questions.length).toBe(1);
      expect(current.totalQuestions).toBe(1);
      expect(current.correctAnswers).toBe(1);
    });

    it('should not increment correctAnswers for wrong answers', () => {
      service.startNewSession('medium');

      service.addQuestionToHistory(
        'What is 2+2?',
        { A: '1', B: '2', C: '3', D: '4' },
        'A',
        'D',
        false,
        'medium',
      );

      const current = service.currentSession()!;
      expect(current.totalQuestions).toBe(1);
      expect(current.correctAnswers).toBe(0);
    });

    it('should do nothing if no current session', () => {
      // No session started
      expect(() => {
        service.addQuestionToHistory(
          'Q?',
          { A: 'a', B: 'b', C: 'c', D: 'd' },
          'A',
          'B',
          false,
          'easy',
        );
      }).not.toThrow();
    });

    it('should assign incrementing questionNumber', () => {
      service.startNewSession('medium');
      const opts = { A: '1', B: '2', C: '3', D: '4' };

      service.addQuestionToHistory('Q1', opts, 'A', 'A', true, 'medium');
      service.addQuestionToHistory('Q2', opts, 'B', 'B', true, 'medium');
      service.addQuestionToHistory('Q3', opts, 'C', 'C', true, 'medium');

      const qs = service.currentSession()!.questions;
      expect(qs[0].questionNumber).toBe(1);
      expect(qs[1].questionNumber).toBe(2);
      expect(qs[2].questionNumber).toBe(3);
    });
  });

  // ---------------------------------------------------------------------------
  // endCurrentSession()
  // ---------------------------------------------------------------------------

  describe('endCurrentSession()', () => {
    it('should set endTime and calculate duration', () => {
      service.startNewSession('medium');
      const ended = service.endCurrentSession();

      expect(ended).toBeTruthy();
      expect(ended!.endTime).toBeTruthy();
      expect(ended!.endTime!.getTime()).toBeGreaterThanOrEqual(ended!.startTime.getTime());
    });

    it('should add the session to the sessions list', () => {
      service.startNewSession('medium');
      service.endCurrentSession();

      const sessions = service.sessions();
      expect(sessions.length).toBe(1);
    });

    it('should clear the current session', () => {
      service.startNewSession('medium');
      service.endCurrentSession();

      expect(service.currentSession()).toBeNull();
    });

    it('should return null when no current session', () => {
      const result = service.endCurrentSession();
      expect(result).toBeNull();
    });

    it('should preserve questions in ended session', () => {
      service.startNewSession('medium');
      service.addQuestionToHistory(
        'Q?',
        { A: 'a', B: 'b', C: 'c', D: 'd' },
        'A',
        'A',
        true,
        'medium',
      );
      const ended = service.endCurrentSession();

      expect(ended!.questions.length).toBe(1);
      expect(ended!.totalQuestions).toBe(1);
      expect(ended!.correctAnswers).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // sessions signal
  // ---------------------------------------------------------------------------

  describe('sessions signal', () => {
    it('should return all ended sessions', () => {
      service.startNewSession('easy');
      service.endCurrentSession();

      service.startNewSession('hard');
      service.endCurrentSession();

      const sessions = service.sessions();
      expect(sessions.length).toBe(2);
    });

    it('should be a readonly signal', () => {
      expect(service.sessions).toBeTruthy();
      expect(typeof service.sessions).toBe('function');
    });

    it('should return empty array initially', () => {
      expect(service.sessions()).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // getSessionHistory()
  // ---------------------------------------------------------------------------

  describe('getSessionHistory()', () => {
    it('should return a specific session by ID', () => {
      const sessionId = service.startNewSession('medium');
      service.endCurrentSession();

      const session = service.getSessionHistory(sessionId);
      expect(session).toBeTruthy();
      expect(session!.sessionId).toBe(sessionId);
    });

    it('should return null for non-existent session', () => {
      expect(service.getSessionHistory('nonexistent')).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // getAllSessions()
  // ---------------------------------------------------------------------------

  describe('getAllSessions()', () => {
    it('should return all sessions', () => {
      service.startNewSession('easy');
      service.endCurrentSession();
      service.startNewSession('hard');
      service.endCurrentSession();

      expect(service.getAllSessions().length).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // clearAllHistory()
  // ---------------------------------------------------------------------------

  describe('clearAllHistory()', () => {
    it('should empty sessions list', () => {
      service.startNewSession('easy');
      service.endCurrentSession();
      service.startNewSession('hard');
      service.endCurrentSession();

      service.clearAllHistory();

      expect(service.sessions()).toEqual([]);
      expect(service.currentSession()).toBeNull();
    });

    it('should remove from localStorage', () => {
      service.startNewSession('easy');
      service.endCurrentSession();

      service.clearAllHistory();

      expect(localStorage.getItem('exam_history_sessions')).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // getCurrentSessionStats()
  // ---------------------------------------------------------------------------

  describe('getCurrentSessionStats()', () => {
    it('should return null when no current session', () => {
      expect(service.getCurrentSessionStats()).toBeNull();
    });

    it('should return correct stats', () => {
      service.startNewSession('medium');
      const opts = { A: 'a', B: 'b', C: 'c', D: 'd' };
      service.addQuestionToHistory('Q1', opts, 'A', 'A', true, 'medium');
      service.addQuestionToHistory('Q2', opts, 'B', 'A', false, 'medium');
      service.addQuestionToHistory('Q3', opts, 'A', 'A', true, 'medium');

      const stats = service.getCurrentSessionStats()!;
      expect(stats.total).toBe(3);
      expect(stats.correct).toBe(2);
      expect(stats.percentage).toBe(67); // Math.round(2/3 * 100)
    });

    it('should return 0% when no questions answered', () => {
      service.startNewSession('medium');
      const stats = service.getCurrentSessionStats()!;
      expect(stats.total).toBe(0);
      expect(stats.correct).toBe(0);
      expect(stats.percentage).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // localStorage persistence
  // ---------------------------------------------------------------------------

  describe('localStorage persistence', () => {
    it('should save sessions to localStorage on end', () => {
      service.startNewSession('medium');
      service.endCurrentSession();

      const stored = localStorage.getItem('exam_history_sessions');
      expect(stored).toBeTruthy();
      const data = JSON.parse(stored!);
      expect(data.sessions.length).toBe(1);
    });

    it('should handle corrupt localStorage data gracefully', () => {
      localStorage.setItem('exam_history_sessions', 'not-json');

      expect(() => {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            provideZonelessChangeDetection(),
            ExamHistoryService,
            { provide: SupabaseService, useValue: supabaseSpy },
            { provide: LoggingService, useValue: loggerSpy },
          ],
        });
        TestBed.inject(ExamHistoryService);
      }).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // loadFromSupabase()
  // ---------------------------------------------------------------------------

  describe('loadFromSupabase()', () => {
    it('should do nothing when Supabase returns empty rows', async () => {
      supabaseSpy.getExamHistory.and.returnValue(Promise.resolve([]));

      await service.loadFromSupabase();

      expect(service.sessions()).toEqual([]);
    });

    it('should merge remote sessions that dont exist locally', async () => {
      const remoteRow = {
        examId: 'exam_remote_1',
        score: 80,
        weightedScore: null,
        passed: true,
        mode: 'standard' as any,
        domains: ['D1'],
        summary: {
          totalQuestions: 10,
          correct: 8,
          incorrect: 2,
          skipped: 0,
          flagged: 0,
          scorePercentage: 80,
          totalTimeSpent: 600,
          timeLimit: 5400,
        },
        domainScores: null,
        completedAt: '2026-06-15T10:00:00.000Z',
        durationSec: 600,
      };

      supabaseSpy.getExamHistory.and.returnValue(Promise.resolve([remoteRow]));

      await service.loadFromSupabase();

      const sessions = service.sessions();
      expect(sessions.length).toBe(1);
      expect(sessions[0].sessionId).toBe('exam_remote_1');
      expect(sessions[0].totalQuestions).toBe(10);
      expect(sessions[0].correctAnswers).toBe(8);
    });

    it('should skip remote sessions that already exist locally by ID', async () => {
      // Create a local session
      const sessionId = service.startNewSession('medium');
      service.endCurrentSession();

      // Mock remote session with the same ID
      const localSessions = service.sessions();
      const remoteRow = {
        examId: localSessions[0].sessionId,
        score: 80,
        weightedScore: null,
        passed: true,
        mode: 'standard' as any,
        domains: ['D1'],
        summary: {
          totalQuestions: 10,
          correct: 8,
          incorrect: 2,
          skipped: 0,
          flagged: 0,
          scorePercentage: 80,
          totalTimeSpent: 600,
          timeLimit: 5400,
        },
        domainScores: null,
        completedAt: '2026-06-15T10:00:00.000Z',
        durationSec: 600,
      };

      supabaseSpy.getExamHistory.and.returnValue(Promise.resolve([remoteRow]));

      await service.loadFromSupabase();

      // Should still be just 1 session (no duplicate)
      expect(service.sessions().length).toBe(1);
    });

    it('should handle Supabase error gracefully', async () => {
      supabaseSpy.getExamHistory.and.returnValue(Promise.reject(new Error('Network error')));

      // Should not throw
      await service.loadFromSupabase();

      expect(service.sessions()).toEqual([]);
    });

    it('should sort merged sessions by start time descending', async () => {
      const makeSummary = (total: number, correct: number) => ({
        totalQuestions: total,
        correct,
        incorrect: total - correct,
        skipped: 0,
        flagged: 0,
        scorePercentage: Math.round((correct / total) * 100),
        totalTimeSpent: 300,
        timeLimit: 5400,
      });

      const row1 = {
        examId: 'exam_old',
        score: 70,
        weightedScore: null,
        passed: true,
        mode: 'standard' as any,
        domains: [],
        summary: makeSummary(5, 3),
        domainScores: null,
        completedAt: '2026-01-01T10:00:00.000Z',
        durationSec: 300,
      };
      const row2 = {
        examId: 'exam_new',
        score: 90,
        weightedScore: null,
        passed: true,
        mode: 'standard' as any,
        domains: [],
        summary: makeSummary(10, 9),
        domainScores: null,
        completedAt: '2026-12-01T10:00:00.000Z',
        durationSec: 600,
      };

      supabaseSpy.getExamHistory.and.returnValue(Promise.resolve([row1, row2]));

      await service.loadFromSupabase();

      const sessions = service.sessions();
      expect(sessions.length).toBe(2);
      // Newer session should be first
      expect(sessions[0].sessionId).toBe('exam_new');
      expect(sessions[1].sessionId).toBe('exam_old');
    });

    it('should deduplicate by timestamp and score heuristic', async () => {
      // Create a local session with known endTime
      service.startNewSession('medium');
      const opts = { A: 'a', B: 'b', C: 'c', D: 'd' };
      service.addQuestionToHistory('Q1', opts, 'A', 'A', true, 'medium');
      service.addQuestionToHistory('Q2', opts, 'B', 'A', false, 'medium');
      const ended = service.endCurrentSession()!;

      // Remote row with matching timestamp and score
      const remoteRow = {
        examId: 'exam_remote_dup',
        score: 50,
        weightedScore: null,
        passed: false,
        mode: 'standard' as any,
        domains: [],
        summary: {
          totalQuestions: 2,
          correct: 1,
          incorrect: 1,
          skipped: 0,
          flagged: 0,
          scorePercentage: 50,
          totalTimeSpent: 60,
          timeLimit: 5400,
        },
        domainScores: null,
        completedAt: ended.endTime!.toISOString(),
        durationSec: 1,
      };

      supabaseSpy.getExamHistory.and.returnValue(Promise.resolve([remoteRow]));

      await service.loadFromSupabase();

      // Should not add a duplicate - should still be 1 session
      expect(service.sessions().length).toBe(1);
    });
  });
});
