import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { HistoryComponent } from './history.component';
import { ExamHistoryService } from '../../../core/services/exam-history.service';
import { ConfigService } from '../../../core/services/config.service';

describe('HistoryComponent', () => {
  const mockSessions = [
    {
      sessionId: 's1',
      startTime: new Date('2026-01-01T10:00:00'),
      endTime: new Date('2026-01-01T11:00:00'),
      totalQuestions: 10,
      correctAnswers: 8,
      difficulty: 'standard',
      questions: [],
    },
    {
      sessionId: 's2',
      startTime: new Date('2026-01-02T10:00:00'),
      endTime: new Date('2026-01-02T11:00:00'),
      totalQuestions: 10,
      correctAnswers: 5,
      difficulty: 'ccaf',
      questions: [],
    },
  ];

  const mockHistoryService = {
    sessions: signal(mockSessions),
    loadFromSupabase: jasmine.createSpy('loadFromSupabase').and.returnValue(Promise.resolve()),
    clearAllHistory: jasmine.createSpy('clearAllHistory'),
  };

  const mockConfigService = {
    passingPercent: 70,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoryComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ExamHistoryService, useValue: mockHistoryService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(HistoryComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should start in loading state', () => {
    const fixture = TestBed.createComponent(HistoryComponent);
    expect(fixture.componentInstance.loading()).toBe(true);
  });

  it('should compute best score across sessions', () => {
    const fixture = TestBed.createComponent(HistoryComponent);
    expect(fixture.componentInstance.bestScore()).toBe(80);
  });

  it('should compute average score', () => {
    const fixture = TestBed.createComponent(HistoryComponent);
    expect(fixture.componentInstance.averageScore()).toBe(65);
  });
});
