import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { of } from 'rxjs';
import { CCAFExamComponent } from './ccaf-exam.component';
import { ExamStateService } from '../../../core/services/exam-state.service';
import { CurriculumService } from '../../../core/services/curriculum.service';

describe('CCAFExamComponent', () => {
  const mockExamStateService = {
    startExam: () => of({ examId: 'test-id', questions: [], durationSec: 7200 }),
  };

  const mockCurriculumService = {
    loadCatalog: () => of({ tracks: [], levels: [] }),
    getCCAFConfig: () => ({
      totalQuestions: 60,
      durationSec: 7200,
      passingScore: 720,
      maxScore: 1000,
      domains: [{ code: 'D1', name: 'Domain 1', weight: 0.27 }],
    }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CCAFExamComponent],
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
    const fixture = TestBed.createComponent(CCAFExamComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should start with catalogLoading true and isLoading false', () => {
    const fixture = TestBed.createComponent(CCAFExamComponent);
    expect(fixture.componentInstance.catalogLoading()).toBe(true);
    expect(fixture.componentInstance.isLoading).toBe(false);
  });

  it('should load config after ngOnInit', () => {
    const fixture = TestBed.createComponent(CCAFExamComponent);
    fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.catalogLoading()).toBe(false);
    expect(fixture.componentInstance.ccafConfig()).toBeTruthy();
    expect(fixture.componentInstance.totalQuestions()).toBe(60);
  });
});
