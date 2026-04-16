import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { QuestionBankService } from './question-bank.service';
import { QuestionLoaderService } from './question-loader.service';
import { SupabaseService } from './supabase.service';
import { Question, ExamParams, ExamPayload, Catalog } from '../models';
import { of, firstValueFrom } from 'rxjs';

/**
 * Helper: crea una pregunta de prueba con valores por defecto.
 */
function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: overrides.id ?? 'q-1',
    text: overrides.text ?? 'Sample question?',
    domainCode: overrides.domainCode ?? 'D1',
    difficulty: overrides.difficulty ?? 'medium',
    options: overrides.options ?? [
      { id: 'opt-a', text: 'Option A' },
      { id: 'opt-b', text: 'Option B' },
      { id: 'opt-c', text: 'Option C' },
      { id: 'opt-d', text: 'Option D' },
    ],
    correctOptionId: overrides.correctOptionId ?? 'opt-a',
    explanation: overrides.explanation ?? 'Because A is correct.',
    learningLevel: overrides.learningLevel ?? 1,
    contentType: overrides.contentType ?? 'exam',
    trackId: overrides.trackId ?? 'track-1',
    ...overrides,
  };
}

/**
 * Helper: crea un catalogo minimo para tests CCA-F.
 */
function makeCatalog(overrides: Partial<Catalog> = {}): Catalog {
  return {
    version: '1.0',
    lastUpdated: '2026-01-01',
    levels: [],
    tracks: [],
    ccafConfig: {
      totalQuestions: 10,
      durationSec: 7200,
      passingScore: 720,
      maxScore: 1000,
      scenarioCount: 0,
      scenarioPool: [],
      domains: [
        {
          code: 'D1',
          name: 'Domain 1',
          weight: 0.6,
          questionBankFile: 'ccaf/d1.json',
          description: '',
          totalQuestions: 20,
        },
        {
          code: 'D2',
          name: 'Domain 2',
          weight: 0.4,
          questionBankFile: 'ccaf/d2.json',
          description: '',
          totalQuestions: 20,
        },
      ],
    },
    ...overrides,
  };
}

