import { LearningLevelNumber } from './content-type.model';

export interface CurriculumProgress {
  trackId: string;
  completedModules: string[];
  theoryCompleted: boolean;
  practiceCompleted: boolean;
  examAttempts: number;
  bestExamScore: number;
  lastAccessedAt: string;
  totalTimeSpentSec: number;
}

export interface OverallProgress {
  tracksStarted: number;
  tracksCompleted: number;
  totalExamsTaken: number;
  averageScore: number;
  ccafBestScore: number;
  ccafAttempts: number;
  progressByLevel: Record<LearningLevelNumber, { total: number; completed: number }>;
  lastUpdated: string;
}
