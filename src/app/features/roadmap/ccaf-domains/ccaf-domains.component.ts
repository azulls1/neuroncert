import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface CertDomain {
  name: string;
  weight: number;
  topics: string[];
}

interface StudyResource {
  name: string;
  url: string;
}

@Component({
  selector: 'app-ccaf-domains',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    @if (visible()) {
      <div class="modal-overlay" (click)="close.emit()">
        <div class="modal-card modal-wide animate-scaleIn" (click)="$event.stopPropagation()">
          <button class="modal-close btn btn-icon" (click)="close.emit()">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <h2
            class="font-display"
            style="font-size: 1.2rem; font-weight: 700; color: #04202C; margin: 0 0 8px;"
          >
            CCA-F — Arquitecto Certificado Claude: Fundamentos
          </h2>
          <p style="font-size: 0.8125rem; color: #5B7065; margin-bottom: 16px;">
            {{ format() }}
          </p>

          <div class="grid-stats" style="margin-bottom: 20px;">
            <div class="card-stat">
              <div class="card-stat__value">{{ totalQuestions() }}</div>
              <div class="card-stat__label">Preguntas</div>
            </div>
            <div class="card-stat">
              <div class="card-stat__value">{{ durationMin() }}</div>
              <div class="card-stat__label">Minutos</div>
            </div>
            <div class="card-stat">
              <div class="card-stat__value">{{ passingScore() }}</div>
              <div class="card-stat__label">/ {{ maxScore() }}</div>
            </div>
            <div class="card-stat">
              <div class="card-stat__value">$0-99</div>
              <div class="card-stat__label">Precio</div>
            </div>
          </div>

          <h3
            class="font-display"
            style="font-size: 0.875rem; font-weight: 700; color: #04202C; margin-bottom: 14px;"
          >
            Dominios del Examen
          </h3>
          @for (domain of domains(); track domain.name) {
            <div style="margin-bottom: 14px;">
              <div
                style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;"
              >
                <span style="font-size: 0.8125rem; color: #04202C; font-weight: 600;">{{
                  domain.name
                }}</span>
                <span class="badge badge-info font-mono">{{ domain.weight }}%</span>
              </div>
              <div class="progress progress--sm" style="margin-bottom: 6px;">
                <div class="progress__bar" [style.width.%]="domain.weight * 3.7"></div>
              </div>
              <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                @for (topic of domain.topics; track topic) {
                  <span class="tag font-mono" style="font-size: 10px;">{{ topic }}</span>
                }
              </div>
            </div>
          }

          <div class="divider" style="margin: 20px 0;"></div>

          <h3
            class="font-display"
            style="font-size: 0.875rem; font-weight: 700; color: #04202C; margin-bottom: 10px;"
          >
            Recursos de Estudio
          </h3>
          <div class="stack-sm" style="margin-bottom: 20px;">
            @for (res of studyResources(); track res.name) {
              <a
                [href]="res.url"
                target="_blank"
                rel="noopener"
                class="card-compact hover-lift"
                style="cursor: pointer; text-decoration: none; display: flex; align-items: center; gap: 8px;"
              >
                <span style="font-size: 0.8125rem; color: #04202C;">{{ res.name }}</span>
                <span style="color: #5B7065; margin-left: auto; font-size: 12px;">&#8599;</span>
              </a>
            }
          </div>

          <div style="display: flex; gap: 12px;">
            <a routerLink="/ccaf" class="btn btn-cta" (click)="close.emit()">Practicar CCA-F</a>
            <a
              [href]="certUrl()"
              target="_blank"
              rel="noopener"
              class="btn btn-secondary"
              >Info oficial &#8599;</a
            >
          </div>
        </div>
      </div>
    }
  `,
  styles: [`:host { display: block; }`],
})
export class CCAFDomainsComponent {
  domains = input<CertDomain[]>([]);
  totalQuestions = input(60);
  durationMin = input(120);
  passingScore = input(720);
  maxScore = input(1000);
  format = input('');
  studyResources = input<StudyResource[]>([]);
  certUrl = input('');
  visible = input(false);
  close = output();
}
