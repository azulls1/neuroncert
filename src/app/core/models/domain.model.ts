/**
 * Modelo de dominio/topic de conocimiento
 */
export interface Domain {
  code: string;
  name: string;
  description?: string;
  questionCount?: number;

  /** Peso para scoring ponderado (CCA-F: 0.0-1.0) */
  weight?: number;

  /** Track padre */
  parentTrackId?: string;

  /** Color Forest DS para UI */
  color?: string;
}
