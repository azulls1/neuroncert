import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ReviewComponent } from './review.component';
import { ExamStateService } from '../../../core/services/exam-state.service';

describe('ReviewComponent', () => {
  const mockResult = {
    score: 75,
    passed: true,
    weightedScore: 780,
    summary: { correct: 45, incorrect: 12, skipped: 3, flagged: 2, totalTimeSpent: 3600 },
    items: [
      {
        questionId: 'q1',
        selectedOptionId: 'o1',
        correctOptionId: 'o1',
        isCorrect: true,
        explanation: 'Good',
        domainCode: 'D1',
        flagged: false,
      },
      {
        questionId: 'q2',
        selectedOptionId: 'o2',
        correctOptionId: 'o3',
        isCorrect: false,
        explanation: 'Wrong',
        domainCode: 'D2',
        flagged: false,
      },
      {
        questionId: 'q3',
        selectedOptionId: '',
        correctOptionId: 'o1',
        isCorrect: false,
        explanation: 'Skipped',
        domainCode: 'D1',
        flagged: false,
      },
    ],
    recommendations: ['Study more D2'],
  };

  const mockExamStateService = {
    examResult: signal(mockResult),
    questions: signal([
      { id: 'q1', text: 'Q1 text', options: [{ id: 'o1', text: 'Opt1' }] },
      {
        id: 'q2',
        text: 'Q2 text',
        options: [
          { id: 'o2', text: 'Opt2' },
          { id: 'o3', text: 'Opt3' },
        ],
      },
      { id: 'q3', text: 'Q3 text', options: [{ id: 'o1', text: 'Opt1' }] },
    ]),
    resetExam: jasmine.createSpy('resetExam'),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ExamStateService, useValue: mockExamStateService },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ReviewComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should compute passed state from result', () => {
    const fixture = TestBed.createComponent(ReviewComponent);
    expect(fixture.componentInstance.passed()).toBe(true);
  });

  it('should count correct, incorrect, and skipped items', () => {
    const fixture = TestBed.createComponent(ReviewComponent);
    expect(fixture.componentInstance.correctCount()).toBe(1);
    expect(fixture.componentInstance.incorrectCount()).toBe(1);
    expect(fixture.componentInstance.skippedCount()).toBe(1);
  });

  it('should filter items by mode', () => {
    const fixture = TestBed.createComponent(ReviewComponent);
    fixture.componentInstance.setFilter('correct');
    expect(fixture.componentInstance.filteredItems().length).toBe(1);
    fixture.componentInstance.setFilter('all');
    expect(fixture.componentInstance.filteredItems().length).toBe(3);
  });
});
