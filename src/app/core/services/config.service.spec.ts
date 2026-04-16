import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ConfigService } from './config.service';
import { environment } from '../../../environments/environment';

describe('ConfigService', () => {
  let service: ConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    service = TestBed.inject(ConfigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  // App info
  // -------------------------------------------------------------------------

  describe('app info', () => {
    it('should return appName from environment', () => {
      expect(service.appName).toBe(environment.APP_NAME);
    });

    it('should return appVersion from environment', () => {
      expect(service.appVersion).toBe(environment.APP_VERSION);
    });
  });

  // -------------------------------------------------------------------------
  // Paths
  // -------------------------------------------------------------------------

  describe('paths', () => {
    it('should return catalogPath from environment', () => {
      expect(service.catalogPath).toBe(environment.CATALOG_PATH);
    });
  });

  // -------------------------------------------------------------------------
  // Exam defaults
  // -------------------------------------------------------------------------

  describe('exam defaults', () => {
    it('should return DEFAULT_QUESTIONS_COUNT', () => {
      expect(service.defaultQuestionsCount).toBe(environment.DEFAULT_QUESTIONS_COUNT);
      expect(service.defaultQuestionsCount).toBe(30);
    });

    it('should return DEFAULT_DURATION_SEC', () => {
      expect(service.defaultDurationSec).toBe(environment.DEFAULT_DURATION_SEC);
      expect(service.defaultDurationSec).toBe(2700);
    });
  });

  // -------------------------------------------------------------------------
  // CCA-F defaults
  // -------------------------------------------------------------------------

  describe('CCA-F defaults', () => {
    it('should return CCAF_QUESTIONS as 60', () => {
      expect(service.ccafQuestionCount).toBe(60);
    });

    it('should return CCAF_DURATION_SEC as 7200 (2 hours)', () => {
      expect(service.ccafDurationSec).toBe(7200);
    });

    it('should return CCAF_PASSING_SCORE as 720', () => {
      expect(service.ccafPassingScore).toBe(720);
    });
  });

  // -------------------------------------------------------------------------
  // Storage keys
  // -------------------------------------------------------------------------

  describe('storageKeys', () => {
    it('should return the full storageKeys object', () => {
      const keys = service.storageKeys;
      expect(keys.EXAM_STATE).toBe('exam_state');
      expect(keys.USER_PREFERENCES).toBe('user_preferences');
      expect(keys.EXAM_RESULTS).toBe('exam_results');
      expect(keys.EXAM_PROGRESS).toBe('exam_progress');
      expect(keys.LAST_RESULTS).toBe('last_results');
      expect(keys.LEARNING_PROGRESS).toBe('claude_learning_progress');
    });
  });

  // -------------------------------------------------------------------------
  // Accessibility
  // -------------------------------------------------------------------------

  describe('accessibility', () => {
    it('should return accessibility config object', () => {
      const a11y = service.accessibility;
      expect(a11y).toBeTruthy();
      expect(a11y.KEYBOARD_NAVIGATION).toBeDefined();
      expect(a11y.FOCUS_TIMEOUT).toBeDefined();
      expect(a11y.ANNOUNCE_DELAY).toBeDefined();
    });

    it('should return isKeyboardNavigationEnabled as true', () => {
      expect(service.isKeyboardNavigationEnabled).toBeTrue();
    });

    it('should return focusTimeout as 100', () => {
      expect(service.focusTimeout).toBe(100);
    });

    it('should return announceDelay as 500', () => {
      expect(service.announceDelay).toBe(500);
    });
  });

  // -------------------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------------------

  describe('validation', () => {
    it('should return validation config object', () => {
      const v = service.validation;
      expect(v).toBeTruthy();
      expect(v.MIN_QUESTIONS).toBeDefined();
      expect(v.MAX_QUESTIONS).toBeDefined();
    });

    it('should return minQuestions as 1', () => {
      expect(service.minQuestions).toBe(1);
    });

    it('should return maxQuestions as 200', () => {
      expect(service.maxQuestions).toBe(200);
    });
  });

  // -------------------------------------------------------------------------
  // isValidQuestionsCount()
  // -------------------------------------------------------------------------

  describe('isValidQuestionsCount()', () => {
    it('should return true for count within range', () => {
      expect(service.isValidQuestionsCount(1)).toBeTrue();
      expect(service.isValidQuestionsCount(100)).toBeTrue();
      expect(service.isValidQuestionsCount(200)).toBeTrue();
    });

    it('should return false for count below minimum', () => {
      expect(service.isValidQuestionsCount(0)).toBeFalse();
      expect(service.isValidQuestionsCount(-1)).toBeFalse();
    });

    it('should return false for count above maximum', () => {
      expect(service.isValidQuestionsCount(201)).toBeFalse();
      expect(service.isValidQuestionsCount(999)).toBeFalse();
    });
  });
});
