import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CurriculumService } from './curriculum.service';
import { QuestionLoaderService } from './question-loader.service';
import { of } from 'rxjs';
import { Catalog, LearningTrack, LearningLevel, CCAFConfig } from '../models';

function makeTrack(overrides: Partial<LearningTrack> = {}): LearningTrack {
  return {
    id: overrides.id ?? 'track-1',
    title: overrides.title ?? 'Track Title',
    description: overrides.description ?? 'Track description',
    platform: overrides.platform ?? 'academy',
    level: overrides.level ?? 1,
    modules: overrides.modules ?? [],
    contentTypes: overrides.contentTypes ?? ['theory'],
    estimatedHours: overrides.estimatedHours ?? 10,
    tags: overrides.tags ?? ['ai', 'claude'],
    order: overrides.order ?? 1,
    ...overrides,
  };
}

function makeLevel(overrides: Partial<LearningLevel> = {}): LearningLevel {
  return {
    level: overrides.level ?? 1,
    name: overrides.name ?? 'Foundation',
    description: overrides.description ?? 'Beginner level',
    icon: overrides.icon ?? 'school',
    color: overrides.color ?? '#blue',
    ...overrides,
  };
}

function makeCatalog(overrides: Partial<Catalog> = {}): Catalog {
  return {
    version: '1.0',
    lastUpdated: '2026-01-01',
    levels: overrides.levels ?? [makeLevel()],
    tracks: overrides.tracks ?? [makeTrack()],
    ccafConfig: overrides.ccafConfig ?? {
      totalQuestions: 60,
      durationSec: 7200,
      passingScore: 720,
      maxScore: 1000,
      scenarioCount: 0,
      scenarioPool: [],
      domains: [
        {
          code: 'D1',
          name: 'Domain 1',
          weight: 0.5,
          questionBankFile: 'ccaf/d1.json',
          description: 'First domain',
          totalQuestions: 30,
        },
      ],
    },
  };
}

