import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { CCAFResultsComponent } from './ccaf-results.component';
import { ExamStateService } from '../../../core/services';
import { ScoreService } from '../../../core/services';
import { CurriculumService } from '../../../core/services/curriculum.service';

describe('CCAFResultsComponent', () => {
  const mockExamResult = {
    score: 80,
    passed: true,
    weightedScore: 820,
    domainScores: [],
    summary: { correct: 48, incorrect: 10, skipped: 2, flagged: 0, totalTimeSpent: 3600 },
    items: [],
    recommendations: [],
  };

  const mockExamStateService = {
    examResult: signal(mockExamResult),
  };

  const mockScoreService = {
    calculateStandardScore: (correct: number, total: number) => Math.round((correct / total) * 100),
  };

  const mockCurriculumService = {
    loadCatalog: () => of({ tracks: [], levels: [] }),
    getCCAFConfig: () => ({
      totalQuestions: 60,
      durationSec: 7200,
      passingScore: 720,
      maxScore: 1000,
      domains: [],
    }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CCAFResultsComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ExamStateService, useValue: mockExamStateService },
        { provide: ScoreService, useValue: mockScoreService },
        { provide: CurriculumService, useValue: mockCurriculumService },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(CCAFResultsComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should populate stats from exam result on init', () => {
    const fixture = TestBed.createComponent(CCAFResultsComponent);
    fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.passed).toBe(true);
    expect(fixture.componentInstance.weightedScore).toBe(820);
    expect(fixture.componentInstance.totalCorrect).toBe(48);
    expect(fixture.componentInstance.totalQuestions).toBe(60);
  });

  it('should redirect to /ccaf if no exam result', () => {
    const noResultService = { examResult: signal(null) };
    TestBed.overrideProvider(ExamStateService, { useValue: noResultService });
    const fixture = TestBed.createComponent(CCAFResultsComponent);
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    fixture.componentInstance.ngOnInit();
    expect(router.navigate).toHaveBeenCalledWith(['/ccaf']);
  });
});
