import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ExamStateService } from '../services/exam-state.service';

/**
 * Determina la ruta de resultados segun el modo del examen
 */
function getResultsRoute(examState: ExamStateService): string {
  const params = examState.examParams();
  if (params?.mode === 'ccaf') {
    return '/ccaf/results';
  }
  return '/exam/review';
}

/**
 * Functional guard para proteger la ruta /exam/run
 * Verifica que el examen este en estado 'running' o 'paused'
 */
export const examRunGuard: CanActivateFn = () => {
  const examState = inject(ExamStateService);
  const router = inject(Router);
  const status = examState.status();

  console.log(`[ExamRunGuard] status=${status}`);

  if (status === 'running' || status === 'paused') {
    return true;
  }

  if (status === 'submitted' || status === 'completed') {
    const resultsRoute = getResultsRoute(examState);
    console.log(`[ExamRunGuard] Examen ya enviado, redirigiendo a ${resultsRoute}`);
    return router.createUrlTree([resultsRoute]);
  }

  // idle o cualquier otro estado
  console.log('[ExamRunGuard] No hay examen iniciado, redirigiendo a /exam/start');
  return router.createUrlTree(['/exam/start']);
};

/**
 * Functional guard para proteger la ruta /exam/submit
 * Verifica que el examen este en estado 'running' o 'paused'
 */
export const examSubmitGuard: CanActivateFn = () => {
  const examState = inject(ExamStateService);
  const router = inject(Router);
  const status = examState.status();

  console.log(`[ExamSubmitGuard] status=${status}`);

  if (status === 'running' || status === 'paused') {
    return true;
  }

  if (status === 'submitted' || status === 'completed') {
    const resultsRoute = getResultsRoute(examState);
    console.log(`[ExamSubmitGuard] Examen ya enviado, redirigiendo a ${resultsRoute}`);
    return router.createUrlTree([resultsRoute]);
  }

  console.log('[ExamSubmitGuard] No hay examen iniciado, redirigiendo a /exam/start');
  return router.createUrlTree(['/exam/start']);
};

/**
 * Functional guard para proteger la ruta /exam/review
 * Verifica que el examen este en estado 'completed' o 'submitted'
 */
export const examReviewGuard: CanActivateFn = () => {
  const examState = inject(ExamStateService);
  const router = inject(Router);
  const status = examState.status();

  console.log(`[ExamReviewGuard] status=${status}`);

  if (status === 'completed' || status === 'submitted') {
    return true;
  }

  if (status === 'running' || status === 'paused') {
    console.log('[ExamReviewGuard] Examen aun en progreso, redirigiendo a /exam/run');
    return router.createUrlTree(['/exam/run']);
  }

  console.log('[ExamReviewGuard] No hay examen completado, redirigiendo a /');
  return router.createUrlTree(['/']);
};

/**
 * Functional guard para proteger la ruta /exam/results
 * Verifica que exista un resultado de examen
 */
export const examResultsGuard: CanActivateFn = () => {
  const examState = inject(ExamStateService);
  const router = inject(Router);
  const result = examState.examResult();

  console.log(`[ExamResultsGuard] hasResult=${!!result}`);

  if (result) {
    return true;
  }

  console.log('[ExamResultsGuard] No hay resultado, redirigiendo a /exam/start');
  return router.createUrlTree(['/exam/start']);
};

/**
 * Functional guard para proteger la ruta /ccaf/results
 * Verifica que exista un resultado de examen CCA-F (con domainScores)
 */
export const ccafResultsGuard: CanActivateFn = () => {
  const examState = inject(ExamStateService);
  const router = inject(Router);
  const result = examState.examResult();

  console.log(`[CCAFResultsGuard] hasResult=${!!result}, hasDomainScores=${!!(result?.domainScores)}`);

  if (result && result.domainScores) {
    return true;
  }

  console.log('[CCAFResultsGuard] No hay resultado CCA-F, redirigiendo a /ccaf');
  return router.createUrlTree(['/ccaf']);
};
