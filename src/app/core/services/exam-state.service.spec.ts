import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ExamStateService } from './exam-state.service';
import { QuestionBankService } from './question-bank.service';
import { TimerService } from './timer.service';
import { ConfigService } from './config.service';
import { SupabaseService } from './supabase.service';
import { ExamParams, ExamQuestion, ExamResult, Question } from '../models';
import { of, throwError } from 'rxjs';

/**
 * Helper: crea una ExamQuestion de prueba.
 */
function makeExamQuestion(overrides: Partial<ExamQuestion> = {}): ExamQuestion {
  return {
    id: overrides.id ?? 'q-1',
    text: 'Sample question?',
    domainCode: 'D1',
    difficulty: 'medium',
    options: [
      { id: 'opt-a', text: 'A' },
      { id: 'opt-b', text: 'B' },
      { id: 'opt-c', text: 'C' },
      { id: 'opt-d', text: 'D' },
    ],
    correctOptionId: 'opt-a',
    explanation: 'A is correct',
    learningLevel: 1,
    contentType: 'exam',
    trackId: 'track-1',
    selectedOptionId: undefined,
    flagged: false,
    timeSpent: 0,
    ...overrides,
  };
}

describe('ExamStateService', () => {
  let service: ExamStateService;
  let questionBankSpy: jasmine.SpyObj<QuestionBankService>;
  let timerSpy: jasmine.SpyObj<TimerService>;
  let supabaseSpy: jasmine.SpyObj<SupabaseService>;

  const mockQuestions: ExamQuestion[] = [
    makeExamQuestion({ id: 'q1' }),
    makeExamQuestion({ id: 'q2' }),
    makeExamQuestion({ id: 'q3' }),
  ];

  const mockGetQuestionsResult = {
    examId: 'exam-123',
    questions: mockQuestions,
    durationSec: 3600,
  };

  beforeEach(() => {
    questionBankSpy = jasmine.createSpyObj('QuestionBankService', ['getQuestions', 'validate']);
    timerSpy = jasmine.createSpyObj('TimerService', [
      'start', 'pause', 'resume', 'stop', 'addTime', 'formatTime', 'getState'
    ], {
      isRunning: jasmine.createSpy().and.returnValue(false),
      isPaused: jasmine.createSpy().and.returnValue(false),
      remainingSeconds: jasmine.createSpy().and.returnValue(0),
      totalSeconds: jasmine.createSpy().and.returnValue(0),
      remainingTime$: of(0),
    });
    timerSpy.getState.and.returnValue({
      isRunning: false,
      isPaused: false,
      remainingSeconds: 0,
      totalSeconds: 0,
      formattedTime: '00:00',
      progressPercentage: 0,
    });

    supabaseSpy = jasmine.createSpyObj('SupabaseService', ['saveExamResult']);
    supabaseSpy.saveExamResult.and.returnValue(Promise.resolve(null));

    questionBankSpy.getQuestions.and.returnValue(of(mockGetQuestionsResult));

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        ExamStateService,
        { provide: QuestionBankService, useValue: questionBankSpy },
        { provide: TimerService, useValue: timerSpy },
        { provide: SupabaseService, useValue: supabaseSpy },
      ],
    });

    service = TestBed.inject(ExamStateService);
  });

  afterEach(() => {
    service.resetExam();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with idle status', () => {
    expect(service.status()).toBe('idle');
  });

  // -------------------------------------------------------------------------
  // startExam()
  // -------------------------------------------------------------------------

  describe('startExam()', () => {
    const params: ExamParams = {
      mode: 'standard',
      domains: ['D1'],
      count: 3,
      difficulty: 'any',
    };

    it('should set status to running after starting', () => {
      service.startExam(params).subscribe();
      expect(service.status()).toBe('running');
    });

    it('should populate questions from QuestionBankService', () => {
      service.startExam(params).subscribe();
      expect(service.questions().length).toBe(3);
    });

    it('should set the exam ID', () => {
      service.startExam(params).subscribe();
      expect(service.examId()).toBe('exam-123');
    });

    it('should set currentIndex to 0', () => {
      service.startExam(params).subscribe();
      expect(service.currentIndex()).toBe(0);
    });

    it('should set examParams', () => {
      service.startExam(params).subscribe();
      expect(service.examParams()).toEqual(params);
    });

    it('should start the timer with the correct duration', () => {
      service.startExam(params).subscribe();
      expect(timerSpy.start).toHaveBeenCalledWith(3600, jasmine.any(Function), jasmine.any(Function));
    });

    it('should set isLoading to false after success', () => {
      service.startExam(params).subscribe();
      expect(service.isLoading()).toBeFalse();
    });

    it('should set error on failure', () => {
      questionBankSpy.getQuestions.and.returnValue(throwError(() => new Error('Network error')));

      service.startExam(params).subscribe({
        error: () => { /* expected */ },
      });

      expect(service.error()).toBe('Error al iniciar el examen');
      expect(service.isLoading()).toBeFalse();
    });
  });

  // -------------------------------------------------------------------------
  // selectOption()
  // -------------------------------------------------------------------------

  describe('selectOption()', () => {
    beforeEach(() => {
      const params: ExamParams = { mode: 'standard', domains: [], count: 3, difficulty: 'any' };
      service.startExam(params).subscribe();
    });

    it('should update the selectedOptionId of the current question', () => {
      service.selectOption('opt-b');
      expect(service.questions()[0].selectedOptionId).toBe('opt-b');
    });

    it('should not affect other questions', () => {
      service.selectOption('opt-c');
      expect(service.questions()[1].selectedOptionId).toBeUndefined();
      expect(service.questions()[2].selectedOptionId).toBeUndefined();
    });

    it('should overwrite a previously selected option', () => {
      service.selectOption('opt-a');
      expect(service.questions()[0].selectedOptionId).toBe('opt-a');

      service.selectOption('opt-d');
      expect(service.questions()[0].selectedOptionId).toBe('opt-d');
    });
  });

  // -------------------------------------------------------------------------
  // toggleFlag()
  // -------------------------------------------------------------------------

  describe('toggleFlag()', () => {
    beforeEach(() => {
      const params: ExamParams = { mode: 'standard', domains: [], count: 3, difficulty: 'any' };
      service.startExam(params).subscribe();
    });

    it('should mark the current question as flagged', () => {
      service.toggleFlag();
      expect(service.questions()[0].flagged).toBeTrue();
    });

    it('should unflag a flagged question', () => {
      service.toggleFlag(); // flag
      expect(service.questions()[0].flagged).toBeTrue();

      service.toggleFlag(); // unflag
      expect(service.questions()[0].flagged).toBeFalse();
    });

    it('should not affect other questions', () => {
      service.toggleFlag();
      expect(service.questions()[1].flagged).toBeFalse();
    });
  });

  // -------------------------------------------------------------------------
  // next() / previous()
  // -------------------------------------------------------------------------

  describe('next()', () => {
    beforeEach(() => {
      const params: ExamParams = { mode: 'standard', domains: [], count: 3, difficulty: 'any' };
      service.startExam(params).subscribe();
    });

    it('should increment currentIndex', () => {
      expect(service.currentIndex()).toBe(0);
      service.next();
      expect(service.currentIndex()).toBe(1);
    });

    it('should not go past the last question', () => {
      service.next(); // 0 -> 1
      service.next(); // 1 -> 2
      service.next(); // 2 -> should stay at 2 (last)
      expect(service.currentIndex()).toBe(2);
    });
  });

  describe('previous()', () => {
    beforeEach(() => {
      const params: ExamParams = { mode: 'standard', domains: [], count: 3, difficulty: 'any' };
      service.startExam(params).subscribe();
    });

    it('should decrement currentIndex', () => {
      service.next(); // go to 1
      service.previous();
      expect(service.currentIndex()).toBe(0);
    });

    it('should not go below 0', () => {
      service.previous();
      expect(service.currentIndex()).toBe(0);
    });
  });

  describe('goToQuestion()', () => {
    beforeEach(() => {
      const params: ExamParams = { mode: 'standard', domains: [], count: 3, difficulty: 'any' };
      service.startExam(params).subscribe();
    });

    it('should navigate to a specific index', () => {
      service.goToQuestion(2);
      expect(service.currentIndex()).toBe(2);
    });

    it('should ignore invalid indices (negative)', () => {
      service.goToQuestion(-1);
      expect(service.currentIndex()).toBe(0);
    });

    it('should ignore invalid indices (too large)', () => {
      service.goToQuestion(99);
      expect(service.currentIndex()).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Computed signals
  // -------------------------------------------------------------------------

  describe('currentQuestion (computed)', () => {
    beforeEach(() => {
      const params: ExamParams = { mode: 'standard', domains: [], count: 3, difficulty: 'any' };
      service.startExam(params).subscribe();
    });

    it('should return the question at the current index', () => {
      const cq = service.currentQuestion();
      expect(cq).toBeTruthy();
      expect(cq!.id).toBe('q1');
    });

    it('should update when navigating', () => {
      service.next();
      expect(service.currentQuestion()!.id).toBe('q2');
    });

    it('should return null when no questions are loaded', () => {
      service.resetExam();
      expect(service.currentQuestion()).toBeNull();
    });
  });

  describe('progress (computed)', () => {
    beforeEach(() => {
      const params: ExamParams = { mode: 'standard', domains: [], count: 3, difficulty: 'any' };
      service.startExam(params).subscribe();
    });

    it('should start with 0 answered, 0 flagged', () => {
      const p = service.progress();
      expect(p.answered).toBe(0);
      expect(p.flagged).toBe(0);
      expect(p.total).toBe(3);
      expect(p.percentage).toBe(0);
    });

    it('should update answered count when an option is selected', () => {
      service.selectOption('opt-a');
      const p = service.progress();
      expect(p.answered).toBe(1);
      expect(p.percentage).toBe(33); // 1/3 rounded
    });

    it('should update flagged count when a question is toggled', () => {
      service.toggleFlag();
      expect(service.progress().flagged).toBe(1);
    });
  });

  describe('navigation (computed)', () => {
    beforeEach(() => {
      const params: ExamParams = { mode: 'standard', domains: [], count: 3, difficulty: 'any' };
      service.startExam(params).subscribe();
    });

    it('should report first question correctly', () => {
      const nav = service.navigation();
      expect(nav.isFirst).toBeTrue();
      expect(nav.isLast).toBeFalse();
      expect(nav.canGoPrevious).toBeFalse();
      expect(nav.canGoNext).toBeTrue();
      expect(nav.current).toBe(1);
      expect(nav.total).toBe(3);
    });

    it('should report middle question correctly', () => {
      service.next();
      const nav = service.navigation();
      expect(nav.isFirst).toBeFalse();
      expect(nav.isLast).toBeFalse();
      expect(nav.canGoPrevious).toBeTrue();
      expect(nav.canGoNext).toBeTrue();
      expect(nav.current).toBe(2);
    });

    it('should report last question correctly', () => {
      service.next();
      service.next();
      const nav = service.navigation();
      expect(nav.isFirst).toBeFalse();
      expect(nav.isLast).toBeTrue();
      expect(nav.canGoPrevious).toBeTrue();
      expect(nav.canGoNext).toBeFalse();
      expect(nav.current).toBe(3);
    });
  });

  // -------------------------------------------------------------------------
  // submitExam()
  // -------------------------------------------------------------------------

  describe('submitExam()', () => {
    const mockResult: ExamResult = {
      examId: 'exam-123',
      score: 80,
      summary: { correct: 2, incorrect: 1, skipped: 0, flagged: 0, scorePercentage: 67, totalTimeSpent: 120, timeLimit: 3600 },
      items: [],
      recommendations: [],
      completedAt: new Date(),
      domains: ['D1'],
      averageDifficulty: 'medium',
    };

    beforeEach(() => {
      const params: ExamParams = { mode: 'standard', domains: [], count: 3, difficulty: 'any' };
      service.startExam(params).subscribe();
      questionBankSpy.validate.and.returnValue(of(mockResult));
    });

    it('should change status to completed after submission', () => {
      service.submitExam().subscribe();
      expect(service.status()).toBe('completed');
    });

    it('should stop the timer', () => {
      service.submitExam().subscribe();
      expect(timerSpy.stop).toHaveBeenCalled();
    });

    it('should set the exam result', () => {
      service.submitExam().subscribe();
      expect(service.examResult()).toEqual(mockResult);
    });

    it('should call questionBank.validate with the correct payload', () => {
      service.selectOption('opt-b');
      service.submitExam().subscribe();

      const payload = questionBankSpy.validate.calls.mostRecent().args[0];
      expect(payload.examId).toBe('exam-123');
      expect(payload.answers.length).toBe(3);
      expect(payload.answers[0].optionId).toBe('opt-b');
    });

    it('should throw if exam is not running or paused', () => {
      service.resetExam();
      expect(() => service.submitExam()).toThrowError('No hay un examen activo para enviar');
    });

    it('should revert to running on validation error', () => {
      questionBankSpy.validate.and.returnValue(throwError(() => new Error('Validation failed')));

      service.submitExam().subscribe({
        error: () => { /* expected */ },
      });

      expect(service.status()).toBe('running');
      expect(service.error()).toBe('Error al enviar el examen');
    });
  });

  // -------------------------------------------------------------------------
  // pauseExam() / resumeExam()
  // -------------------------------------------------------------------------

  describe('pauseExam()', () => {
    it('should pause a running exam', () => {
      const params: ExamParams = { mode: 'standard', domains: [], count: 3, difficulty: 'any' };
      service.startExam(params).subscribe();

      service.pauseExam();
      expect(service.status()).toBe('paused');
      expect(timerSpy.pause).toHaveBeenCalled();
    });

    it('should not pause if not running', () => {
      service.pauseExam();
      expect(service.status()).toBe('idle');
    });
  });

  describe('resumeExam()', () => {
    it('should resume a paused exam', () => {
      const params: ExamParams = { mode: 'standard', domains: [], count: 3, difficulty: 'any' };
      service.startExam(params).subscribe();
      service.pauseExam();

      service.resumeExam();
      expect(service.status()).toBe('running');
      expect(timerSpy.resume).toHaveBeenCalled();
    });

    it('should not resume if not paused', () => {
      const params: ExamParams = { mode: 'standard', domains: [], count: 3, difficulty: 'any' };
      service.startExam(params).subscribe();

      service.resumeExam();
      expect(service.status()).toBe('running');
      expect(timerSpy.resume).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // resetExam()
  // -------------------------------------------------------------------------

  describe('resetExam()', () => {
    it('should reset all state to defaults', () => {
      const params: ExamParams = { mode: 'standard', domains: [], count: 3, difficulty: 'any' };
      service.startExam(params).subscribe();

      service.resetExam();

      expect(service.status()).toBe('idle');
      expect(service.examId()).toBe('');
      expect(service.questions().length).toBe(0);
      expect(service.currentIndex()).toBe(0);
      expect(service.examParams()).toBeNull();
      expect(service.examResult()).toBeNull();
      expect(service.error()).toBeNull();
      expect(timerSpy.stop).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // getState()
  // -------------------------------------------------------------------------

  describe('getState()', () => {
    it('should return the full state snapshot', () => {
      const params: ExamParams = { mode: 'standard', domains: [], count: 3, difficulty: 'any' };
      service.startExam(params).subscribe();

      const state = service.getState();
      expect(state.status).toBe('running');
      expect(state.examId).toBe('exam-123');
      expect(state.questions.length).toBe(3);
      expect(state.currentIndex).toBe(0);
      expect(state.progress).toBeTruthy();
      expect(state.navigation).toBeTruthy();
      expect(state.timer).toBeTruthy();
    });
  });
});
