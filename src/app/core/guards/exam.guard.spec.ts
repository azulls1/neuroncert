import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { provideRouter } from '@angular/router';
import {
  examRunGuard,
  examSubmitGuard,
  examReviewGuard,
  examResultsGuard,
  ccafResultsGuard,
} from './exam.guard';
import { ExamStateService, ExamStatus } from '../services/exam-state.service';
import { ExamResult } from '../models';

/**
 * Helper: ejecuta un functional guard en el contexto de TestBed.
 */
function runGuard(guard: any): boolean | UrlTree {
  return TestBed.runInInjectionContext(() => guard(null as any, null as any));
}

describe('Exam Guards', () => {
  let mockExamState: {
    status: jasmine.Spy;
    examResult: jasmine.Spy;
    examParams: jasmine.Spy;
  };

  beforeEach(() => {
    mockExamState = {
      status: jasmine.createSpy('status').and.returnValue('idle' as ExamStatus),
      examResult: jasmine.createSpy('examResult').and.returnValue(null),
      examParams: jasmine.createSpy('examParams').and.returnValue(null),
    };

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([
          { path: '', component: class {} as any },
          { path: 'exam/start', component: class {} as any },
          { path: 'exam/run', component: class {} as any },
          { path: 'exam/review', component: class {} as any },
          { path: 'ccaf', component: class {} as any },
        ]),
        { provide: ExamStateService, useValue: mockExamState },
      ],
    });
  });

  // -------------------------------------------------------------------------
  // examRunGuard
  // -------------------------------------------------------------------------

  describe('examRunGuard', () => {
    it('should allow access when status is "running"', () => {
      mockExamState.status.and.returnValue('running');
      const result = runGuard(examRunGuard);
      expect(result).toBeTrue();
    });

    it('should allow access when status is "paused"', () => {
      mockExamState.status.and.returnValue('paused');
      const result = runGuard(examRunGuard);
      expect(result).toBeTrue();
    });

    it('should redirect to /exam/review when status is "submitted"', () => {
      mockExamState.status.and.returnValue('submitted');
      const result = runGuard(examRunGuard);
      expect(result).toBeInstanceOf(UrlTree);
      expect((result as UrlTree).toString()).toBe('/exam/review');
    });

    it('should redirect to /exam/review when status is "completed"', () => {
      mockExamState.status.and.returnValue('completed');
      const result = runGuard(examRunGuard);
      expect(result).toBeInstanceOf(UrlTree);
      expect((result as UrlTree).toString()).toBe('/exam/review');
    });

    it('should redirect to /exam/start when status is "idle"', () => {
      mockExamState.status.and.returnValue('idle');
      const result = runGuard(examRunGuard);
      expect(result).toBeInstanceOf(UrlTree);
      expect((result as UrlTree).toString()).toBe('/exam/start');
    });
  });

  // -------------------------------------------------------------------------
  // examSubmitGuard
  // -------------------------------------------------------------------------

  describe('examSubmitGuard', () => {
    it('should allow access when status is "running"', () => {
      mockExamState.status.and.returnValue('running');
      const result = runGuard(examSubmitGuard);
      expect(result).toBeTrue();
    });

    it('should allow access when status is "paused"', () => {
      mockExamState.status.and.returnValue('paused');
      const result = runGuard(examSubmitGuard);
      expect(result).toBeTrue();
    });

    it('should redirect to /exam/review when status is "submitted"', () => {
      mockExamState.status.and.returnValue('submitted');
      const result = runGuard(examSubmitGuard);
      expect(result).toBeInstanceOf(UrlTree);
      expect((result as UrlTree).toString()).toBe('/exam/review');
    });

    it('should redirect to /exam/review when status is "completed"', () => {
      mockExamState.status.and.returnValue('completed');
      const result = runGuard(examSubmitGuard);
      expect(result).toBeInstanceOf(UrlTree);
      expect((result as UrlTree).toString()).toBe('/exam/review');
    });

    it('should redirect to /exam/start when status is "idle"', () => {
      mockExamState.status.and.returnValue('idle');
      const result = runGuard(examSubmitGuard);
      expect(result).toBeInstanceOf(UrlTree);
      expect((result as UrlTree).toString()).toBe('/exam/start');
    });
  });

  // -------------------------------------------------------------------------
  // examReviewGuard
  // -------------------------------------------------------------------------

  describe('examReviewGuard', () => {
    it('should allow access when status is "completed"', () => {
      mockExamState.status.and.returnValue('completed');
      const result = runGuard(examReviewGuard);
      expect(result).toBeTrue();
    });

    it('should allow access when status is "submitted"', () => {
      mockExamState.status.and.returnValue('submitted');
      const result = runGuard(examReviewGuard);
      expect(result).toBeTrue();
    });

    it('should redirect to /exam/run when status is "running"', () => {
      mockExamState.status.and.returnValue('running');
      const result = runGuard(examReviewGuard);
      expect(result).toBeInstanceOf(UrlTree);
      expect((result as UrlTree).toString()).toBe('/exam/run');
    });

    it('should redirect to /exam/run when status is "paused"', () => {
      mockExamState.status.and.returnValue('paused');
      const result = runGuard(examReviewGuard);
      expect(result).toBeInstanceOf(UrlTree);
      expect((result as UrlTree).toString()).toBe('/exam/run');
    });

    it('should redirect to / when status is "idle"', () => {
      mockExamState.status.and.returnValue('idle');
      const result = runGuard(examReviewGuard);
      expect(result).toBeInstanceOf(UrlTree);
      expect((result as UrlTree).toString()).toBe('/');
    });
  });

  // -------------------------------------------------------------------------
  // examResultsGuard
  // -------------------------------------------------------------------------

  describe('examResultsGuard', () => {
    it('should allow access when examResult exists', () => {
      const mockResult: Partial<ExamResult> = {
        examId: 'exam-1',
        score: 80,
      };
      mockExamState.examResult.and.returnValue(mockResult);

      const result = runGuard(examResultsGuard);
      expect(result).toBeTrue();
    });

    it('should redirect to /exam/start when examResult is null', () => {
      mockExamState.examResult.and.returnValue(null);
      const result = runGuard(examResultsGuard);
      expect(result).toBeInstanceOf(UrlTree);
      expect((result as UrlTree).toString()).toBe('/exam/start');
    });
  });

  // -------------------------------------------------------------------------
  // ccafResultsGuard
  // -------------------------------------------------------------------------

  describe('ccafResultsGuard', () => {
    it('should allow access when examResult has domainScores', () => {
      const mockResult: Partial<ExamResult> = {
        examId: 'ccaf-1',
        score: 750,
        domainScores: [
          {
            domainCode: 'D1',
            domainName: 'Domain 1',
            weight: 0.5,
            correct: 5,
            total: 10,
            rawPercentage: 50,
            weightedContribution: 250,
          },
        ],
      };
      mockExamState.examResult.and.returnValue(mockResult);

      const result = runGuard(ccafResultsGuard);
      expect(result).toBeTrue();
    });

    it('should redirect to /ccaf when examResult is null', () => {
      mockExamState.examResult.and.returnValue(null);
      const result = runGuard(ccafResultsGuard);
      expect(result).toBeInstanceOf(UrlTree);
      expect((result as UrlTree).toString()).toBe('/ccaf');
    });

    it('should redirect to /ccaf when examResult has no domainScores', () => {
      const mockResult: Partial<ExamResult> = {
        examId: 'exam-1',
        score: 80,
        // no domainScores
      };
      mockExamState.examResult.and.returnValue(mockResult);

      const result = runGuard(ccafResultsGuard);
      expect(result).toBeInstanceOf(UrlTree);
      expect((result as UrlTree).toString()).toBe('/ccaf');
    });
  });
});