describe('CurriculumService', () => {
  let service: CurriculumService;
  let loaderSpy: jasmine.SpyObj<QuestionLoaderService>;

  beforeEach(() => {
    loaderSpy = jasmine.createSpyObj('QuestionLoaderService', ['loadCatalog']);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        CurriculumService,
        { provide: QuestionLoaderService, useValue: loaderSpy },
      ],
    });

    service = TestBed.inject(CurriculumService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ---------------------------------------------------------------------------
  // loadCatalog()
  // ---------------------------------------------------------------------------

  describe('loadCatalog()', () => {
    it('should set tracks and levels signals after loading', () => {
      const tracks = [makeTrack({ id: 't1' }), makeTrack({ id: 't2' })];
      const levels = [makeLevel({ level: 1 }), makeLevel({ level: 2 })];
      const catalog = makeCatalog({ tracks, levels });

      loaderSpy.loadCatalog.and.returnValue(of(catalog));

      service.loadCatalog().subscribe();

      expect(service.getTracks()()).toEqual(tracks);
      expect(service.getLevels()()).toEqual(levels);
    });

    it('should default tracks to empty array when catalog.tracks is undefined', () => {
      const catalog = makeCatalog();
      (catalog as any).tracks = undefined;

      loaderSpy.loadCatalog.and.returnValue(of(catalog));

      service.loadCatalog().subscribe();

      expect(service.getTracks()()).toEqual([]);
    });

    it('should default levels to empty array when catalog.levels is undefined', () => {
      const catalog = makeCatalog();
      (catalog as any).levels = undefined;

      loaderSpy.loadCatalog.and.returnValue(of(catalog));

      service.loadCatalog().subscribe();

      expect(service.getLevels()()).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // getTrackById()
  // ---------------------------------------------------------------------------

  describe('getTrackById()', () => {
    it('should return the correct track by ID', () => {
      const tracks = [makeTrack({ id: 'alpha' }), makeTrack({ id: 'beta' })];
      loaderSpy.loadCatalog.and.returnValue(of(makeCatalog({ tracks })));
      service.loadCatalog().subscribe();

      const result = service.getTrackById('beta');
      expect(result).toBeTruthy();
      expect(result!.id).toBe('beta');
    });

    it('should return undefined for non-existent ID', () => {
      loaderSpy.loadCatalog.and.returnValue(of(makeCatalog({ tracks: [] })));
      service.loadCatalog().subscribe();

      expect(service.getTrackById('nonexistent')).toBeUndefined();
    });

    it('should return undefined when catalog not loaded', () => {
      expect(service.getTrackById('anything')).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // getTracksByLevel()
  // ---------------------------------------------------------------------------

  describe('getTracksByLevel()', () => {
    it('should filter tracks by level', () => {
      const tracks = [
        makeTrack({ id: 't1', level: 1 }),
        makeTrack({ id: 't2', level: 2 }),
        makeTrack({ id: 't3', level: 1 }),
      ];
      loaderSpy.loadCatalog.and.returnValue(of(makeCatalog({ tracks })));
      service.loadCatalog().subscribe();

      const result = service.getTracksByLevel(1);
      expect(result.length).toBe(2);
      expect(result.every((t) => t.level === 1)).toBeTrue();
    });

    it('should return empty array when no tracks match the level', () => {
      loaderSpy.loadCatalog.and.returnValue(
        of(makeCatalog({ tracks: [makeTrack({ level: 3 })] })),
      );
      service.loadCatalog().subscribe();

      expect(service.getTracksByLevel(7)).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // getTracksByPlatform()
  // ---------------------------------------------------------------------------

  describe('getTracksByPlatform()', () => {
    it('should filter tracks by platform', () => {
      const tracks = [
        makeTrack({ id: 't1', platform: 'academy' }),
        makeTrack({ id: 't2', platform: 'coursera' }),
        makeTrack({ id: 't3', platform: 'academy' }),
      ];
      loaderSpy.loadCatalog.and.returnValue(of(makeCatalog({ tracks })));
      service.loadCatalog().subscribe();

      const result = service.getTracksByPlatform('academy');
      expect(result.length).toBe(2);
      expect(result.every((t) => t.platform === 'academy')).toBeTrue();
    });

    it('should return empty array when no tracks match the platform', () => {
      loaderSpy.loadCatalog.and.returnValue(
        of(makeCatalog({ tracks: [makeTrack({ platform: 'academy' })] })),
      );
      service.loadCatalog().subscribe();

      expect(service.getTracksByPlatform('cca-f')).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // searchTracks()
  // ---------------------------------------------------------------------------

  describe('searchTracks()', () => {
    beforeEach(() => {
      const tracks = [
        makeTrack({
          id: 't1',
          title: 'Claude Fundamentals',
          description: 'Learn the basics',
          tags: ['ai', 'beginner'],
        }),
        makeTrack({
          id: 't2',
          title: 'Advanced Prompting',
          description: 'Master prompt engineering',
          tags: ['prompts', 'advanced'],
        }),
        makeTrack({
          id: 't3',
          title: 'API Integration',
          description: 'Connect Claude to your apps',
          tags: ['api', 'sdk'],
        }),
      ];
      loaderSpy.loadCatalog.and.returnValue(of(makeCatalog({ tracks })));
      service.loadCatalog().subscribe();
    });

    it('should match by title (case-insensitive)', () => {
      const results = service.searchTracks('fundamentals');
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('t1');
    });

    it('should match by description (case-insensitive)', () => {
      const results = service.searchTracks('prompt engineering');
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('t2');
    });

    it('should match by tags', () => {
      const results = service.searchTracks('sdk');
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('t3');
    });

    it('should return all tracks when query is empty', () => {
      expect(service.searchTracks('').length).toBe(3);
    });

    it('should return all tracks when query is whitespace only', () => {
      expect(service.searchTracks('   ').length).toBe(3);
    });

    it('should return empty array when no matches', () => {
      expect(service.searchTracks('nonexistent-query-xyz')).toEqual([]);
    });

    it('should handle tracks without tags', () => {
      const tracks = [
        makeTrack({ id: 'no-tags', title: 'No Tags Track', description: 'desc', tags: undefined as any }),
      ];
      loaderSpy.loadCatalog.and.returnValue(of(makeCatalog({ tracks })));
      service.loadCatalog().subscribe();

      // Should not throw and should match by title
      const results = service.searchTracks('No Tags');
      expect(results.length).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // getCCAFConfig()
  // ---------------------------------------------------------------------------

  describe('getCCAFConfig()', () => {
    it('should return null when catalog is not loaded', () => {
      expect(service.getCCAFConfig()).toBeNull();
    });

    it('should return the CCA-F config after catalog is loaded', () => {
      const ccafConfig: CCAFConfig = {
        totalQuestions: 60,
        durationSec: 7200,
        passingScore: 720,
        maxScore: 1000,
        scenarioCount: 0,
        scenarioPool: [],
        domains: [],
      };
      loaderSpy.loadCatalog.and.returnValue(of(makeCatalog({ ccafConfig })));
      service.loadCatalog().subscribe();

      const result = service.getCCAFConfig();
      expect(result).toBeTruthy();
      expect(result!.passingScore).toBe(720);
      expect(result!.totalQuestions).toBe(60);
    });

    it('should return null when catalog has no ccafConfig', () => {
      const catalog = makeCatalog();
      (catalog as any).ccafConfig = undefined;

      loaderSpy.loadCatalog.and.returnValue(of(catalog));
      service.loadCatalog().subscribe();

      expect(service.getCCAFConfig()).toBeNull();
    });
  });
});
