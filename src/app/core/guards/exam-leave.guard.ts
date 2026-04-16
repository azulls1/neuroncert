import { CanDeactivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { ExamStateService } from '../services/exam-state.service';

/**
 * Functional guard que previene la salida accidental del examen.
 * Muestra un confirm dialog si el examen esta en progreso o pausado.
 */
export const examLeaveGuard: CanDeactivateFn<unknown> = () => {
  const examState = inject(ExamStateService);
  const status = examState.status();

  if (status === 'running' || status === 'paused') {
    return confirm('Tienes un examen en progreso. Si sales, perderas tu avance. ¿Estas seguro?');
  }
  return true;
};
