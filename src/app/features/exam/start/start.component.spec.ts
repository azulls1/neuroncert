import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { StartComponent } from './start.component';
import { ConfigService, ExamStateService, CurriculumService } from '../../../core/services';

describe('StartComponent', () => {
  const mockConfigService = {
    defaultQuestionsCount: 30,
    defaultDurationSec: 2700,
    appName: 'Test App',
  };

  const mockExamStateService = {
    startExam: jasmine.createSpy('startExam').and.returnValue(of({ examId: '1', questions: [], durationSec: 2700 })),
  };

  const mockCurriculumService = {
    loadCatalog: jasmine.createSpy('loadCatalog').and.returnValue(of({ tracks: [], levels: [] })),
    getTrackById: jasmine.createSpy('getTrackById').and.returnValue(undefined),
    getCCAFConfig: jasmine.createSpy('getCCAFConfig').and.returnValue(null),
    getTracks: () => signal([]),
    getLevels: () => signal([]),
  };

  const mockActivatedRoute = {
    snapshot: {
      queryParamMap: {
        get: (_key: string) => null,
      },
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StartComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: ConfigService, useValue: mockConfigService },
        { provide: ExamStateService, useValue: mockExamStateService },
        { provide: CurriculumService, useValue: mockCurriculumService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(StartComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should load catalog on init when trackId is present', () => {
    // Override the mock to return a trackId
    const routeWithTrack = {
      snapshot: {
        queryParamMap: {
          get: (key: string) => (key === 'trackId' ? 'track-1' : null),
        },
      },
    };
    TestBed.overrideProvider(ActivatedRoute, { useValue: routeWithTrack });

    const fixture = TestBed.createComponent(StartComponent);
    fixture.detectChanges();

    expect(mockCurriculumService.loadCatalog).toHaveBeenCalled();
  });

  it('should have default exam parameters', () => {
    const fixture = TestBed.createComponent(StartComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    // Default difficulty is 'any'
    expect(component.selectedDifficulty).toBe('any');

    // Default question count comes from config
    expect(component.effectiveQuestionCount()).toBe(mockConfigService.defaultQuestionsCount);

    // Default duration comes from config
    expect(component.effectiveDurationSec()).toBe(mockConfigService.defaultDurationSec);
  });

  it('should have difficulty options defined', () => {
    const fixture = TestBed.createComponent(StartComponent);
    const component = fixture.componentInstance;

    expect(component.difficultyOptions.length).toBe(4);
    expect(component.difficultyOptions[0].value).toBe('any');
  });

  it('should allow starting exam when not loading', () => {
    const fixture = TestBed.createComponent(StartComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.canStartExam()).toBeTrue();
  });
});
