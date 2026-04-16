import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ScoreService } from './score.service';
import { ConfigService } from './config.service';
import { ExamItemResult, DomainScore, CCAFDomain } from '../models';

describe('ScoreService', () => {
  let service: ScoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: ConfigService, useValue: { ccafPassingScore: 720 } },
      ],
    });
    service = TestBed.inject(ScoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  // calculateStandardScore()
  // -------------------------------------------------------------------------

  describe('calculateStandardScore()', () => {
    it('should return 0 when total is 0', () => {
      expect(service.calculateStandardScore(0, 0)).toBe(0);
    });

    it('should return 0 when total is negative', () => {
      expect(service.calculateStandardScore(5, -1)).toBe(0);
    });

    it('should return 100 when all correct', () => {
      expect(service.calculateStandardScore(30, 30)).toBe(100);
    });

    it('should return 0 when none correct', () => {
      expect(service.calculateStandardScore(0, 30)).toBe(0);
    });

    it('should round to nearest integer', () => {
      // 7/30 = 23.333...% -> 23
      expect(service.calculateStandardScore(7, 30)).toBe(23);
    });

    it('should calculate 50% correctly', () => {
      expect(service.calculateStandardScore(15, 30)).toBe(50);
    });

    it('should calculate a partial score correctly', () => {
      // 24/30 = 80%
      expect(service.calculateStandardScore(24, 30)).toBe(80);
    });
  });

  // -------------------------------------------------------------------------
  // calculateCCAFScore()
  // -------------------------------------------------------------------------

  describe('calculateCCAFScore()', () => {
    const domains: CCAFDomain[] = [
      {
        code: 'D1',
        name: 'Domain 1',
        weight: 0.3,
        questionBankFile: '',
        description: '',
        totalQuestions: 10,
      },
      {
        code: 'D2',
        name: 'Domain 2',
        weight: 0.25,
        questionBankFile: '',
        description: '',
        totalQuestions: 10,
      },
      {
        code: 'D3',
        name: 'Domain 3',
        weight: 0.2,
        questionBankFile: '',
        description: '',
        totalQuestions: 10,
      },
      {
        code: 'D4',
        name: 'Domain 4',
        weight: 0.15,
        questionBankFile: '',
        description: '',
        totalQuestions: 10,
      },
      {
        code: 'D5',
        name: 'Domain 5',
        weight: 0.1,
        questionBankFile: '',
        description: '',
        totalQuestions: 10,
      },
    ];

    function createItems(domainCode: string, correct: number, total: number): ExamItemResult[] {
      const items: ExamItemResult[] = [];
      for (let i = 0; i < total; i++) {
        items.push({
          questionId: `${domainCode}-q${i}`,
          isCorrect: i < correct,
          explanation: '',
          domainCode,
          selectedOptionId: 'opt-a',
          correctOptionId: 'opt-a',
        });
      }
      return items;
    }

    it('should return perfect score (1000) when all answers correct', () => {
      const items = [
        ...createItems('D1', 10, 10),
        ...createItems('D2', 10, 10),
        ...createItems('D3', 10, 10),
        ...createItems('D4', 10, 10),
        ...createItems('D5', 10, 10),
      ];

      const result = service.calculateCCAFScore(items, domains);

      expect(result.totalScore).toBe(1000);
      expect(result.passed).toBeTrue();
    });

    it('should return 0 when all answers wrong', () => {
      const items = [
        ...createItems('D1', 0, 10),
        ...createItems('D2', 0, 10),
        ...createItems('D3', 0, 10),
        ...createItems('D4', 0, 10),
        ...createItems('D5', 0, 10),
      ];

      const result = service.calculateCCAFScore(items, domains);

      expect(result.totalScore).toBe(0);
      expect(result.passed).toBeFalse();
    });

    it('should pass when totalScore >= 720', () => {
      // 80% in D1 (0.30): 0.80 * 0.30 * 1000 = 240
      // 70% in D2 (0.25): 0.70 * 0.25 * 1000 = 175
      // 80% in D3 (0.20): 0.80 * 0.20 * 1000 = 160
      // 70% in D4 (0.15): 0.70 * 0.15 * 1000 = 105
      // 70% in D5 (0.10): 0.70 * 0.10 * 1000 = 70
      // Total = 750 -> passed
      const items = [
        ...createItems('D1', 8, 10),
        ...createItems('D2', 7, 10),
        ...createItems('D3', 8, 10),
        ...createItems('D4', 7, 10),
        ...createItems('D5', 7, 10),
      ];

      const result = service.calculateCCAFScore(items, domains);

      expect(result.totalScore).toBe(750);
      expect(result.passed).toBeTrue();
    });

    it('should fail when totalScore < 720', () => {
      // 50% across all domains: 0.50 * 1.0 * 1000 = 500
      const items = [
        ...createItems('D1', 5, 10),
        ...createItems('D2', 5, 10),
        ...createItems('D3', 5, 10),
        ...createItems('D4', 5, 10),
        ...createItems('D5', 5, 10),
      ];

      const result = service.calculateCCAFScore(items, domains);

      expect(result.totalScore).toBe(500);
      expect(result.passed).toBeFalse();
    });

    it('should return correct domainScores for each domain', () => {
      const items = [
        ...createItems('D1', 9, 10),
        ...createItems('D2', 6, 10),
        ...createItems('D3', 10, 10),
        ...createItems('D4', 3, 10),
        ...createItems('D5', 0, 10),
      ];

      const result = service.calculateCCAFScore(items, domains);

      expect(result.domainScores.length).toBe(5);

      const d1 = result.domainScores.find((ds) => ds.domainCode === 'D1')!;
      expect(d1.correct).toBe(9);
      expect(d1.total).toBe(10);
      expect(d1.rawPercentage).toBe(90);
      // 0.90 * 0.30 * 1000 = 270
      expect(d1.weightedContribution).toBe(270);

      const d5 = result.domainScores.find((ds) => ds.domainCode === 'D5')!;
      expect(d5.correct).toBe(0);
      expect(d5.rawPercentage).toBe(0);
      expect(d5.weightedContribution).toBe(0);
    });

    it('should handle weighted scoring where domains differ in weight', () => {
      // 100% in the heaviest domain (0.30) but 0% everywhere else
      const items = [
        ...createItems('D1', 10, 10),
        ...createItems('D2', 0, 10),
        ...createItems('D3', 0, 10),
        ...createItems('D4', 0, 10),
        ...createItems('D5', 0, 10),
      ];

      const result = service.calculateCCAFScore(items, domains);

      // Only D1 contributes: 1.0 * 0.30 * 1000 = 300
      expect(result.totalScore).toBe(300);
      expect(result.passed).toBeFalse();
    });
  });

  // -------------------------------------------------------------------------
  // calculateDomainScores()
  // -------------------------------------------------------------------------

  describe('calculateDomainScores()', () => {
    it('should return empty domain score when no items match a domain', () => {
      const domains: CCAFDomain[] = [
        {
          code: 'DX',
          name: 'Domain X',
          weight: 0.5,
          questionBankFile: '',
          description: '',
          totalQuestions: 5,
        },
      ];

      const scores = service.calculateDomainScores([], domains);

      expect(scores.length).toBe(1);
      expect(scores[0].correct).toBe(0);
      expect(scores[0].total).toBe(0);
      expect(scores[0].rawPercentage).toBe(0);
      expect(scores[0].weightedContribution).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // generateRecommendations()
  // -------------------------------------------------------------------------

  describe('generateRecommendations()', () => {
    it('should return a recommendation for domains with rawPercentage < 70', () => {
      const domainScores: DomainScore[] = [
        {
          domainCode: 'D1',
          domainName: 'Domain 1',
          weight: 0.3,
          correct: 5,
          total: 10,
          rawPercentage: 50,
          weightedContribution: 150,
        },
        {
          domainCode: 'D2',
          domainName: 'Domain 2',
          weight: 0.2,
          correct: 8,
          total: 10,
          rawPercentage: 80,
          weightedContribution: 160,
        },
      ];

      const recs = service.generateRecommendations(domainScores);

      expect(recs.length).toBe(1);
      expect(recs[0]).toContain('Domain 1');
      expect(recs[0]).toContain('D1');
      expect(recs[0]).toContain('50%');
      expect(recs[0]).toContain('30%');
    });

    it('should sort recommendations by rawPercentage ascending (weakest first)', () => {
      const domainScores: DomainScore[] = [
        {
          domainCode: 'D1',
          domainName: 'Domain 1',
          weight: 0.3,
          correct: 6,
          total: 10,
          rawPercentage: 60,
          weightedContribution: 180,
        },
        {
          domainCode: 'D2',
          domainName: 'Domain 2',
          weight: 0.2,
          correct: 3,
          total: 10,
          rawPercentage: 30,
          weightedContribution: 60,
        },
        {
          domainCode: 'D3',
          domainName: 'Domain 3',
          weight: 0.25,
          correct: 4,
          total: 10,
          rawPercentage: 40,
          weightedContribution: 100,
        },
      ];

      const recs = service.generateRecommendations(domainScores);

      expect(recs.length).toBe(3);
      // Weakest first: D2 (30%) -> D3 (40%) -> D1 (60%)
      expect(recs[0]).toContain('Domain 2');
      expect(recs[1]).toContain('Domain 3');
      expect(recs[2]).toContain('Domain 1');
    });

    it('should return a positive message when all domains are >= 70%', () => {
      const domainScores: DomainScore[] = [
        {
          domainCode: 'D1',
          domainName: 'Domain 1',
          weight: 0.5,
          correct: 8,
          total: 10,
          rawPercentage: 80,
          weightedContribution: 400,
        },
        {
          domainCode: 'D2',
          domainName: 'Domain 2',
          weight: 0.5,
          correct: 9,
          total: 10,
          rawPercentage: 90,
          weightedContribution: 450,
        },
      ];

      const recs = service.generateRecommendations(domainScores);

      expect(recs.length).toBe(1);
      expect(recs[0]).toContain('Buen rendimiento');
    });

    it('should return a positive message when domainScores is empty', () => {
      const recs = service.generateRecommendations([]);
      expect(recs.length).toBe(1);
      expect(recs[0]).toContain('Buen rendimiento');
    });

    it('should not recommend domains exactly at 70%', () => {
      const domainScores: DomainScore[] = [
        {
          domainCode: 'D1',
          domainName: 'Domain 1',
          weight: 0.5,
          correct: 7,
          total: 10,
          rawPercentage: 70,
          weightedContribution: 350,
        },
      ];

      const recs = service.generateRecommendations(domainScores);

      expect(recs.length).toBe(1);
      expect(recs[0]).toContain('Buen rendimiento');
    });
  });
});
