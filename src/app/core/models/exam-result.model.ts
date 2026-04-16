import { ExamMode } from './content-type.model';

export interface ExamItemResult {
  questionId: string;
  isCorrect: boolean;
  explanation: string;
  domainCode: string;
  selectedOptionId: string;
  correctOptionId?: string;
  timeSpent?: number;
  flagged?: boolean;
}

export interface ExamSummary {
  correct: number;
  incorrect: number;
  skipped: number;
  flagged: number;
  scorePercentage: number;
  totalTimeSpent: number;
  timeLimit: number;
  totalQuestions?: number;
}

/**
 * Score por dominio (para CCA-F weighted scoring)
 */
export interface DomainScore {
  domainCode: string;
  domainName: string;
  weight: number;
  correct: number;
  total: number;
  rawPercentage: number;
  weightedContribution: number;
}

export interface ExamResult {
  examId: string;
  score: number;
  summary: ExamSummary;
  items: ExamItemResult[];
  recommendations: string[];
  completedAt: Date;
  domains: string[];
  averageDifficulty: 'easy' | 'medium' | 'hard';

  /** Score ponderado CCA-F (escala 0-1000) */
  weightedScore?: number;

  /** Pass/fail para CCA-F (>= 720) */
  passed?: boolean;

  /** Breakdown por dominio */
  domainScores?: DomainScore[];

  /** Modo del examen */
  mode?: ExamMode;
}
