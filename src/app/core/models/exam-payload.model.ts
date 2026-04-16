/**
 * Payload para enviar respuestas del examen
 */
export interface ExamPayload {
  /** ID único del examen */
  examId: string;

  /** Respuestas del usuario */
  answers: ExamAnswer[];

  /** Timestamp de envío */
  submittedAt?: Date;

  /** Tiempo total empleado en segundos */
  totalTimeSpent?: number;
}

/**
 * Respuesta individual del usuario
 */
export interface ExamAnswer {
  /** ID de la pregunta */
  questionId: string;

  /** ID de la opción seleccionada */
  optionId: string;

  /** Si la pregunta estaba marcada para revisar */
  flagged?: boolean;

  /** Tiempo empleado en esta pregunta (segundos) */
  timeSpent?: number;
}
