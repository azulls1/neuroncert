import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { ConceptReviewComponent } from './concept-review.component';
import { QuestionBankService } from '../../../core/services';

describe('ConceptReviewComponent', () => {
  const mockQuestions = Array.from({ length: 15 }, (_, i) => ({
    id: `q${i}`,
    text: `Question ${i}`,
    domainCode: i % 2 === 0 ? 'D1' : 'D2',
    difficulty: i % 3 === 0 ? 'easy' : i % 3 === 1 ? 'medium' : 'hard',
    options: [
      { id: `o${i}a`, text: 'Option A', order: 0 },
      { id: `o${i}b`, text: 'Option B', order: 1 },
    ],
    correctOptionId: `o${i}a`,
    explanation: `Explanation ${i}`,
  }));

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
      imports: [ConceptReviewComponent],
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
    const fixture = TestBed.createComponent(ConceptReviewComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should load questions on init', () => {
    const fixture = TestBed.createComponent(ConceptReviewComponent);
    fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.loading()).toBe(false);
    expect(fixture.componentInstance.allQuestions().length).toBe(15);
  });

  it('should compute available domains', () => {
    const fixture = TestBed.createComponent(ConceptReviewComponent);
    fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.availableDomains()).toEqual(['D1', 'D2']);
  });

  it('should paginate questions (10 per page)', () => {
    const fixture = TestBed.createComponent(ConceptReviewComponent);
    fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.paginatedQuestions().length).toBe(10);
    expect(fixture.componentInstance.totalPages()).toBe(2);
  });

  it('should filter by domain', () => {
    const fixture = TestBed.createComponent(ConceptReviewComponent);
    fixture.componentInstance.ngOnInit();
    fixture.componentInstance.setDomain('D1');
    expect(fixture.componentInstance.filteredQuestions().every((q) => q.domainCode === 'D1')).toBe(
      true,
    );
  });
});
