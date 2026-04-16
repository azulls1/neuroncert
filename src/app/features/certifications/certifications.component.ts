import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface RoadmapCourse {
  id: string;
  title: string;
  [key: string]: unknown;
}

interface RoadmapLayer {
  id: string;
  name: string;
  courses: RoadmapCourse[];
}

interface RoadmapSpecialization {
  id: string;
  title: string;
  courses: RoadmapCourse[];
}

interface RoadmapPlatform {
  id: string;
  name: string;
  description?: string;
  url?: string;
  color?: string;
  pricing?: string;
  courses?: RoadmapCourse[];
  layers?: RoadmapLayer[];
  specializations?: RoadmapSpecialization[];
  individualCourses?: RoadmapCourse[];
}

interface CertificationEntry {
  id?: string;
  name: string;
  format?: string;
  passingScore?: string;
  price?: string;
  focus?: string;
  domains?: { name: string; weight: number }[];
  studyResources?: { name: string; url: string }[];
  recommendedPrep?: string[];
}

interface PartnerNetwork {
  name?: string;
  url?: string;
  [key: string]: unknown;
}

interface RoadmapData {
  title?: string;
  subtitle?: string;
  platforms: RoadmapPlatform[];
  certifications: {
    partnerNetwork: PartnerNetwork;
    available: CertificationEntry[];
    upcoming: CertificationEntry[];
    certSummary: {
      types: { type: string; count: string; price: string; linkedin: string }[];
      totalAvailableNow: number;
      totalWithUpcoming: number;
    };
  };
  summary: {
    totalCertificatesNumber?: number;
    platforms: { name: string; courses: string; price: string; certs: string }[];
  };
}

