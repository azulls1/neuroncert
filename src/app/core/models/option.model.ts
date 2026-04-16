/**
 * Modelo de opción de respuesta
 * NO incluye is_correct para mantener la seguridad en el cliente
 */
export interface Option {
  /** Identificador único de la opción */
  id: string;

  /** Texto de la opción de respuesta */
  text: string;

  /** Texto en español (opcional, bilingüe) */
  textEs?: string;

  /** Orden de la opción (A, B, C, D) */
  order?: number;
}
