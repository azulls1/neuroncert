import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { CertificationsComponent } from './certifications.component';

describe('CertificationsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CertificationsComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(CertificationsComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should start in loading state', () => {
    const fixture = TestBed.createComponent(CertificationsComponent);
    expect(fixture.componentInstance.loading()).toBe(true);
    expect(fixture.componentInstance.error()).toBeNull();
  });

  it('should compute countCourses from platform with direct courses', () => {
    const fixture = TestBed.createComponent(CertificationsComponent);
    const count = fixture.componentInstance.countCourses({
      id: 'test',
      name: 'Test',
      courses: [{ id: 'c1', title: 'C1' }, { id: 'c2', title: 'C2' }],
    } as any);
    expect(count).toBe(2);
  });
});
