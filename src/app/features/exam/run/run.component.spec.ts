import { provideZonelessChangeDetection, signal, computed } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Subject } from 'rxjs';

import { RunComponent } from './run.component';
import { ExamStateService, ExamStatus } from '../../../core/services';

describe('RunComponent', () => {
  const mockQuestions = signal<any[]>([]);
  const mockCurrentIndex = signal(0);
  const mockStatus = signal<ExamStatus>('idle');

  const mockExamStateService = {
    status: mockStatus.asReadonly(),
    questions: mockQuestions.asReadonly(),
    currentIndex: mockCurrentIndex.asReadonly(),
    currentQuestion: computed(() => mockQuestions()[mockCurrentIndex()] ?? null),
    progress: computed(() => ({
      answered: 0,
      flagged: 0,
      total: mockQuestions().length,
      percentage: 0,
    })),
    navigation: computed(() => ({
      canGoPrevious: mockCurrentIndex() > 0,
      canGoNext: mockCurrentIndex() < mockQuestions().length - 1,
      isFirst: mockCurrentIndex() === 0,
      isLast: mockCurrentIndex() === mockQuestions().length - 1,
      current: mockCurrentIndex() + 1,
      total: mockQuestions().length,
    })),
    examResult: signal(null).asReadonly(),
    examState$: new Subject(),
    getState: () => ({
      status: mockStatus(),
      examId: '',
      questions: mockQuestions(),
      currentIndex: mockCurrentIndex(),
      progress: { answered: 0, flagged: 0, total: 0, percentage: 0 },
      navigation: {
        canGoPrevious: false,
        canGoNext: false,
        isFirst: true,
        isLast: true,
        current: 1,
        total: 0,
      },
      timer: { remainingTime: 0, formattedTime: '0:00', isRunning: false, isPaused: false },
    }),
    startExam: jasmine.createSpy('startExam'),
    selectOption: jasmine.createSpy('selectOption'),
    toggleFlag: jasmine.createSpy('toggleFlag'),
    next: jasmine.createSpy('next'),
    previous: jasmine.createSpy('previous'),
    goToQuestion: jasmine.createSpy('goToQuestion'),
    pauseExam: jasmine.createSpy('pauseExam'),
    resumeExam: jasmine.createSpy('resumeExam'),
  };

  beforeEach(async () => {
    // Reset signals to defaults before each test
    mockQuestions.set([]);
    mockCurrentIndex.set(0);
    mockStatus.set('idle');

    await TestBed.configureTestingModule({
      imports: [RunComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([{ path: 'exam/start', component: RunComponent }]),
        { provide: ExamStateService, useValue: mockExamStateService },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    // Set status to running so it does not redirect
    mockStatus.set('running');
    const fixture = TestBed.createComponent(RunComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should show loading state when no questions', async () => {
    mockStatus.set('running');
    mockQuestions.set([]);

    const fixture = TestBed.createComponent(RunComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const loadingEl = compiled.querySelector('.loading-dots');
    expect(loadingEl).toBeTruthy();
    expect(loadingEl?.textContent).toContain('Cargando pregunta');
  });

  it('should redirect to start when exam is idle and no params', () => {
    mockStatus.set('idle');
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate');

    const fixture = TestBed.createComponent(RunComponent);
    fixture.detectChanges();

    expect(navigateSpy).toHaveBeenCalledWith(['/exam/start']);
  });
});
