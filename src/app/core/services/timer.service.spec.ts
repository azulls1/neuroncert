import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TimerService } from './timer.service';

describe('TimerService', () => {
  let service: TimerService;

  beforeEach(() => {
    jasmine.clock().install();

    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    service = TestBed.inject(TimerService);
  });

  afterEach(() => {
    service.stop();
    jasmine.clock().uninstall();
  });

  // -------------------------------------------------------------------------
  // Creacion
  // -------------------------------------------------------------------------

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with default state (not running, not paused, 0 seconds)', () => {
    expect(service.isRunning()).toBeFalse();
    expect(service.isPaused()).toBeFalse();
    expect(service.remainingSeconds()).toBe(0);
    expect(service.totalSeconds()).toBe(0);
  });

  // -------------------------------------------------------------------------
  // start()
  // -------------------------------------------------------------------------

  describe('start()', () => {
    it('should set isRunning to true', () => {
      service.start(60);
      expect(service.isRunning()).toBeTrue();
      expect(service.isPaused()).toBeFalse();
    });

    it('should set totalSeconds and remainingSeconds', () => {
      service.start(120);
      expect(service.totalSeconds()).toBe(120);
      expect(service.remainingSeconds()).toBe(120);
    });

    it('should not restart if already running', () => {
      service.start(120);
      jasmine.clock().tick(2000);
      // Try starting again while already running
      service.start(999);
      // Should keep the original timer, not reset to 999
      expect(service.totalSeconds()).toBe(120);
      expect(service.remainingSeconds()).toBe(118);
    });

    it('should emit the initial value via remainingTime$', () => {
      let emitted = -1;
      const sub = service.remainingTime$.subscribe((v) => (emitted = v));

      service.start(90);
      expect(emitted).toBe(90);

      sub.unsubscribe();
    });
  });

  // -------------------------------------------------------------------------
  // Timer decrementa cada segundo
  // -------------------------------------------------------------------------

  describe('countdown', () => {
    it('should decrement remainingSeconds every second', () => {
      service.start(10);

      jasmine.clock().tick(1000);
      expect(service.remainingSeconds()).toBe(9);

      jasmine.clock().tick(1000);
      expect(service.remainingSeconds()).toBe(8);

      jasmine.clock().tick(3000);
      expect(service.remainingSeconds()).toBe(5);
    });

    it('should emit decremented values through remainingTime$', () => {
      const values: number[] = [];
      const sub = service.remainingTime$.subscribe((v) => values.push(v));

      service.start(5);
      jasmine.clock().tick(3000);

      // Initial BehaviorSubject(0), then start emits 5, then 3 ticks: 4, 3, 2
      expect(values).toEqual([0, 5, 4, 3, 2]);

      sub.unsubscribe();
    });
  });

  // -------------------------------------------------------------------------
  // pause() / resume()
  // -------------------------------------------------------------------------

  describe('pause()', () => {
    it('should set isPaused to true', () => {
      service.start(60);
      service.pause();
      expect(service.isPaused()).toBeTrue();
      expect(service.isRunning()).toBeTrue();
    });

    it('should stop decrementing when paused', () => {
      service.start(60);
      jasmine.clock().tick(2000);
      expect(service.remainingSeconds()).toBe(58);

      service.pause();
      jasmine.clock().tick(5000); // 5 seconds pass while paused
      expect(service.remainingSeconds()).toBe(58); // Should not have changed
    });

    it('should do nothing if not running', () => {
      service.pause();
      expect(service.isPaused()).toBeFalse();
    });

    it('should do nothing if already paused', () => {
      service.start(60);
      service.pause();
      expect(service.isPaused()).toBeTrue();
      service.pause(); // second call should be a no-op
      expect(service.isPaused()).toBeTrue();
    });
  });

  describe('resume()', () => {
    it('should set isPaused to false and continue decrementing', () => {
      service.start(60);
      jasmine.clock().tick(2000);
      expect(service.remainingSeconds()).toBe(58);

      service.pause();
      jasmine.clock().tick(3000);
      expect(service.remainingSeconds()).toBe(58);

      service.resume();
      expect(service.isPaused()).toBeFalse();

      jasmine.clock().tick(2000);
      expect(service.remainingSeconds()).toBe(56);
    });

    it('should do nothing if not running', () => {
      service.resume();
      expect(service.isPaused()).toBeFalse();
    });

    it('should do nothing if not paused', () => {
      service.start(60);
      service.resume(); // not paused, should be no-op
      expect(service.isPaused()).toBeFalse();
    });
  });

  // -------------------------------------------------------------------------
  // stop()
  // -------------------------------------------------------------------------

  describe('stop()', () => {
    it('should set isRunning and isPaused to false', () => {
      service.start(60);
      service.pause();
      service.stop();

      expect(service.isRunning()).toBeFalse();
      expect(service.isPaused()).toBeFalse();
    });

    it('should stop the countdown', () => {
      service.start(60);
      jasmine.clock().tick(2000);
      const remaining = service.remainingSeconds();

      service.stop();
      jasmine.clock().tick(5000);
      // Should not have changed after stop
      expect(service.remainingSeconds()).toBe(remaining);
    });
  });

  // -------------------------------------------------------------------------
  // reset()
  // -------------------------------------------------------------------------

  describe('reset()', () => {
    it('should stop and restore remainingSeconds to totalSeconds', () => {
      service.start(60);
      jasmine.clock().tick(5000);
      expect(service.remainingSeconds()).toBe(55);

      service.reset();
      expect(service.isRunning()).toBeFalse();
      expect(service.remainingSeconds()).toBe(60);
      expect(service.totalSeconds()).toBe(60);
    });

    it('should emit the reset value via remainingTime$', () => {
      let emitted = -1;
      const sub = service.remainingTime$.subscribe((v) => (emitted = v));

      service.start(100);
      jasmine.clock().tick(3000);
      service.reset();
      expect(emitted).toBe(100);

      sub.unsubscribe();
    });
  });

  // -------------------------------------------------------------------------
  // onTimeUp callback
  // -------------------------------------------------------------------------

  describe('onTimeUp', () => {
    it('should call onTimeUp when timer reaches 0', () => {
      const onTimeUp = jasmine.createSpy('onTimeUp');
      service.start(3, onTimeUp);

      jasmine.clock().tick(3000);

      expect(onTimeUp).toHaveBeenCalledTimes(1);
      expect(service.isRunning()).toBeFalse();
      expect(service.remainingSeconds()).toBe(0);
    });

    it('should stop the timer when it reaches 0', () => {
      service.start(2);
      jasmine.clock().tick(2000);

      expect(service.isRunning()).toBeFalse();
      expect(service.remainingSeconds()).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // onWarning callback
  // -------------------------------------------------------------------------

  describe('onWarning', () => {
    it('should call onWarning when remaining time equals the warning threshold (300s)', () => {
      const onWarning = jasmine.createSpy('onWarning');
      // Start with 302 seconds so that after 2 ticks remaining = 300
      service.start(302, undefined, onWarning);

      jasmine.clock().tick(2000);
      expect(onWarning).toHaveBeenCalledTimes(1);
      expect(service.remainingSeconds()).toBe(300);
    });

    it('should NOT call onWarning at other times', () => {
      const onWarning = jasmine.createSpy('onWarning');
      service.start(310, undefined, onWarning);

      jasmine.clock().tick(5000);
      expect(onWarning).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // formatTime()
  // -------------------------------------------------------------------------

  describe('formatTime()', () => {
    it('should format 0 seconds as "00:00"', () => {
      expect(service.formatTime(0)).toBe('00:00');
    });

    it('should format 61 seconds as "01:01"', () => {
      expect(service.formatTime(61)).toBe('01:01');
    });

    it('should format 3600 seconds as "60:00"', () => {
      expect(service.formatTime(3600)).toBe('60:00');
    });

    it('should format 5 seconds as "00:05"', () => {
      expect(service.formatTime(5)).toBe('00:05');
    });

    it('should format 599 seconds as "09:59"', () => {
      expect(service.formatTime(599)).toBe('09:59');
    });

    it('should format 7200 seconds as "120:00"', () => {
      expect(service.formatTime(7200)).toBe('120:00');
    });
  });

  // -------------------------------------------------------------------------
  // parseTime()
  // -------------------------------------------------------------------------

  describe('parseTime()', () => {
    it('should parse "00:00" as 0', () => {
      expect(service.parseTime('00:00')).toBe(0);
    });

    it('should parse "01:30" as 90', () => {
      expect(service.parseTime('01:30')).toBe(90);
    });

    it('should parse "10:00" as 600', () => {
      expect(service.parseTime('10:00')).toBe(600);
    });

    it('should be the inverse of formatTime for round-trip values', () => {
      const seconds = 754;
      const formatted = service.formatTime(seconds);
      expect(service.parseTime(formatted)).toBe(seconds);
    });
  });

  // -------------------------------------------------------------------------
  // formattedTime (computed signal)
  // -------------------------------------------------------------------------

  describe('formattedTime', () => {
    it('should return formatted time based on remainingSeconds', () => {
      service.start(90);
      const formatted = service.formattedTime;
      expect(formatted()).toBe('01:30');

      jasmine.clock().tick(5000);
      expect(formatted()).toBe('01:25');
    });
  });

  // -------------------------------------------------------------------------
  // progressPercentage (computed signal)
  // -------------------------------------------------------------------------

  describe('progressPercentage', () => {
    it('should return 0 when totalSeconds is 0', () => {
      const pct = service.progressPercentage;
      expect(pct()).toBe(0);
    });

    it('should return elapsed percentage', () => {
      service.start(100);
      jasmine.clock().tick(25000);
      const pct = service.progressPercentage;
      expect(pct()).toBe(25);
    });
  });

  // -------------------------------------------------------------------------
  // addTime()
  // -------------------------------------------------------------------------

  describe('addTime()', () => {
    it('should add seconds to the remaining time', () => {
      service.start(60);
      jasmine.clock().tick(5000);
      expect(service.remainingSeconds()).toBe(55);

      service.addTime(10);
      expect(service.remainingSeconds()).toBe(65);
    });

    it('should not go below 0', () => {
      service.start(10);
      jasmine.clock().tick(5000);
      service.addTime(-100);
      expect(service.remainingSeconds()).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // getTimeRemainingText()
  // -------------------------------------------------------------------------

  describe('getTimeRemainingText()', () => {
    it('should return hours format for >= 60 minutes', () => {
      service.start(3660); // 61 minutes
      expect(service.getTimeRemainingText()).toBe('1h 1m');
    });

    it('should return minutes format for < 60 minutes', () => {
      service.start(125);
      expect(service.getTimeRemainingText()).toBe('2m 5s');
    });

    it('should return seconds only when < 1 minute', () => {
      service.start(45);
      expect(service.getTimeRemainingText()).toBe('45s');
    });
  });

  // -------------------------------------------------------------------------
  // isTimeRunningLow()
  // -------------------------------------------------------------------------

  describe('isTimeRunningLow()', () => {
    it('should return true when remaining <= 300', () => {
      service.start(300);
      expect(service.isTimeRunningLow()).toBeTrue();
    });

    it('should return false when remaining > 300', () => {
      service.start(600);
      expect(service.isTimeRunningLow()).toBeFalse();
    });
  });

  // -------------------------------------------------------------------------
  // getState()
  // -------------------------------------------------------------------------

  describe('getState()', () => {
    it('should return the full state object', () => {
      service.start(120);
      jasmine.clock().tick(10000);
      service.pause();

      const state = service.getState();
      expect(state.isRunning).toBeTrue();
      expect(state.isPaused).toBeTrue();
      expect(state.remainingSeconds).toBe(110);
      expect(state.totalSeconds).toBe(120);
      expect(state.formattedTime).toBe('01:50');
      expect(state.progressPercentage).toBe(8); // (10/120)*100 rounded
    });
  });
});
