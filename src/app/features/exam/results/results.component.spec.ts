import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ResultsComponent } from './results.component';
import { ExamStateService } from '../../../core/services';
import { ExamResult } from '../../../core/models';

describe('ResultsComponent', () => {
  const mockResult: ExamResult = {
    examId: 'exam-1',
    score: 75,
    summary: {
      correct: 15,
      incorrect: 5,
      skipped: 0,
      flagged: 2,
      scorePercentage: 75,
      totalTimeSpent: 1200,
      timeLimit: 2700,
    },
    items: Array.from({ length: 20 }, (_, i) => ({
      questionId: `q-${i}`,
      isCorrect: i < 15,
      explanation: 'Explanation',
      domainCode: 'domain-1',
      selectedOptionId: `opt-${i}`,
    })),
    recommendations: ['Study more domain-1'],
    completedAt: new Date(),
    domains: ['domain-1'],
    averageDifficulty: 'medium' as const,
  };

  const mockExamStateService = {
    examResult: signal<ExamResult | null>(mockResult).asReadonly(),
    resetExam: jasmine.createSpy('resetExam'),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultsComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: ExamStateService, useValue: mockExamStateService },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ResultsComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should display score when result exists', async () => {
    const fixture = TestBed.createComponent(ResultsComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance;
    expect(component.examResult()).toBeTruthy();
    expect(component.examResult()?.score).toBe(75);

    const compiled = fixture.nativeElement as HTMLElement;
    const scoreText = compiled.textContent;
    expect(scoreText).toContain('75%');
  });

  it('should return correct result class for passing score', () => {
    const fixture = TestBed.createComponent(ResultsComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component.getResultClass()).toBe('success');
  });

  it('should return correct result title for passing score', () => {
    const fixture = TestBed.createComponent(ResultsComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component.getResultTitle()).toBe('Excelente!');
  });

  it('should handle null result gracefully', () => {
    const nullResultService = {
      examResult: signal<ExamResult | null>(null).asReadonly(),
      resetExam: jasmine.createSpy('resetExam'),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ResultsComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: ExamStateService, useValue: nullResultService },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ResultsComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component.examResult()).toBeNull();
    expect(component.getResultClass()).toBe('');
  });
});
