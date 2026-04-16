import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { TrackPracticeComponent } from './track-practice.component';
import { CurriculumService } from '../../../core/services/curriculum.service';
import { QuestionBankService } from '../../../core/services/question-bank.service';

describe('TrackPracticeComponent', () => {
  const mockQuestions = [
    {
      id: 'q1',
      text: 'Question 1',
      domainCode: 'D1',
      difficulty: 'easy',
      options: [
        { id: 'o1', text: 'Option A', order: 0 },
        { id: 'o2', text: 'Option B', order: 1 },
      ],
      correctOptionId: 'o1',
      explanation: 'Because A',
    },
  ];

  const mockCurriculumService = {
    loadCatalog: () => of({ tracks: [], levels: [] }),
    getTrackById: () => ({ id: 't1', title: 'Track 1', modules: [] }),
  };

  const mockQuestionBankService = {
    getQuestionsByTrack: () => of(mockQuestions),
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
      imports: [TrackPracticeComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CurriculumService, useValue: mockCurriculumService },
        { provide: QuestionBankService, useValue: mockQuestionBankService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(TrackPracticeComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should start in loading state', () => {
    const fixture = TestBed.createComponent(TrackPracticeComponent);
    expect(fixture.componentInstance.loading()).toBe(true);
    expect(fixture.componentInstance.completed()).toBe(false);
  });

  it('should load questions after init', () => {
    const fixture = TestBed.createComponent(TrackPracticeComponent);
    fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.loading()).toBe(false);
    expect(fixture.componentInstance.questions().length).toBe(1);
  });

  it('should handle option selection and record answer', () => {
    const fixture = TestBed.createComponent(TrackPracticeComponent);
    fixture.componentInstance.ngOnInit();
    fixture.componentInstance.selectOption('o1');
    expect(fixture.componentInstance.answered()).toBe(true);
    expect(fixture.componentInstance.correctCount()).toBe(1);
  });
});
