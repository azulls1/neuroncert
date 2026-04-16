import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="stack-lg" style="text-align: center; padding: 80px 24px;">
      <h1 class="text-forest" style="font-size: 4rem; font-weight: 800;">404</h1>
      <p class="text-pine" style="font-size: 1.25rem;">{{ i18n.t('404.title') }}</p>
      <p class="text-pine">{{ i18n.t('404.subtitle') }}</p>
      <a routerLink="/" class="btn btn-primary" style="margin-top: 24px;">{{
        i18n.t('404.back')
      }}</a>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class NotFoundComponent {
  protected readonly i18n = inject(I18nService);
}
