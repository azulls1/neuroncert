import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { DashboardComponent } from './dashboard.component';
import { CurriculumService } from '../../core/services/curriculum.service';
import { ProgressService } from '../../core/services/progress.service';
import { OverallProgress } from '../../core/models';
import { LearningLevelNumber } from '../../core/models/content-type.model';

describe('DashboardComponent', () => {
  const defaultOverallProgress: OverallProgress = {
    tracksStarted: 2,
    tracksCompleted: 1,
    totalExamsTaken: 5,
    averageScore: 72,
    ccafBestScore: 780,
    ccafAttempts: 3,
    progressByLevel: {
      1: { total: 5, completed: 2 },
      2: { total: 4, completed: 1 },
      3: { total: 3, completed: 0 },
      4: { total: 2, completed: 0 },
    } as Record<LearningLevelNumber, { total: number; completed: number }>,
    lastUpdated: new Date().toISOString(),
  };

  const mockTracks = signal<any[]>([
    { id: 't1', title: 'Track 1', platform: 'academy', level: 1, tags: [], description: '', modules: [] },
    { id: 't2', title: 'Track 2', platform: 'coursera', level: 2, tags: [], description: '', modules: [] },
    { id: 't3', title: 'Track 3', platform: 'deeplearning-ai', level: 1, tags: [], description: '', modules: [] },
  ]);

  const mockLevels = signal<any[]>([
    { number: 1, title: 'Beginner' },
    { number: 2, title: 'Intermediate' },
  ]);

  const mockCurriculumService = {
    loadCatalog: jasmine.createSpy('loadCatalog').and.returnValue(of({ tracks: [], levels: [] })),
    getTracks: () => mockTracks.asReadonly(),
    getLevels: () => mockLevels.asReadonly(),
    getCCAFConfig: () => ({
      totalQuestions: 60,
      durationSec: 5400,
      passingScore: 720,
      maxScore: 1000,
      scenarioCount: 2,
      domains: [
        { code: 'd1', name: 'Domain 1', weight: 0.5, totalQuestions: 400 },
        { code: 'd2', name: 'Domain 2', weight: 0.5, totalQuestions: 406 },
      ],
    }),
  };

  const mockProgressService = {
    getOverallProgress: () => signal(defaultOverallProgress).asReadonly(),
    getTrackProgress: () => ({
      trackId: '',
      completedModules: [],
      theoryCompleted: false,
      practiceCompleted: false,
      examAttempts: 0,
      bestExamScore: 0,
      lastAccessedAt: '',
      totalTimeSpentSec: 0,
    }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CurriculumService, useValue: mockCurriculumService },
        { provide: ProgressService, useValue: mockProgressService },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should compute dynamic stats from curriculum', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    // trackCount comes from the mock tracks signal (3 tracks)
    expect(component.trackCount()).toBe(3);

    // levelCount comes from the mock levels signal (2 levels)
    expect(component.levelCount()).toBe(2);

    // platformCount: 3 unique platforms (academy, coursera, deeplearning-ai)
    expect(component.platformCount()).toBe(3);

    // questionCount from CCA-F config domains (400 + 406 = 806)
    expect(component.questionCount()).toBe(806);
  });

  it('should compute per-platform track counts', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.academyTrackCount()).toBe(1);
    expect(component.courseraTrackCount()).toBe(1);
    expect(component.deeplearningTrackCount()).toBe(1);
  });

  it('should compute CCA-F config values', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.ccafPassingScore()).toBe(720);
    expect(component.ccafMaxScore()).toBe(1000);
    expect(component.ccafTotalQuestions()).toBe(60);
  });

  it('should compute progress percentages', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    // tracksPercentage: 2 started out of 3 = 66.67%
    expect(component.tracksPercentage()).toBeCloseTo(66.67, 0);

    // ccafPercentage: 780 / 1000 = 78%
    expect(component.ccafPercentage()).toBe(78);
  });
});
