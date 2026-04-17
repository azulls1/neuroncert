import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="empty-state animate-fadeInUp">
      <div class="empty-state__icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <h1 class="font-display text-6xl font-extrabold text-forest mb-4">404</h1>
      <p class="empty-state__title text-lg">{{ i18n.t('404.title') }}</p>
      <p class="empty-state__desc">{{ i18n.t('404.subtitle') }}</p>
      <a routerLink="/" class="btn btn-primary mt-6">{{ i18n.t('404.back') }}</a>
    </div>
  `,
  styles: [],
})
export class NotFoundComponent {
  protected readonly i18n = inject(I18nService);
}
