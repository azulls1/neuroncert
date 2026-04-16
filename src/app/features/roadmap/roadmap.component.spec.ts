import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { of } from 'rxjs';
import { RoadmapComponent } from './roadmap.component';
import { CurriculumService } from '../../core/services/curriculum.service';

describe('RoadmapComponent', () => {
  const mockCurriculumService = {
    loadCatalog: () => of({ tracks: [], levels: [] }),
    getCCAFConfig: () => null,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoadmapComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CurriculumService, useValue: mockCurriculumService },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(RoadmapComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should start with no levels and no error', () => {
    const fixture = TestBed.createComponent(RoadmapComponent);
    expect(fixture.componentInstance.levels()).toEqual([]);
    expect(fixture.componentInstance.loadError()).toBeNull();
  });

  it('should have image modal closed by default', () => {
    const fixture = TestBed.createComponent(RoadmapComponent);
    expect(fixture.componentInstance.showImageModal()).toBe(false);
    expect(fixture.componentInstance.showCertModal()).toBe(false);
  });

  it('should toggle role selection', () => {
    const fixture = TestBed.createComponent(RoadmapComponent);
    fixture.componentInstance.toggleRole('dev');
    expect(fixture.componentInstance.selectedRole()).toBe('dev');
    fixture.componentInstance.toggleRole('dev');
    expect(fixture.componentInstance.selectedRole()).toBeNull();
  });
});
