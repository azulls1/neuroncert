import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { of } from 'rxjs';
import { CCAFHomeComponent } from './ccaf-home.component';
import { CurriculumService } from '../../../core/services/curriculum.service';
import { ProgressService } from '../../../core/services/progress.service';

describe('CCAFHomeComponent', () => {
  const mockCurriculumService = {
    loadCatalog: () => of({ tracks: [], levels: [] }),
    getCCAFConfig: () => ({
      totalQuestions: 60,
      durationSec: 7200,
      passingScore: 720,
      maxScore: 1000,
      domains: [{ code: 'D1', name: 'Domain 1', description: 'Desc 1', weight: 0.27 }],
    }),
  };

  const mockProgressService = {
    getOverallProgress: () =>
      signal({
        ccafAttempts: 0,
        ccafBestScore: 0,
        totalExams: 0,
        tracksStarted: 0,
        tracksCompleted: 0,
        averageScore: 0,
      }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CCAFHomeComponent],
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
    const fixture = TestBed.createComponent(CCAFHomeComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should start in loading state', () => {
    const fixture = TestBed.createComponent(CCAFHomeComponent);
    expect(fixture.componentInstance.loading()).toBe(true);
  });

  it('should set loading to false after ngOnInit', () => {
    const fixture = TestBed.createComponent(CCAFHomeComponent);
    fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('should compute domain weight percent correctly', () => {
    const fixture = TestBed.createComponent(CCAFHomeComponent);
    expect(
      fixture.componentInstance.domainWeightPercent({
        code: 'D1',
        name: 'Test',
        description: '',
        weight: 0.27,
      } as any),
    ).toBe(27);
    expect(
      fixture.componentInstance.domainWeightPercent({
        code: 'D2',
        name: 'Test',
        description: '',
        weight: 27,
      } as any),
    ).toBe(27);
  });
});