describe('QuestionBankService', () => {
  let service: QuestionBankService;
  let loaderSpy: jasmine.SpyObj<QuestionLoaderService>;
  let supabaseSpy: jasmine.SpyObj<SupabaseService>;

  beforeEach(() => {
    loaderSpy = jasmine.createSpyObj('QuestionLoaderService', [
      'loadQuestionFile',
      'loadCatalog',
      'loadFromMultiplePaths',
    ]);

    supabaseSpy = jasmine.createSpyObj('SupabaseService', ['validateExamAnswers']);
    // Default: server validation returns null so tests fall back to client-side
    supabaseSpy.validateExamAnswers.and.returnValue(Promise.resolve(null));

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        QuestionBankService,
        { provide: QuestionLoaderService, useValue: loaderSpy },
        { provide: SupabaseService, useValue: supabaseSpy },
      ],
    });

    service = TestBed.inject(QuestionBankService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  // getQuestions() — standard mode
  // -------------------------------------------------------------------------

  describe('getQuestions() — standard mode', () => {
    it('should load questions from the default JSON file when no trackId given', () => {
      const params: ExamParams = {
        mode: 'standard',
        domains: [],
        count: 2,
        difficulty: 'any',
      };

      const mockQuestions: Question[] = [
        makeQuestion({ id: 'q1' }),
        makeQuestion({ id: 'q2' }),
        makeQuestion({ id: 'q3' }),
      ];

      loaderSpy.loadQuestionFile.and.returnValue(of(mockQuestions));

      let result: any;
      service.getQuestions(params).subscribe((r) => (result = r));

      expect(loaderSpy.loadQuestionFile).toHaveBeenCalledWith(
        'assets/question-bank/academy/foundation/claude-101.json',
      );
      expect(result).toBeTruthy();
      expect(result.examId).toBeTruthy();
      expect(result.questions.length).toBe(2);
      expect(result.durationSec).toBe(5400); // default when no durationSec in params
    });

    it('should respect the count parameter', () => {
      const params: ExamParams = {
        mode: 'standard',
        domains: [],
        count: 1,
        difficulty: 'any',
      };

      loaderSpy.loadQuestionFile.and.returnValue(
        of([makeQuestion({ id: 'q1' }), makeQuestion({ id: 'q2' }), makeQuestion({ id: 'q3' })]),
      );

      let result: any;
      service.getQuestions(params).subscribe((r) => (result = r));

      expect(result.questions.length).toBe(1);
    });

    it('should use the provided durationSec', () => {
      const params: ExamParams = {
        mode: 'standard',
        domains: [],
        count: 1,
        difficulty: 'any',
        durationSec: 1800,
      };

      loaderSpy.loadQuestionFile.and.returnValue(of([makeQuestion()]));

      let result: any;
      service.getQuestions(params).subscribe((r) => (result = r));

      expect(result.durationSec).toBe(1800);
    });

    it('should set selectedOptionId, flagged, and timeSpent on ExamQuestions', () => {
      const params: ExamParams = {
        mode: 'standard',
        domains: [],
        count: 1,
        difficulty: 'any',
      };

      loaderSpy.loadQuestionFile.and.returnValue(of([makeQuestion()]));

      let result: any;
      service.getQuestions(params).subscribe((r) => (result = r));

      const eq = result.questions[0];
      expect(eq.selectedOptionId).toBeUndefined();
      expect(eq.flagged).toBeFalse();
      expect(eq.timeSpent).toBe(0);
    });

    it('should strip correctOptionId from ExamQuestions to prevent cheating', () => {
      const params: ExamParams = {
        mode: 'standard',
        domains: [],
        count: 1,
        difficulty: 'any',
      };

      loaderSpy.loadQuestionFile.and.returnValue(
        of([makeQuestion({ id: 'q1', correctOptionId: 'opt-a' })]),
      );

      let result: any;
      service.getQuestions(params).subscribe((r) => (result = r));

      const eq = result.questions[0];
      expect(eq.correctOptionId).toBeUndefined();
    });

    it('should filter questions by difficulty when specified', () => {
      const params: ExamParams = {
        mode: 'standard',
        domains: [],
        count: 10,
        difficulty: 'hard',
      };

      loaderSpy.loadQuestionFile.and.returnValue(
        of([
          makeQuestion({ id: 'q1', difficulty: 'easy' }),
          makeQuestion({ id: 'q2', difficulty: 'hard' }),
          makeQuestion({ id: 'q3', difficulty: 'medium' }),
          makeQuestion({ id: 'q4', difficulty: 'hard' }),
        ]),
      );

      let result: any;
      service.getQuestions(params).subscribe((r) => (result = r));

      // Only hard questions should be returned
      expect(result.questions.length).toBe(2);
      result.questions.forEach((q: any) => {
        expect(q.difficulty).toBe('hard');
      });
    });

    it('should filter by domain codes when specified', () => {
      const params: ExamParams = {
        mode: 'standard',
        domains: ['D2'],
        count: 10,
        difficulty: 'any',
      };

      loaderSpy.loadQuestionFile.and.returnValue(
        of([
          makeQuestion({ id: 'q1', domainCode: 'D1' }),
          makeQuestion({ id: 'q2', domainCode: 'D2' }),
          makeQuestion({ id: 'q3', domainCode: 'D2' }),
        ]),
      );

      let result: any;
      service.getQuestions(params).subscribe((r) => (result = r));

      expect(result.questions.length).toBe(2);
      result.questions.forEach((q: any) => {
        expect(q.domainCode).toBe('D2');
      });
    });
  });

  // -------------------------------------------------------------------------
  // validate()
  // -------------------------------------------------------------------------

  describe('validate()', () => {
    it('should compare optionId against correctOptionId and return isCorrect', async () => {
      // First, load questions so questionsById map is populated
      const params: ExamParams = { mode: 'standard', domains: [], count: 2, difficulty: 'any' };
      const questions = [
        makeQuestion({ id: 'q1', correctOptionId: 'opt-a' }),
        makeQuestion({ id: 'q2', correctOptionId: 'opt-c' }),
      ];

      loaderSpy.loadQuestionFile.and.returnValue(of(questions));
      service.getQuestions(params).subscribe();

      // Now validate
      const payload: ExamPayload = {
        examId: 'test-exam',
        answers: [
          { questionId: 'q1', optionId: 'opt-a' }, // correct
          { questionId: 'q2', optionId: 'opt-b' }, // incorrect
        ],
        totalTimeSpent: 120,
      };

      const result = await firstValueFrom(service.validate(payload));

      expect(result).toBeTruthy();
      expect(result.items[0].isCorrect).toBeTrue();
      expect(result.items[1].isCorrect).toBeFalse();
      expect(result.summary.correct).toBe(1);
      expect(result.summary.incorrect).toBe(1);
      expect(result.score).toBe(50);
    });

    it('should count skipped questions (empty optionId)', async () => {
      const params: ExamParams = { mode: 'standard', domains: [], count: 1, difficulty: 'any' };
      loaderSpy.loadQuestionFile.and.returnValue(
        of([makeQuestion({ id: 'q1', correctOptionId: 'opt-a' })]),
      );
      service.getQuestions(params).subscribe();

      const payload: ExamPayload = {
        examId: 'test',
        answers: [
          { questionId: 'q1', optionId: '' }, // skipped
        ],
      };

      const result = await firstValueFrom(service.validate(payload));

      expect(result.summary.skipped).toBe(1);
      expect(result.summary.correct).toBe(0);
    });

    it('should count flagged questions', async () => {
      const params: ExamParams = { mode: 'standard', domains: [], count: 1, difficulty: 'any' };
      loaderSpy.loadQuestionFile.and.returnValue(of([makeQuestion({ id: 'q1' })]));
      service.getQuestions(params).subscribe();

      const payload: ExamPayload = {
        examId: 'test',
        answers: [{ questionId: 'q1', optionId: 'opt-a', flagged: true }],
      };

      const result = await firstValueFrom(service.validate(payload));

      expect(result.summary.flagged).toBe(1);
    });

    it('should include explanation and domainCode from the original question', async () => {
      const params: ExamParams = { mode: 'standard', domains: [], count: 1, difficulty: 'any' };
      const q = makeQuestion({
        id: 'q1',
        explanation: 'Custom explanation',
        domainCode: 'D-CUSTOM',
      });
      loaderSpy.loadQuestionFile.and.returnValue(of([q]));
      service.getQuestions(params).subscribe();

      const payload: ExamPayload = {
        examId: 'test',
        answers: [{ questionId: 'q1', optionId: 'opt-a' }],
      };

      const result = await firstValueFrom(service.validate(payload));

      expect(result.items[0].explanation).toBe('Custom explanation');
      expect(result.items[0].domainCode).toBe('D-CUSTOM');
    });

    it('should generate recommendations for weak domains', async () => {
      const params: ExamParams = { mode: 'standard', domains: [], count: 4, difficulty: 'any' };
      const questions = [
        makeQuestion({ id: 'q1', domainCode: 'WEAK', correctOptionId: 'opt-a' }),
        makeQuestion({ id: 'q2', domainCode: 'WEAK', correctOptionId: 'opt-a' }),
        makeQuestion({ id: 'q3', domainCode: 'STRONG', correctOptionId: 'opt-a' }),
        makeQuestion({ id: 'q4', domainCode: 'STRONG', correctOptionId: 'opt-a' }),
      ];
      loaderSpy.loadQuestionFile.and.returnValue(of(questions));
      service.getQuestions(params).subscribe();

      const payload: ExamPayload = {
        examId: 'test',
        answers: [
          { questionId: 'q1', optionId: 'opt-z' }, // wrong
          { questionId: 'q2', optionId: 'opt-z' }, // wrong
          { questionId: 'q3', optionId: 'opt-a' }, // correct
          { questionId: 'q4', optionId: 'opt-a' }, // correct
        ],
      };

      const result = await firstValueFrom(service.validate(payload));

      const weakRec = result.recommendations.find((r: string) => r.includes('WEAK'));
      expect(weakRec).toBeTruthy();
    });

    it('should return good performance message when all domains >= 70%', async () => {
      const params: ExamParams = { mode: 'standard', domains: [], count: 2, difficulty: 'any' };
      const questions = [
        makeQuestion({ id: 'q1', domainCode: 'D1', correctOptionId: 'opt-a' }),
        makeQuestion({ id: 'q2', domainCode: 'D1', correctOptionId: 'opt-a' }),
      ];
      loaderSpy.loadQuestionFile.and.returnValue(of(questions));
      service.getQuestions(params).subscribe();

      const payload: ExamPayload = {
        examId: 'test',
        answers: [
          { questionId: 'q1', optionId: 'opt-a' }, // correct
          { questionId: 'q2', optionId: 'opt-a' }, // correct
        ],
      };

      const result = await firstValueFrom(service.validate(payload));

      expect(result.recommendations[0]).toContain('Buen rendimiento');
    });
  });

  // -------------------------------------------------------------------------
  // shuffle — distribution test
  // -------------------------------------------------------------------------

  describe('shuffle', () => {
    it('should return the same set of question IDs (shuffled but complete)', () => {
      const params: ExamParams = { mode: 'standard', domains: [], count: 5, difficulty: 'any' };
      const questions = Array.from({ length: 5 }, (_, i) => makeQuestion({ id: `q${i}` }));

      loaderSpy.loadQuestionFile.and.returnValue(of(questions));

      let result: any;
      service.getQuestions(params).subscribe((r) => (result = r));

      const returnedIds = result.questions.map((q: any) => q.id).sort();
      const sourceIds = questions.map((q) => q.id).sort();
      expect(returnedIds).toEqual(sourceIds);
    });
  });

  // -------------------------------------------------------------------------
  // Cache — loader is called once, second call uses cache
  // -------------------------------------------------------------------------

  describe('cache via QuestionLoaderService', () => {
    it('should call loader.loadQuestionFile for loading', () => {
      const params: ExamParams = { mode: 'standard', domains: [], count: 1, difficulty: 'any' };
      loaderSpy.loadQuestionFile.and.returnValue(of([makeQuestion({ id: 'q1' })]));

      service.getQuestions(params).subscribe();

      expect(loaderSpy.loadQuestionFile).toHaveBeenCalledTimes(1);
      expect(loaderSpy.loadQuestionFile).toHaveBeenCalledWith(
        'assets/question-bank/academy/foundation/claude-101.json',
      );
    });
  });

  // -------------------------------------------------------------------------
  // getCCAFExamQuestions()
  // -------------------------------------------------------------------------

  describe('getCCAFExamQuestions()', () => {
    it('should load catalog then load questions for each domain with weighted selection', () => {
      const params: ExamParams = {
        mode: 'ccaf',
        domains: [],
        count: 10,
        difficulty: 'any',
      };

      const catalog = makeCatalog();
      const d1Questions = Array.from({ length: 20 }, (_, i) =>
        makeQuestion({ id: `d1-q${i}`, domainCode: 'D1' }),
      );
      const d2Questions = Array.from({ length: 20 }, (_, i) =>
        makeQuestion({ id: `d2-q${i}`, domainCode: 'D2' }),
      );

      loaderSpy.loadCatalog.and.returnValue(of(catalog));
      loaderSpy.loadQuestionFile.and.callFake((path: string) => {
        if (path.includes('d1.json')) return of(d1Questions);
        if (path.includes('d2.json')) return of(d2Questions);
        return of([]);
      });

      let result: any;
      service.getQuestions(params).subscribe((r) => (result = r));

      expect(result).toBeTruthy();
      expect(result.examId).toBeTruthy();
      expect(result.durationSec).toBe(7200);
      expect(result.questions.length).toBeLessThanOrEqual(10);
      expect(result.questions.length).toBeGreaterThan(0);
    });

    it('should distribute questions proportionally by domain weight', () => {
      const params: ExamParams = {
        mode: 'ccaf',
        domains: [],
        count: 100,
        difficulty: 'any',
      };

      const catalog = makeCatalog({
        ccafConfig: {
          totalQuestions: 100,
          durationSec: 7200,
          passingScore: 720,
          maxScore: 1000,
          scenarioCount: 0,
          scenarioPool: [],
          domains: [
            {
              code: 'D1',
              name: 'Domain 1',
              weight: 0.7,
              questionBankFile: 'ccaf/d1.json',
              description: '',
              totalQuestions: 100,
            },
            {
              code: 'D2',
              name: 'Domain 2',
              weight: 0.3,
              questionBankFile: 'ccaf/d2.json',
              description: '',
              totalQuestions: 100,
            },
          ],
        },
      });

      const d1Questions = Array.from({ length: 100 }, (_, i) =>
        makeQuestion({ id: `d1-q${i}`, domainCode: 'D1' }),
      );
      const d2Questions = Array.from({ length: 100 }, (_, i) =>
        makeQuestion({ id: `d2-q${i}`, domainCode: 'D2' }),
      );

      loaderSpy.loadCatalog.and.returnValue(of(catalog));
      loaderSpy.loadQuestionFile.and.callFake((path: string) => {
        if (path.includes('d1.json')) return of(d1Questions);
        if (path.includes('d2.json')) return of(d2Questions);
        return of([]);
      });

      let result: any;
      service.getQuestions(params).subscribe((r) => (result = r));

      // D1 should have ~70 questions, D2 ~30
      const d1Count = result.questions.filter((q: any) => q.domainCode === 'D1').length;
      const d2Count = result.questions.filter((q: any) => q.domainCode === 'D2').length;

      expect(d1Count).toBe(70);
      expect(d2Count).toBe(30);
      expect(result.questions.length).toBe(100);
    });

    it('should use custom durationSec when provided in params', () => {
      const params: ExamParams = {
        mode: 'ccaf',
        domains: [],
        count: 10,
        difficulty: 'any',
        durationSec: 3600,
      };

      const catalog = makeCatalog();
      loaderSpy.loadCatalog.and.returnValue(of(catalog));
      loaderSpy.loadQuestionFile.and.returnValue(
        of(Array.from({ length: 20 }, (_, i) => makeQuestion({ id: `q${i}` }))),
      );

      let result: any;
      service.getQuestions(params).subscribe((r) => (result = r));

      expect(result.durationSec).toBe(3600);
    });

    it('should handle empty question bank for a domain gracefully', () => {
      const params: ExamParams = {
        mode: 'ccaf',
        domains: [],
        count: 10,
        difficulty: 'any',
      };

      const catalog = makeCatalog();
      loaderSpy.loadCatalog.and.returnValue(of(catalog));
      // D1 has questions, D2 is empty
      loaderSpy.loadQuestionFile.and.callFake((path: string) => {
        if (path.includes('d1.json'))
          return of(
            Array.from({ length: 10 }, (_, i) =>
              makeQuestion({ id: `d1-q${i}`, domainCode: 'D1' }),
            ),
          );
        return of([]);
      });

      let result: any;
      service.getQuestions(params).subscribe((r) => (result = r));

      expect(result).toBeTruthy();
      expect(result.questions.length).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // Additional edge-case tests for branch coverage
  // -------------------------------------------------------------------------

  describe('getQuestions() — additional edge cases', () => {
    it('should filter by difficulty and return fewer questions than count', () => {
      const params: ExamParams = {
        mode: 'standard',
        domains: [],
        count: 50,
        difficulty: 'easy',
      };

      loaderSpy.loadQuestionFile.and.returnValue(
        of([
          makeQuestion({ id: 'q1', difficulty: 'easy' }),
          makeQuestion({ id: 'q2', difficulty: 'hard' }),
          makeQuestion({ id: 'q3', difficulty: 'medium' }),
        ]),
      );

      let result: any;
      service.getQuestions(params).subscribe((r) => (result = r));

      expect(result.questions.length).toBe(1);
      expect(result.questions[0].difficulty).toBe('easy');
    });

    it('should filter by multiple domain codes', () => {
      const params: ExamParams = {
        mode: 'standard',
        domains: ['D1', 'D3'],
        count: 10,
        difficulty: 'any',
      };

      loaderSpy.loadQuestionFile.and.returnValue(
        of([
          makeQuestion({ id: 'q1', domainCode: 'D1' }),
          makeQuestion({ id: 'q2', domainCode: 'D2' }),
          makeQuestion({ id: 'q3', domainCode: 'D3' }),
          makeQuestion({ id: 'q4', domainCode: 'D4' }),
        ]),
      );

      let result: any;
      service.getQuestions(params).subscribe((r) => (result = r));

      expect(result.questions.length).toBe(2);
      result.questions.forEach((q: any) => {
        expect(['D1', 'D3']).toContain(q.domainCode);
      });
    });

    it('should return empty questions when all are filtered out', () => {
      const params: ExamParams = {
        mode: 'standard',
        domains: ['NONEXISTENT'],
        count: 10,
        difficulty: 'any',
      };

      loaderSpy.loadQuestionFile.and.returnValue(
        of([makeQuestion({ id: 'q1', domainCode: 'D1' })]),
      );

      let result: any;
      service.getQuestions(params).subscribe((r) => (result = r));

      expect(result.questions.length).toBe(0);
    });

    it('should handle combined difficulty and domain filters', () => {
      const params: ExamParams = {
        mode: 'standard',
        domains: ['D1'],
        count: 10,
        difficulty: 'hard',
      };

      loaderSpy.loadQuestionFile.and.returnValue(
        of([
          makeQuestion({ id: 'q1', domainCode: 'D1', difficulty: 'easy' }),
          makeQuestion({ id: 'q2', domainCode: 'D1', difficulty: 'hard' }),
          makeQuestion({ id: 'q3', domainCode: 'D2', difficulty: 'hard' }),
          makeQuestion({ id: 'q4', domainCode: 'D1', difficulty: 'hard' }),
        ]),
      );

      let result: any;
      service.getQuestions(params).subscribe((r) => (result = r));

      expect(result.questions.length).toBe(2);
      result.questions.forEach((q: any) => {
        expect(q.domainCode).toBe('D1');
        expect(q.difficulty).toBe('hard');
      });
    });
  });

  // -------------------------------------------------------------------------
  // validate() — additional edge cases
  // -------------------------------------------------------------------------

  describe('validate() — additional edge cases', () => {
    it('should handle all skipped answers (no answers provided)', async () => {
      const params: ExamParams = { mode: 'standard', domains: [], count: 3, difficulty: 'any' };
      const questions = [
        makeQuestion({ id: 'q1', correctOptionId: 'opt-a' }),
        makeQuestion({ id: 'q2', correctOptionId: 'opt-b' }),
        makeQuestion({ id: 'q3', correctOptionId: 'opt-c' }),
      ];
      loaderSpy.loadQuestionFile.and.returnValue(of(questions));
      service.getQuestions(params).subscribe();

      const payload: ExamPayload = {
        examId: 'test-all-skipped',
        answers: [
          { questionId: 'q1', optionId: '' },
          { questionId: 'q2', optionId: '' },
          { questionId: 'q3', optionId: '' },
        ],
      };

      const result = await firstValueFrom(service.validate(payload));

      expect(result.summary.skipped).toBe(3);
      expect(result.summary.correct).toBe(0);
      expect(result.summary.incorrect).toBe(0);
      expect(result.score).toBe(0);
    });

    it('should handle unknown questionId gracefully', async () => {
      const params: ExamParams = { mode: 'standard', domains: [], count: 1, difficulty: 'any' };
      loaderSpy.loadQuestionFile.and.returnValue(
        of([makeQuestion({ id: 'q1', correctOptionId: 'opt-a' })]),
      );
      service.getQuestions(params).subscribe();

      const payload: ExamPayload = {
        examId: 'test-unknown',
        answers: [
          { questionId: 'q1', optionId: 'opt-a' },
          { questionId: 'q-unknown', optionId: 'opt-a' }, // not in questionsById
        ],
      };

      const result = await firstValueFrom(service.validate(payload));

      // q1 is correct, q-unknown should be marked incorrect
      expect(result.summary.correct).toBe(1);
      const unknownItem = result.items.find((i) => i.questionId === 'q-unknown');
      expect(unknownItem).toBeTruthy();
      expect(unknownItem!.isCorrect).toBeFalse();
      expect(unknownItem!.domainCode).toBe('unknown');
    });

    it('should include totalTimeSpent from payload', async () => {
      const params: ExamParams = { mode: 'standard', domains: [], count: 1, difficulty: 'any' };
      loaderSpy.loadQuestionFile.and.returnValue(of([makeQuestion({ id: 'q1' })]));
      service.getQuestions(params).subscribe();

      const payload: ExamPayload = {
        examId: 'test-time',
        answers: [{ questionId: 'q1', optionId: 'opt-a' }],
        totalTimeSpent: 300,
      };

      const result = await firstValueFrom(service.validate(payload));
      expect(result.summary.totalTimeSpent).toBe(300);
    });

    it('should default totalTimeSpent to 0 when not provided', async () => {
      const params: ExamParams = { mode: 'standard', domains: [], count: 1, difficulty: 'any' };
      loaderSpy.loadQuestionFile.and.returnValue(of([makeQuestion({ id: 'q1' })]));
      service.getQuestions(params).subscribe();

      const payload: ExamPayload = {
        examId: 'test-no-time',
        answers: [{ questionId: 'q1', optionId: 'opt-a' }],
      };

      const result = await firstValueFrom(service.validate(payload));
      expect(result.summary.totalTimeSpent).toBe(0);
    });

    it('should calculate averageDifficulty correctly', async () => {
      const params: ExamParams = { mode: 'standard', domains: [], count: 3, difficulty: 'any' };
      const questions = [
        makeQuestion({ id: 'q1', difficulty: 'hard' }),
        makeQuestion({ id: 'q2', difficulty: 'hard' }),
        makeQuestion({ id: 'q3', difficulty: 'easy' }),
      ];
      loaderSpy.loadQuestionFile.and.returnValue(of(questions));
      service.getQuestions(params).subscribe();

      const payload: ExamPayload = {
        examId: 'test-diff',
        answers: [
          { questionId: 'q1', optionId: 'opt-a' },
          { questionId: 'q2', optionId: 'opt-a' },
          { questionId: 'q3', optionId: 'opt-a' },
        ],
      };

      const result = await firstValueFrom(service.validate(payload));
      expect(result.averageDifficulty).toBe('hard');
    });
  });

  // -------------------------------------------------------------------------
  // shuffle — options randomization
  // -------------------------------------------------------------------------

  describe('options shuffling', () => {
    it('should shuffle options (statistical: at least 1 in 10 runs differs from original order)', () => {
      const params: ExamParams = { mode: 'standard', domains: [], count: 1, difficulty: 'any' };
      const originalOptions = [
        { id: 'opt-a', text: 'A' },
        { id: 'opt-b', text: 'B' },
        { id: 'opt-c', text: 'C' },
        { id: 'opt-d', text: 'D' },
      ];

      let differentOrderFound = false;

      // Run 20 times - probability of all being identical is (1/24)^20 ~= 0
      for (let i = 0; i < 20; i++) {
        loaderSpy.loadQuestionFile.and.returnValue(
          of([makeQuestion({ id: 'q1', options: [...originalOptions] })]),
        );

        let result: any;
        service.getQuestions(params).subscribe((r) => (result = r));

        const returnedOrder = result.questions[0].options.map((o: any) => o.id);
        const originalOrder = originalOptions.map((o) => o.id);

        if (JSON.stringify(returnedOrder) !== JSON.stringify(originalOrder)) {
          differentOrderFound = true;
          break;
        }
      }

      expect(differentOrderFound).toBeTrue();
    });
  });
});
