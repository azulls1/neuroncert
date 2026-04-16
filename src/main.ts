import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

/**
 * Punto de entrada de la aplicación Angular 19
 * Bootstrap de la aplicación standalone con configuración optimizada
 */
bootstrapApplication(App, appConfig)
  .catch((err) => {
    console.error('Error al inicializar la aplicación:', err);
    // En producción, podrías enviar el error a un servicio de monitoreo
  });
