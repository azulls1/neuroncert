import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { TrackDetailComponent } from './track-detail.component';
import { CurriculumService } from '../../../core/services/curriculum.service';
import { ProgressService } from '../../../core/services/progress.service';

describe('TrackDetailComponent', () => {
  const mockTrack = {
    id: 't1',
    title: 'Track 1',
    description: 'Desc',
    level: 2,
    platform: 'academy',
    estimatedHours: 5,
    modules: [
      { id: 'm1', title: 'Module 1', description: 'Mod desc', questionCount: 10 },
      { id: 'm2', title: 'Module 2', description: 'Mod desc', questionCount: 15 },
    ],
  };

  const mockCurriculumService = {
    loadCatalog: () => of({ tracks: [], levels: [] }),
    getTrackById: (id: string) => (id === 't1' ? mockTrack : undefined),
  };

  const mockProgressService = {
    getCompletionPercentage: () => 42,
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
      imports: [TrackDetailComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CurriculumService, useValue: mockCurriculumService },
        { provide: ProgressService, useValue: mockProgressService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(TrackDetailComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should start in loading state', () => {
    const fixture = TestBed.createComponent(TrackDetailComponent);
    expect(fixture.componentInstance.isLoading()).toBe(true);
  });

  it('should load track and compute total questions after init', () => {
    const fixture = TestBed.createComponent(TrackDetailComponent);
    fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.isLoading()).toBe(false);
    expect(fixture.componentInstance.track()).toBeTruthy();
    expect(fixture.componentInstance.totalQuestions()).toBe(25);
    expect(fixture.componentInstance.completionPercentage()).toBe(42);
  });

  it('should default to theory tab', () => {
    const fixture = TestBed.createComponent(TrackDetailComponent);
    expect(fixture.componentInstance.activeTab()).toBe('theory');
  });
});
