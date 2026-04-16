import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { FlashcardComponent } from './flashcard.component';
import { QuestionBankService } from '../../../core/services';

describe('FlashcardComponent', () => {
  const mockQuestions = [
    {
      id: 'q1',
      text: 'Question 1',
      domainCode: 'D1',
      difficulty: 'easy',
      options: [{ id: 'o1', text: 'Option A', order: 0 }],
      correctOptionId: 'o1',
      explanation: 'Because A',
    },
    {
      id: 'q2',
      text: 'Question 2',
      domainCode: 'D2',
      difficulty: 'hard',
      options: [{ id: 'o2', text: 'Option B', order: 0 }],
      correctOptionId: 'o2',
      explanation: 'Because B',
    },
  ];

  const mockQuestionBankService = {
    getFlashcards: () => of(mockQuestions),
  };

  const mockActivatedRoute = {
    snapshot: {
      paramMap: {
        get: (key: string) => (key === 'trackId' ? 't1' : null),
      },
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlashcardComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: QuestionBankService, useValue: mockQuestionBankService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(FlashcardComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should load questions on init', () => {
    const fixture = TestBed.createComponent(FlashcardComponent);
    fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.loading()).toBe(false);
    expect(fixture.componentInstance.allQuestions().length).toBe(2);
  });

  it('should toggle flip and mark as reviewed', () => {
    const fixture = TestBed.createComponent(FlashcardComponent);
    fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.showAnswer()).toBe(false);
    fixture.componentInstance.toggleFlip();
    expect(fixture.componentInstance.showAnswer()).toBe(true);
    expect(fixture.componentInstance.reviewedCount()).toBe(1);
  });

  it('should navigate to next question', () => {
    const fixture = TestBed.createComponent(FlashcardComponent);
    fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.currentIndex()).toBe(0);
    fixture.componentInstance.goNext();
    expect(fixture.componentInstance.currentIndex()).toBe(1);
  });
});
