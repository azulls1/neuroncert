import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ExamStateService } from '../services/exam-state.service';
import { LoggingService } from '../services/logging.service';

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
  const logger = inject(LoggingService);
  const status = examState.status();

  logger.debug(`status=${status}`, 'ExamRunGuard');

  if (status === 'running' || status === 'paused') {
    return true;
  }

  if (status === 'submitted' || status === 'completed') {
    const resultsRoute = getResultsRoute(examState);
    logger.debug(`Examen ya enviado, redirigiendo a ${resultsRoute}`, 'ExamRunGuard');
    return router.createUrlTree([resultsRoute]);
  }

  // idle o cualquier otro estado
  logger.debug('No hay examen iniciado, redirigiendo a /exam/start', 'ExamRunGuard');
  return router.createUrlTree(['/exam/start']);
};

/**
 * Functional guard para proteger la ruta /exam/submit
 * Verifica que el examen este en estado 'running' o 'paused'
 */
export const examSubmitGuard: CanActivateFn = () => {
  const examState = inject(ExamStateService);
  const router = inject(Router);
  const logger = inject(LoggingService);
  const status = examState.status();

  logger.debug(`status=${status}`, 'ExamSubmitGuard');

  if (status === 'running' || status === 'paused') {
    return true;
  }

  if (status === 'submitted' || status === 'completed') {
    const resultsRoute = getResultsRoute(examState);
    logger.debug(`Examen ya enviado, redirigiendo a ${resultsRoute}`, 'ExamSubmitGuard');
    return router.createUrlTree([resultsRoute]);
  }

  logger.debug('No hay examen iniciado, redirigiendo a /exam/start', 'ExamSubmitGuard');
  return router.createUrlTree(['/exam/start']);
};

/**
 * Functional guard para proteger la ruta /exam/review
 * Verifica que el examen este en estado 'completed' o 'submitted'
 */
export const examReviewGuard: CanActivateFn = () => {
  const examState = inject(ExamStateService);
  const router = inject(Router);
  const logger = inject(LoggingService);
  const status = examState.status();

  logger.debug(`status=${status}`, 'ExamReviewGuard');

  if (status === 'completed' || status === 'submitted') {
    return true;
  }

  if (status === 'running' || status === 'paused') {
    logger.debug('Examen aun en progreso, redirigiendo a /exam/run', 'ExamReviewGuard');
    return router.createUrlTree(['/exam/run']);
  }

  logger.debug('No hay examen completado, redirigiendo a /', 'ExamReviewGuard');
  return router.createUrlTree(['/']);
};

/**
 * Functional guard para proteger la ruta /exam/results
 * Verifica que exista un resultado de examen
 */
export const examResultsGuard: CanActivateFn = () => {
  const examState = inject(ExamStateService);
  const router = inject(Router);
  const logger = inject(LoggingService);
  const result = examState.examResult();

  logger.debug(`hasResult=${!!result}`, 'ExamResultsGuard');

  if (result) {
    return true;
  }

  logger.debug('No hay resultado, redirigiendo a /exam/start', 'ExamResultsGuard');
  return router.createUrlTree(['/exam/start']);
};

/**
 * Functional guard para proteger la ruta /ccaf/results
 * Verifica que exista un resultado de examen CCA-F (con domainScores)
 */
export const ccafResultsGuard: CanActivateFn = () => {
  const examState = inject(ExamStateService);
  const router = inject(Router);
  const logger = inject(LoggingService);
  const result = examState.examResult();

  logger.debug(
    `hasResult=${!!result}, hasDomainScores=${!!result?.domainScores}`,
    'CCAFResultsGuard',
  );

  if (result && result.domainScores) {
    return true;
  }

  logger.debug('No hay resultado CCA-F, redirigiendo a /ccaf', 'CCAFResultsGuard');
  return router.createUrlTree(['/ccaf']);
};
