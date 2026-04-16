import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="stack-lg" style="text-align: center; padding: 80px 24px;">
      <h1 class="text-forest" style="font-size: 4rem; font-weight: 800;">404</h1>
      <p class="text-pine" style="font-size: 1.25rem;">Pagina no encontrada</p>
      <p class="text-pine">La ruta que buscas no existe o fue movida.</p>
      <a routerLink="/" class="btn btn-primary" style="margin-top: 24px;">Volver al Inicio</a>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class NotFoundComponent {}
