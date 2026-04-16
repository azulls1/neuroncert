import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { QuestionLoaderService } from './question-loader.service';
import { LoggingService } from './logging.service';
import { Question, Catalog } from '../models';

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

function makeCatalog(): Catalog {
  return {
    version: '1.0',
    lastUpdated: '2026-01-01',
    levels: [],
    tracks: [],
    ccafConfig: {
      totalQuestions: 60,
      durationSec: 7200,
      passingScore: 720,
      maxScore: 1000,
      scenarioCount: 0,
      scenarioPool: [],
      domains: [],
    },
  };
}

describe('QuestionLoaderService', () => {
  let service: QuestionLoaderService;
  let httpTestCtrl: HttpTestingController;
  let loggerSpy: jasmine.SpyObj<LoggingService>;

  beforeEach(() => {
    loggerSpy = jasmine.createSpyObj('LoggingService', ['error', 'warn', 'info', 'debug']);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        QuestionLoaderService,
        { provide: LoggingService, useValue: loggerSpy },
      ],
    });

    service = TestBed.inject(QuestionLoaderService);
    httpTestCtrl = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestCtrl.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ---------------------------------------------------------------------------
  // loadCatalog()
  // ---------------------------------------------------------------------------

  describe('loadCatalog()', () => {
    it('should make HTTP request and return catalog', () => {
      const catalog = makeCatalog();

      let result: Catalog | undefined;
      service.loadCatalog().subscribe((c) => (result = c));

      const req = httpTestCtrl.expectOne('assets/question-bank/catalog.json');
      expect(req.request.method).toBe('GET');
      req.flush(catalog);

      expect(result).toBeTruthy();
      expect(result!.version).toBe('1.0');
    });

    it('should return cached catalog on second call (no HTTP)', () => {
      const catalog = makeCatalog();

      // First call: HTTP request
      let result1: Catalog | undefined;
      service.loadCatalog().subscribe((c) => (result1 = c));
      httpTestCtrl.expectOne('assets/question-bank/catalog.json').flush(catalog);

      // Second call: should return from cache, no HTTP
      let result2: Catalog | undefined;
      service.loadCatalog().subscribe((c) => (result2 = c));

      // No additional HTTP requests
      httpTestCtrl.expectNone('assets/question-bank/catalog.json');

      expect(result2).toBeTruthy();
      expect(result2!.version).toBe('1.0');
    });

    it('should throw on HTTP error', () => {
      let error: any;
      service.loadCatalog().subscribe({
        error: (e) => (error = e),
      });

      httpTestCtrl
        .expectOne('assets/question-bank/catalog.json')
        .flush('Not found', { status: 404, statusText: 'Not Found' });

      expect(error).toBeTruthy();
      expect(loggerSpy.error).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // loadQuestionFile()
  // ---------------------------------------------------------------------------

  describe('loadQuestionFile()', () => {
    it('should load questions from { questions: [] } format', () => {
      const questions = [makeQuestion({ id: 'q1' }), makeQuestion({ id: 'q2' })];

      let result: Question[] | undefined;
      service.loadQuestionFile('path/to/file.json').subscribe((q) => (result = q));

      httpTestCtrl.expectOne('path/to/file.json').flush({ questions });

      expect(result).toBeTruthy();
      expect(result!.length).toBe(2);
      expect(result![0].id).toBe('q1');
    });

    it('should load questions from plain array format', () => {
      const questions = [makeQuestion({ id: 'q1' }), makeQuestion({ id: 'q2' })];

      let result: Question[] | undefined;
      service.loadQuestionFile('path/to/array.json').subscribe((q) => (result = q));

      httpTestCtrl.expectOne('path/to/array.json').flush(questions);

      expect(result).toBeTruthy();
      expect(result!.length).toBe(2);
    });

    it('should return cached questions on second call', () => {
      const questions = [makeQuestion({ id: 'q1' })];

      // First call
      let result1: Question[] | undefined;
      service.loadQuestionFile('path/to/file.json').subscribe((q) => (result1 = q));
      httpTestCtrl.expectOne('path/to/file.json').flush(questions);

      // Second call - should use cache
      let result2: Question[] | undefined;
      service.loadQuestionFile('path/to/file.json').subscribe((q) => (result2 = q));
      httpTestCtrl.expectNone('path/to/file.json');

      expect(result2).toEqual(result1);
    });

    it('should return empty array on HTTP error', () => {
      let result: Question[] | undefined;
      service.loadQuestionFile('bad/path.json').subscribe((q) => (result = q));

      httpTestCtrl
        .expectOne('bad/path.json')
        .flush('Server error', { status: 500, statusText: 'Internal Server Error' });

      expect(result).toEqual([]);
      expect(loggerSpy.error).toHaveBeenCalled();
    });

    it('should handle response with null questions property', () => {
      let result: Question[] | undefined;
      service.loadQuestionFile('path/to/null.json').subscribe((q) => (result = q));

      httpTestCtrl.expectOne('path/to/null.json').flush({ questions: null });

      // response?.questions ?? [] should be []
      expect(result).toEqual([]);
    });

    it('should handle response with empty questions array', () => {
      let result: Question[] | undefined;
      service.loadQuestionFile('path/to/empty.json').subscribe((q) => (result = q));

      httpTestCtrl.expectOne('path/to/empty.json').flush({ questions: [] });

      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // loadFromMultiplePaths()
  // ---------------------------------------------------------------------------

  describe('loadFromMultiplePaths()', () => {
    it('should combine results from multiple paths', () => {
      const q1 = makeQuestion({ id: 'q1' });
      const q2 = makeQuestion({ id: 'q2' });

      let result: Question[] | undefined;
      service.loadFromMultiplePaths(['path/a.json', 'path/b.json']).subscribe((q) => (result = q));

      httpTestCtrl.expectOne('path/a.json').flush([q1]);
      httpTestCtrl.expectOne('path/b.json').flush([q2]);

      expect(result).toBeTruthy();
      expect(result!.length).toBe(2);
      expect(result!.map((q) => q.id)).toEqual(['q1', 'q2']);
    });

    it('should return empty array for empty paths', () => {
      let result: Question[] | undefined;
      service.loadFromMultiplePaths([]).subscribe((q) => (result = q));

      expect(result).toEqual([]);
    });

    it('should filter out questions without valid id', () => {
      const validQ = makeQuestion({ id: 'q1' });
      const invalidQ = { text: 'no id' } as any;

      let result: Question[] | undefined;
      service.loadFromMultiplePaths(['path/a.json']).subscribe((q) => (result = q));

      httpTestCtrl.expectOne('path/a.json').flush([validQ, invalidQ]);

      expect(result!.length).toBe(1);
      expect(result![0].id).toBe('q1');
    });

    it('should handle individual path errors gracefully', () => {
      const q1 = makeQuestion({ id: 'q1' });

      let result: Question[] | undefined;
      service
        .loadFromMultiplePaths(['path/ok.json', 'path/bad.json'])
        .subscribe((q) => (result = q));

      httpTestCtrl.expectOne('path/ok.json').flush([q1]);
      httpTestCtrl
        .expectOne('path/bad.json')
        .flush('Not found', { status: 404, statusText: 'Not Found' });

      expect(result).toBeTruthy();
      expect(result!.length).toBe(1);
      expect(result![0].id).toBe('q1');
    });
  });

  // ---------------------------------------------------------------------------
  // clearCache()
  // ---------------------------------------------------------------------------

  describe('clearCache()', () => {
    it('should clear question file cache', () => {
      const questions = [makeQuestion({ id: 'q1' })];

      // Load and cache
      service.loadQuestionFile('path/file.json').subscribe();
      httpTestCtrl.expectOne('path/file.json').flush(questions);

      // Clear cache
      service.clearCache();

      // Should make a new HTTP request after cache clear
      service.loadQuestionFile('path/file.json').subscribe();
      httpTestCtrl.expectOne('path/file.json').flush(questions);
    });

    it('should clear catalog cache', () => {
      const catalog = makeCatalog();

      // Load and cache
      service.loadCatalog().subscribe();
      httpTestCtrl.expectOne('assets/question-bank/catalog.json').flush(catalog);

      // Clear cache
      service.clearCache();

      // Should make a new HTTP request after cache clear
      service.loadCatalog().subscribe();
      httpTestCtrl.expectOne('assets/question-bank/catalog.json').flush(catalog);
    });
  });
});
