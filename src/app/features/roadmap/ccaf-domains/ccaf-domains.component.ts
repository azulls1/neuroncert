import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ConfigService } from '../../../core/services/config.service';

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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <h2 class="font-display text-xl font-bold text-forest mb-2">
            CCA-F — Arquitecto Certificado Claude: Fundamentos
          </h2>
          <p class="text-[0.8125rem] text-pine mb-4">{{ format() }}</p>

          <div class="grid-stats mb-5">
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

          <h3 class="font-display text-sm font-bold text-forest mb-3">
            Dominios del Examen
          </h3>
          @for (domain of domains(); track domain.name) {
            <div class="mb-3.5">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[0.8125rem] text-forest font-semibold">{{ domain.name }}</span>
                <span class="badge badge-info font-mono">{{ domain.weight }}%</span>
              </div>
              <div class="progress progress--sm mb-1.5">
                <div class="progress__bar" [style.width.%]="domain.weight * 3.7"></div>
              </div>
              <div class="flex flex-wrap gap-1">
                @for (topic of domain.topics; track topic) {
                  <span class="tag font-mono text-[10px]">{{ topic }}</span>
                }
              </div>
            </div>
          }

          <div class="divider my-5"></div>

          <h3 class="font-display text-sm font-bold text-forest mb-2.5">
            Recursos de Estudio
          </h3>
          <div class="flex flex-col gap-2 mb-5">
            @for (res of studyResources(); track res.name) {
              <a
                [href]="res.url"
                target="_blank"
                rel="noopener"
                class="card-compact hover-lift cursor-pointer no-underline flex items-center gap-2"
              >
                <span class="text-[0.8125rem] text-forest">{{ res.name }}</span>
                <span class="text-pine ml-auto text-xs">&#8599;</span>
              </a>
            }
          </div>

          <div class="flex gap-3">
            <a routerLink="/ccaf" class="btn btn-cta" (click)="close.emit()">Practicar CCA-F</a>
            <a [href]="certUrl()" target="_blank" rel="noopener" class="btn btn-secondary"
              >Info oficial &#8599;</a
            >
          </div>
        </div>
      </div>
    }
  `,
  styles: [],
})
export class CCAFDomainsComponent {
  private readonly config = inject(ConfigService);

  domains = input<CertDomain[]>([]);
  totalQuestions = input(this.config.ccafQuestionCount);
  durationMin = input(Math.round(this.config.ccafDurationSec / 60));
  passingScore = input(this.config.ccafPassingScore);
  maxScore = input(this.config.ccafMaxScore);
  format = input('');
  studyResources = input<StudyResource[]>([]);
  certUrl = input('');
  visible = input(false);
  close = output();
}
