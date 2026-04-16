import { Injectable, signal } from '@angular/core';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  timestamp: Date;
  data?: unknown;
}

@Injectable({ providedIn: 'root' })
export class LoggingService {
  private _recentErrors = signal<LogEntry[]>([]);
  get recentErrors() {
    return this._recentErrors.asReadonly();
  }

  private isProduction = false; // Set from environment

  debug(message: string, context?: string, data?: unknown): void {
    if (!this.isProduction) {
      this.log('debug', message, context, data);
    }
  }

  info(message: string, context?: string, data?: unknown): void {
    this.log('info', message, context, data);
  }

  warn(message: string, context?: string, data?: unknown): void {
    this.log('warn', message, context, data);
  }

  error(message: string, context?: string, data?: unknown): void {
    this.log('error', message, context, data);
    const entry: LogEntry = { level: 'error', message, context, timestamp: new Date(), data };
    this._recentErrors.update((errors) => [...errors.slice(-19), entry]);
  }

  private log(level: LogLevel, message: string, context?: string, data?: unknown): void {
    const prefix = context ? `[${context}]` : '';
    const method = level === 'debug' ? 'log' : level;
    if (data) {
      console[method](`${prefix} ${message}`, data);
    } else {
      console[method](`${prefix} ${message}`);
    }
  }
}
