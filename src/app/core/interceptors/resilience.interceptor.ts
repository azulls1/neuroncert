import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, retry, timeout, throwError, timer } from 'rxjs';
import { LoggingService } from '../services/logging.service';

const DEFAULT_TIMEOUT = 15000; // 15 seconds
const MAX_RETRIES = 2;

export const resilienceInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const logger = inject(LoggingService);

  return next(req).pipe(
    timeout(DEFAULT_TIMEOUT),
    retry({
      count: MAX_RETRIES,
      delay: (error, retryCount) => {
        if (error instanceof HttpErrorResponse && error.status >= 400 && error.status < 500) {
          // Don't retry client errors (4xx)
          return throwError(() => error);
        }
        const delayMs = Math.pow(2, retryCount) * 500; // Exponential backoff: 500ms, 1s, 2s
        logger.warn(`HTTP retry ${retryCount}/${MAX_RETRIES} in ${delayMs}ms`, 'ResilienceInterceptor');
        return timer(delayMs);
      }
    }),
    catchError((error) => {
      if (error.name === 'TimeoutError') {
        logger.error(`Request timeout after ${DEFAULT_TIMEOUT}ms: ${req.url}`, 'ResilienceInterceptor');
      } else if (error instanceof HttpErrorResponse) {
        logger.error(`HTTP ${error.status}: ${req.url}`, 'ResilienceInterceptor', error.message);
      }
      return throwError(() => error);
    })
  );
};
