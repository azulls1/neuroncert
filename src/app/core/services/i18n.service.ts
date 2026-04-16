import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Lang = 'es' | 'en';

const TRANSLATIONS: Record<Lang, Record<string, string>> = {
  es: {
    'nav.home': 'Inicio',
    'nav.tracks': 'Tracks',
    'nav.roadmap': 'Roadmap',
    'nav.certs': 'Certs',
    'exam.start': 'Iniciar Examen',
    'exam.submit': 'Enviar Examen',
    'exam.review': 'Revisar Respuestas',
    'exam.resume': 'Continuar Examen',
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.back': 'Volver',
    'common.next': 'Siguiente',
    'common.previous': 'Anterior',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'offline.banner': 'Sin conexion a internet — los datos se guardaran localmente',
    'dashboard.welcome': 'Que te gustaria hacer?',
    'dashboard.resume': 'Tienes un examen sin terminar.',
    '404.title': 'Pagina no encontrada',
    '404.subtitle': 'La ruta que buscas no existe o fue movida.',
    '404.back': 'Volver al Inicio',
  },
  en: {
    'nav.home': 'Home',
    'nav.tracks': 'Tracks',
    'nav.roadmap': 'Roadmap',
    'nav.certs': 'Certs',
    'exam.start': 'Start Exam',
    'exam.submit': 'Submit Exam',
    'exam.review': 'Review Answers',
    'exam.resume': 'Resume Exam',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'offline.banner': 'No internet connection — data will be saved locally',
    'dashboard.welcome': 'What would you like to do?',
    'dashboard.resume': 'You have an unfinished exam.',
    '404.title': 'Page not found',
    '404.subtitle': 'The page you are looking for does not exist or has been moved.',
    '404.back': 'Back to Home',
  },
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  private platformId = inject(PLATFORM_ID);
  private _lang = signal<Lang>('es');
  readonly lang = this._lang.asReadonly();

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;
    const saved = localStorage.getItem('app_lang') as Lang | null;
    if (saved && (saved === 'es' || saved === 'en')) {
      this._lang.set(saved);
    }
  }

  setLang(lang: Lang): void {
    this._lang.set(lang);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('app_lang', lang);
    }
  }

  t(key: string): string {
    return TRANSLATIONS[this._lang()]?.[key] ?? key;
  }
}
