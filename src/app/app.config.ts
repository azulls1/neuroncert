import {
  ApplicationConfig,
  ErrorHandler,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { resilienceInterceptor } from './core/interceptors/resilience.interceptor';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideServiceWorker } from '@angular/service-worker';
import { environment } from '../environments/environment';

import { routes } from './app.routes';
import { GlobalErrorHandler } from './core/services/global-error-handler';

/**
 * Configuración principal de la aplicación Angular 19
 * - Router con navegación bloqueante inicial para mejor UX
 * - HttpClient para llamadas a APIs (preparado para Fase 2)
 * - Client hydration para SSR
 * - Zoneless change detection para mejor rendimiento
 */
export const appConfig: ApplicationConfig = {
  providers: [
    // Manejo global de errores
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideBrowserGlobalErrorListeners(),

    // Zoneless change detection para mejor rendimiento
    provideZonelessChangeDetection(),

    // Router con navegación bloqueante para evitar parpadeos
    provideRouter(routes, withEnabledBlockingInitialNavigation()),

    // HttpClient para llamadas a APIs (usado en DataSourceService)
    provideHttpClient(withFetch(), withInterceptors([resilienceInterceptor])),

    // Client hydration para Server-Side Rendering con event replay
    provideClientHydration(withEventReplay()),

    // Service Worker para PWA offline support
    provideServiceWorker('ngsw-worker.js', {
      enabled: environment.production,
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
