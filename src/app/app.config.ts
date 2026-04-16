import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { routes } from './app.routes';

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
    provideBrowserGlobalErrorListeners(),

    // Zoneless change detection para mejor rendimiento
    provideZonelessChangeDetection(),

    // Router con navegación bloqueante para evitar parpadeos
    provideRouter(routes, withEnabledBlockingInitialNavigation()),

    // HttpClient para llamadas a APIs (usado en DataSourceService)
    provideHttpClient(withInterceptorsFromDi()),

    // Client hydration para Server-Side Rendering con event replay
    provideClientHydration(withEventReplay())
  ]
};
