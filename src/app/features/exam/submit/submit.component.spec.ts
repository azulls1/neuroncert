import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { SubmitComponent } from './submit.component';
import { ExamStateService } from '../../../core/services';
import { CurriculumService } from '../../../core/services/curriculum.service';

describe('SubmitComponent', () => {
  const mockExamStateService = {
    getState: () => ({
      status: 'running' as const,
      questions: [
        { id: 'q1', selectedOptionId: 'o1', flagged: false },
        { id: 'q2', selectedOptionId: null, flagged: true },
      ],
      timer: { totalTime: 3600, remainingTime: 1800 },
    }),
    examState$: new Subject(),
    submitExam: () =>
      of({
        score: 80,
        passed: true,
        summary: { correct: 1, incorrect: 0, skipped: 1, flagged: 1, totalTimeSpent: 1800 },
        items: [],
        recommendations: [],
      }),
    examParams: signal({ mode: 'standard' }),
  };

  const mockCurriculumService = {
    getCCAFConfig: () => null,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubmitComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ExamStateService, useValue: mockExamStateService },
        { provide: CurriculumService, useValue: mockCurriculumService },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(SubmitComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should compute exam stats on init', () => {
    const fixture = TestBed.createComponent(SubmitComponent);
    fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.examStats().total).toBe(2);
    expect(fixture.componentInstance.examStats().answered).toBe(1);
    expect(fixture.componentInstance.examStats().remaining).toBe(1);
  });

  it('should navigate back to exam run on goBack', () => {
    const fixture = TestBed.createComponent(SubmitComponent);
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    fixture.componentInstance.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/exam/run']);
  });
});
