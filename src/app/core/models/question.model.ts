import { Option } from './option.model';
import { ContentType, LearningLevelNumber } from './content-type.model';

/**
 * Modelo de pregunta base
 * Incluye correctOptionId y explanation para validacion local
 */
export interface Question {
  id: string;
  text: string;
  textEs?: string;
  explanationEs?: string;
  domainCode: string;
  difficulty: 'easy' | 'medium' | 'hard';
  options: Option[];
  context?: string;
  references?: string[];

  /** ID de la opcion correcta (validacion local, sin backend) */
  correctOptionId: string;

  /** Explicacion de la respuesta correcta */
  explanation: string;

  /** Nivel de aprendizaje (1-7) */
  learningLevel: LearningLevelNumber;

  /** Tipo de contenido */
  contentType: ContentType;

  /** Track al que pertenece */
  trackId: string;

  /** Modulo opcional */
  moduleId?: string;

  /** Tags para filtrado */
  tags?: string[];

  /** ID de escenario (para CCA-F) */
  scenarioId?: string;
}

/**
 * Pregunta de examen con estado del usuario
 */
export interface ExamQuestion extends Omit<Question, 'correctOptionId'> {
  /** Stripped during exam to prevent cheating; only available during review */
  correctOptionId?: string;
  selectedOptionId?: string;
  flagged?: boolean;
  timeSpent?: number;
}
