import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { TrackListComponent } from './track-list.component';
import { CurriculumService } from '../../../core/services/curriculum.service';
import { ProgressService } from '../../../core/services/progress.service';

describe('TrackListComponent', () => {
  const mockTracks = signal([
    {
      id: 't1',
      title: 'Track 1',
      description: 'Desc',
      level: 1,
      platform: 'academy',
      estimatedHours: 5,
      modules: [],
    },
    {
      id: 't2',
      title: 'Track 2',
      description: 'Desc',
      level: 2,
      platform: 'coursera',
      estimatedHours: 10,
      modules: [],
    },
  ]);

  const mockCurriculumService = {
    loadCatalog: () => of({ tracks: [], levels: [] }),
    getTracks: () => mockTracks,
  };

  const mockProgressService = {
    getTrackProgress: () => ({ examAttempts: 0, bestExamScore: 0 }),
    getCompletionPercentage: () => 0,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrackListComponent],
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
    const fixture = TestBed.createComponent(TrackListComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should compute available levels from tracks', () => {
    const fixture = TestBed.createComponent(TrackListComponent);
    expect(fixture.componentInstance.availableLevels()).toEqual([1, 2]);
  });

  it('should filter tracks by level', () => {
    const fixture = TestBed.createComponent(TrackListComponent);
    fixture.componentInstance.selectedLevel.set(1);
    expect(fixture.componentInstance.filteredTracks().length).toBe(1);
    expect(fixture.componentInstance.filteredTracks()[0].id).toBe('t1');
  });

  it('should navigate to track on goToTrack', () => {
    const fixture = TestBed.createComponent(TrackListComponent);
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    fixture.componentInstance.goToTrack('t1');
    expect(router.navigate).toHaveBeenCalledWith(['/tracks', 't1']);
  });
});