@Component({
  selector: 'app-certifications',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="cert-page">
      @if (loading()) {
        <div class="card" style="text-align: center; padding: 48px;">
          <p class="text-pine">Cargando certificaciones...</p>
        </div>
      } @else if (error()) {
        <div class="alert alert-warning">
          <div class="alert__content">
            <div class="alert__title">No se pudieron cargar los datos de certificaciones</div>
            <span>{{ error() }}</span>
          </div>
        </div>
      } @else {

        <!-- HERO compact -->
        <div class="card-hero gradient-dark dark-surface" style="padding: 20px 16px; text-align: center;">
          <h1 class="font-display" style="font-size: clamp(1.1rem, 3.5vw, 1.5rem); font-weight: 700; color: white; margin: 0 0 10px;">{{ totalCerts() }}+ Certificados &middot; {{ platformCount() }} Plataformas</h1>
          <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; font-size: 12px;">
            <span style="color: #C9D1C8;"><strong class="font-mono" style="color: white;">{{ totalCerts() }}</strong> disponibles</span>
            <span style="color: #C9D1C8;"><strong class="font-mono" style="color: white;">{{ totalWithUpcoming() }}</strong> con proximas</span>
            <a routerLink="/ccaf" style="color: #9EADA3; text-decoration: underline;">Practicar CCA-F</a>
          </div>
        </div>

        <!-- ============================================================ -->
        <!-- SECTION 1 — Formal Certification (CCA-F)                     -->
        <!-- ============================================================ -->
        <!-- CCA-F + Resources in 2 cols -->
        @if (ccafCert(); as cert) {
          <div class="cert-grid-2">
            <div class="cert-card" style="border-left: 4px solid #C9A227;">
              <div class="cert-card__header">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A227" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span class="cert-card__title">{{ cert.name }}</span>
                <span class="badge badge-info font-mono" style="font-size: 9px;">CCA-F</span>
              </div>
              <p class="cert-card__desc">{{ cert.format }} &middot; {{ cert.passingScore }} &middot; {{ cert.price }}</p>
              @if (cert.domains?.length) {
                @for (domain of cert.domains; track domain.name) {
                  <div class="cert-row"><span>{{ domain.name }}</span><span class="font-mono">{{ domain.weight }}%</span></div>
                }
              }
              <div style="margin-top: 10px;"><a routerLink="/ccaf" class="btn btn-primary" style="font-size: 12px; padding: 5px 12px;">Practicar</a></div>
            </div>
            <div class="cert-card">
              <div class="cert-card__title" style="margin-bottom: 8px;">Recursos y Preparacion</div>
              @if (cert.studyResources?.length) {
                @for (resource of cert.studyResources; track resource.name) {
                  <a [href]="resource.url" target="_blank" rel="noopener" class="cert-row cert-row--link">{{ resource.name }} <span>&#8599;</span></a>
                }
              }
              @if (cert.recommendedPrep?.length) {
                <div style="border-top: 1px solid #EFF2F0; margin: 8px 0; padding-top: 8px;">
                  @for (step of cert.recommendedPrep; track step; let i = $index) {
                    <div class="cert-row"><span class="font-mono" style="font-weight: 700; color: #04202C;">{{ i + 1 }}</span> <span>{{ step }}</span></div>
                  }
                </div>
              }
            </div>
          </div>
        }

        <!-- ALL PLATFORMS uniform grid -->
        <div class="cert-grid-3">
          @if (getPlatform('academy'); as p) {
            <div class="cert-card" [style.border-left]="'4px solid ' + (p.color || '#2D5A3D')">
              <div class="cert-card__header"><span class="cert-card__title">{{ p.name }}</span><span class="badge" style="font-size: 9px;">{{ countCourses(p) }} certs &middot; {{ p.pricing }}</span></div>
              <p class="cert-card__desc">{{ p.description }}</p>
              @for (layer of p.layers || []; track layer.id) {
                <div class="cert-layer">{{ layer.name }}</div>
                <div class="cert-tags">@for (c of layer.courses; track c.id) { <span class="cert-tag">{{ c.title }}</span> }</div>
              }
              @if (p.url) { <a [href]="p.url" target="_blank" class="cert-link">Visitar &#8599;</a> }
            </div>
          }
          @if (getPlatform('coursera'); as p) {
            <div class="cert-card" [style.border-left]="'4px solid ' + (p.color || '#0056D2')">
              <div class="cert-card__header"><span class="cert-card__title">{{ p.name }}</span><span class="badge" style="font-size: 9px;">{{ countCourses(p) }} certs</span></div>
              <p class="cert-card__desc">{{ p.description }}</p>
              @for (spec of p.specializations || []; track spec.id) {
                <div class="cert-layer">{{ spec.title }}</div>
                <div class="cert-tags">@for (c of spec.courses; track c.id) { <span class="cert-tag">{{ c.title }}</span> }</div>
              }
              @if (p.individualCourses?.length) {
                <div class="cert-layer">Individuales</div>
                <div class="cert-tags">@for (c of p.individualCourses; track c.id) { <span class="cert-tag">{{ c.title }}</span> }</div>
              }
              @if (p.url) { <a [href]="p.url" target="_blank" class="cert-link">Visitar &#8599;</a> }
            </div>
          }
          @if (getPlatform('deeplearning-ai'); as p) {
            <div class="cert-card" [style.border-left]="'4px solid ' + (p.color || '#FF6F00')">
              <div class="cert-card__header"><span class="cert-card__title">{{ p.name }}</span><span class="badge" style="font-size: 9px;">{{ countCourses(p) }} certs &middot; {{ p.pricing }}</span></div>
              <p class="cert-card__desc">{{ p.description }}</p>
              <div class="cert-tags">@for (c of p.courses || []; track c.id) { <span class="cert-tag">{{ c.title }}</span> }</div>
              @if (p.url) { <a [href]="p.url" target="_blank" class="cert-link">Visitar &#8599;</a> }
            </div>
          }
          @if (getPlatform('third-party'); as p) {
            <div class="cert-card" [style.border-left]="'4px solid ' + (p.color || '#6B7280')">
              <div class="cert-card__header"><span class="cert-card__title">{{ p.name }}</span></div>
              <p class="cert-card__desc">{{ p.description }}</p>
              <div class="cert-tags">@for (c of p.courses || []; track c.id) { <span class="cert-tag">{{ c.title }}</span> }</div>
            </div>
          }
          @if (upcomingCerts().length) {
            <div class="cert-card" style="border-left: 4px solid #9CA3AF; opacity: 0.8;">
              <div class="cert-card__header"><span class="cert-card__title" style="color: #6B7280;">Proximamente</span><span class="badge" style="font-size: 9px;">{{ upcomingCerts().length }}</span></div>
              @for (cert of upcomingCerts(); track cert.id) {
                <div class="cert-row"><span style="font-weight: 600;">{{ cert.name }}</span></div>
                <p class="cert-card__desc">{{ cert.focus }}</p>
              }
            </div>
          }
        </div>

        <!-- SUMMARIES side by side -->
        <div class="cert-grid-2">
          @if (certSummaryTypes().length) {
            <div class="cert-card">
              <div class="cert-card__title" style="margin-bottom: 10px;">Resumen de Certificaciones</div>
              @for (row of certSummaryTypes(); track row.type) {
                <div class="cert-row"><span>{{ row.type }}</span><span class="font-mono" style="font-weight: 700; font-size: 16px;">{{ row.count }}</span><span class="font-mono" style="font-size: 11px; color: #9EADA3;">{{ row.price }}</span></div>
              }
            </div>
          }
          @if (summaryPlatforms().length) {
            <div class="cert-card">
              <div class="cert-card__title" style="margin-bottom: 10px;">Resumen por Plataforma</div>
              @for (row of summaryPlatforms(); track row.name) {
                <div class="cert-row"><span>{{ row.name }}</span><span class="font-mono" style="font-size: 11px;">{{ row.courses }} cursos &middot; {{ row.certs }} certs</span><span class="font-mono" style="font-size: 11px; color: #9EADA3;">{{ row.price }}</span></div>
              }
            </div>
          }
        </div>

      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .cert-page { display: flex; flex-direction: column; gap: 16px; }

    /* 2-col grid */
    .cert-grid-2 { display: grid; grid-template-columns: 1fr; gap: 14px; }
    @media (min-width: 768px) { .cert-grid-2 { grid-template-columns: 1fr 1fr; } }

    /* 3-col grid */
    .cert-grid-3 { display: grid; grid-template-columns: 1fr; gap: 14px; }
    @media (min-width: 640px) { .cert-grid-3 { grid-template-columns: 1fr 1fr; } }
    @media (min-width: 1100px) { .cert-grid-3 { grid-template-columns: repeat(3, 1fr); } }

    /* Uniform card */
    .cert-card {
      background: white;
      border: 1px solid #EFF2F0;
      border-radius: 12px;
      padding: 16px;
      transition: box-shadow 0.2s;
    }
    .cert-card:hover { box-shadow: 0 4px 16px rgba(4,32,44,0.06); }

    .cert-card__header {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 6px;
    }
    .cert-card__title {
      font-family: 'Sora', sans-serif;
      font-size: 14px;
      font-weight: 700;
      color: #04202C;
    }
    .cert-card__desc {
      font-size: 12px;
      color: #7D8F84;
      margin: 0 0 8px;
      line-height: 1.4;
    }

    /* Compact row */
    .cert-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      background: #F7F9F8;
      border-radius: 6px;
      font-size: 12px;
      color: #5B7065;
      margin-bottom: 4px;
    }
    .cert-row span:first-child { flex: 1; }
    .cert-row--link {
      text-decoration: none;
      color: #04202C;
      cursor: pointer;
      transition: background 0.15s;
    }
    .cert-row--link:hover { background: #EFF2F0; }

    /* Layer label */
    .cert-layer {
      font-size: 11px;
      font-weight: 600;
      color: #7D8F84;
      margin: 6px 0 3px;
    }

    /* Tags */
    .cert-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 4px; }
    .cert-tag {
      font-size: 10px;
      padding: 3px 8px;
      background: #F7F9F8;
      border: 1px solid #EFF2F0;
      border-radius: 4px;
      color: #5B7065;
      white-space: nowrap;
    }

    /* Link */
    .cert-link {
      display: inline-block;
      font-size: 12px;
      color: #04202C;
      font-weight: 600;
      margin-top: 8px;
      text-decoration: none;
    }
    .cert-link:hover { text-decoration: underline; }

    /* ── Responsive ── */
    @media (max-width: 639px) {
      .cert-card { padding: 12px; }
      .cert-card__title { font-size: 13px; }
      .cert-card__desc { font-size: 11px; }
      .cert-card__header { gap: 6px; }
      .cert-row {
        flex-wrap: wrap;
        padding: 5px 8px;
        font-size: 11px;
        gap: 4px;
      }
      .cert-tag { font-size: 9px; padding: 2px 6px; }
      .cert-layer { font-size: 10px; }
    }

    @media (max-width: 479px) {
      .cert-page { gap: 10px; }
      .cert-grid-2, .cert-grid-3 { gap: 10px; }
      .cert-row span:first-child {
        min-width: 0;
        word-break: break-word;
      }
    }
  `]
})
export class CertificationsComponent implements OnInit {
  private http = inject(HttpClient);

  loading = signal(true);
  error = signal<string | null>(null);

  private roadmap = signal<RoadmapData | null>(null);

  // Dynamic cert counts from data
  totalCerts = computed(() => {
    const data = this.roadmap();
    return data?.certifications?.certSummary?.totalAvailableNow ?? data?.summary?.totalCertificatesNumber ?? 0;
  });
  totalWithUpcoming = computed(() => {
    const data = this.roadmap();
    return data?.certifications?.certSummary?.totalWithUpcoming ?? (this.totalCerts() + (data?.certifications?.upcoming?.length ?? 0));
  });
  platformCount = computed(() => {
    const data = this.roadmap();
    return data?.platforms?.length ?? 0;
  });
  roadmapSubtitle = computed(() => {
    const data = this.roadmap();
    return data?.subtitle ?? '';
  });

  // Derived data via computed signals
  ccafCert = computed(() => {
    const data = this.roadmap();
    return data?.certifications?.available?.[0] ?? null;
  });
  upcomingCerts = computed(() => {
    const data = this.roadmap();
    return data?.certifications?.upcoming ?? [];
  });
  certSummaryTypes = computed(() => {
    const data = this.roadmap();
    return data?.certifications?.certSummary?.types ?? [];
  });
  summaryPlatforms = computed(() => {
    const data = this.roadmap();
    return data?.summary?.platforms ?? [];
  });

  /** Find a platform by its id from the loaded roadmap data */
  getPlatform(id: string): RoadmapPlatform | null {
    const data = this.roadmap();
    return data?.platforms?.find(p => p.id === id) ?? null;
  }

  /** Count total courses across all structures of a platform (layers, specializations, individualCourses, direct courses) */
  countCourses(platform: RoadmapPlatform): number {
    if (!platform) return 0;
    let count = 0;

    // Direct courses array (deeplearning-ai, third-party, github)
    if (platform.courses?.length) {
      count += platform.courses.length;
    }

    // Layers with courses (academy)
    if (platform.layers?.length) {
      for (const layer of platform.layers) {
        count += layer.courses?.length ?? 0;
      }
    }

    // Specializations with nested courses (coursera)
    if (platform.specializations?.length) {
      for (const spec of platform.specializations) {
        count += spec.courses?.length ?? 0;
      }
    }

    // Individual courses (coursera)
    if (platform.individualCourses?.length) {
      count += platform.individualCourses.length;
    }

    return count;
  }

  ngOnInit(): void {
    this.http.get<RoadmapData>('/assets/question-bank/roadmap.json').subscribe({
      next: (data) => {
        this.roadmap.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar los datos de certificaciones. Por favor intenta de nuevo.');
        this.loading.set(false);
      }
    });
  }
}
