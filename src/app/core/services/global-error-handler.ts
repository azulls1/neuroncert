import { ErrorHandler, Injectable, inject } from '@angular/core';
import { LoggingService } from './logging.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private logger = inject(LoggingService);

  handleError(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    this.logger.error(message, 'GlobalErrorHandler', error);
  }
}
