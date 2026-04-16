/**
 * Funciones utilitarias puras para el simulador de examen.
 * Centraliza logica reutilizada en multiples servicios y componentes.
 */

/**
 * Formatea segundos en formato mm:ss
 * @param seconds Segundos a formatear
 */
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Mezcla un array usando el algoritmo Fisher-Yates.
 * Retorna un nuevo array sin mutar el original.
 * @param array Array a mezclar
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Obtiene la etiqueta de la opcion (A, B, C, D, ...) a partir de su orden.
 * @param order Orden numerico de la opcion (1-based)
 */
export function getOptionLabel(order?: number): string {
  if (!order) return '';
  return String.fromCharCode(64 + order); // A=65, B=66, etc.
}

/**
 * Obtiene la etiqueta de dificultad en espanol.
 * @param difficulty Clave de dificultad (easy, medium, hard)
 */
export function getDifficultyLabel(difficulty: string): string {
  const labels: Record<string, string> = {
    easy: 'Facil',
    medium: 'Medio',
    hard: 'Dificil'
  };
  return labels[difficulty] || difficulty;
}
