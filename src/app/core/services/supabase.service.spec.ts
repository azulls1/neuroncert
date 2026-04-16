import { provideZonelessChangeDetection, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SupabaseService } from './supabase.service';
import { DeviceIdService } from './device-id.service';

describe('SupabaseService', () => {
  let service: SupabaseService;
  let deviceIdSpy: jasmine.SpyObj<DeviceIdService>;

  // -------------------------------------------------------------------------
  // Browser environment
  // -------------------------------------------------------------------------

  describe('browser environment', () => {
    beforeEach(() => {
      deviceIdSpy = jasmine.createSpyObj('DeviceIdService', ['getDeviceId']);
      deviceIdSpy.getDeviceId.and.returnValue('test-device-id');

      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          SupabaseService,
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: DeviceIdService, useValue: deviceIdSpy },
        ],
      });

      service = TestBed.inject(SupabaseService);
    });

    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should start with connected signal as false', () => {
      expect(service.connected()).toBeFalse();
    });

    it('should start with lastError signal as null', () => {
      expect(service.lastError()).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // SSR environment (non-browser)
  // -------------------------------------------------------------------------

  describe('SSR environment', () => {
    beforeEach(() => {
      deviceIdSpy = jasmine.createSpyObj('DeviceIdService', ['getDeviceId']);
      deviceIdSpy.getDeviceId.and.returnValue('ssr-placeholder');

      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          SupabaseService,
          { provide: PLATFORM_ID, useValue: 'server' },
          { provide: DeviceIdService, useValue: deviceIdSpy },
        ],
      });

      service = TestBed.inject(SupabaseService);
    });

    it('should be created in SSR', () => {
      expect(service).toBeTruthy();
    });

    it('saveExamResult should return null in SSR', async () => {
      const result = await service.saveExamResult({
        examId: 'test',
        score: 80,
        summary: {
          correct: 8,
          incorrect: 2,
          skipped: 0,
          flagged: 0,
          scorePercentage: 80,
          totalTimeSpent: 100,
          timeLimit: 5400,
        },
        items: [],
        recommendations: [],
        completedAt: new Date(),
        domains: [],
        averageDifficulty: 'medium',
      } as any);

      expect(result).toBeNull();
    });

    it('getExamHistory should return empty array in SSR', async () => {
      const result = await service.getExamHistory();
      expect(result).toEqual([]);
    });

    it('saveProgress should return null in SSR', async () => {
      const result = await service.saveProgress('track-1', {});
      expect(result).toBeNull();
    });

    it('getProgress should return empty array in SSR', async () => {
      const result = await service.getProgress();
      expect(result).toEqual([]);
    });

    it('getLeaderboard should return empty array in SSR', async () => {
      const result = await service.getLeaderboard();
      expect(result).toEqual([]);
    });

    it('saveStudySession should return null in SSR', async () => {
      const result = await service.saveStudySession({
        sessionId: 's1',
        trackId: 'track-1',
        contentType: 'exam',
        questionsAnswered: 10,
        correctAnswers: 8,
        durationSec: 600,
        startedAt: new Date().toISOString(),
      });
      expect(result).toBeNull();
    });

    it('validateExamAnswers should return null in SSR', async () => {
      const result = await service.validateExamAnswers('exam-1', [], {});
      expect(result).toBeNull();
    });

    it('getClient should return null in SSR', async () => {
      const result = await service.getClient();
      expect(result).toBeNull();
    });

    it('getProgress with specific trackId should return empty array in SSR', async () => {
      const result = await service.getProgress('specific-track');
      expect(result).toEqual([]);
    });

    it('connected signal should be false in SSR', () => {
      expect(service.connected()).toBeFalse();
    });
  });
});
