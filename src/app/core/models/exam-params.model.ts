import { ContentType, ExamMode, LearningLevelNumber } from './content-type.model';

export type ExamDifficulty = 'any' | 'easy' | 'medium' | 'hard';

export interface ExamParams {
  domains: string[];
  count: number;
  difficulty: ExamDifficulty;
  durationSec?: number;

  /** Modo de examen */
  mode: ExamMode;

  /** Track asociado */
  trackId?: string;

  /** Nivel de aprendizaje */
  learningLevel?: LearningLevelNumber;

  /** Tipo de contenido */
  contentType?: ContentType;

  /** Numero de escenarios (para CCA-F) */
  scenarioCount?: number;
}
