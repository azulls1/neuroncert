import { Component, DestroyRef, inject, signal, computed, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
    <div class="flex flex-col gap-4">
      @if (loading()) {
        <div class="card text-center py-12">
          <div class="loading-dots mx-auto"><span></span><span></span><span></span></div>
          <p class="text-pine mt-4">Cargando certificaciones...</p>
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
        <div class="card-hero gradient-dark dark-surface py-5 px-4 text-center">
          <h1 class="font-display text-[clamp(1.1rem,3.5vw,1.5rem)] font-bold text-on-dark m-0 mb-2.5">
            {{ totalCerts() }}+ Certificados &middot; {{ platformCount() }} Plataformas
          </h1>
          <div class="flex flex-wrap gap-3 justify-center text-xs">
            <span class="text-on-dark-muted"
              ><strong class="font-mono text-on-dark">{{ totalCerts() }}</strong>
              disponibles</span
            >
            <span class="text-on-dark-muted"
              ><strong class="font-mono text-on-dark">{{ totalWithUpcoming() }}</strong>
              con proximas</span
            >
            <a routerLink="/ccaf" class="text-moss underline">Practicar CCA-F</a>
          </div>
        </div>

        <!-- CCA-F + Resources in 2 cols -->
        @if (ccafCert(); as cert) {
          <div class="grid-2">
            <div class="card-feature cert-border-gold">
              <div class="flex items-center flex-wrap gap-2 mb-1.5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="#C9A227" stroke-width="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span class="font-display text-sm font-bold text-forest">{{ cert.name }}</span>
                <span class="badge badge-info font-mono text-[9px]">CCA-F</span>
              </div>
              <p class="text-xs text-gray-500 mb-2 leading-snug">
                {{ cert.format }} &middot; {{ cert.passingScore }} &middot; {{ cert.price }}
              </p>
              @if (cert.domains?.length) {
                @for (domain of cert.domains; track domain.name) {
                  <div class="cert-row">
                    <span>{{ domain.name }}</span>
                    <span class="font-mono">{{ domain.weight }}%</span>
                  </div>
                }
              }
              <div class="mt-2.5">
                <a routerLink="/ccaf" class="btn btn-primary text-xs py-1 px-3">Practicar</a>
              </div>
            </div>
            <div class="card-feature">
              <h2 class="font-display text-sm font-bold text-forest mb-2">Recursos y Preparacion</h2>
              @if (cert.studyResources?.length) {
                @for (resource of cert.studyResources; track resource.name) {
                  <a
                    [href]="resource.url"
                    target="_blank"
                    rel="noopener"
                    class="cert-row cert-row--link"
                    >{{ resource.name }} <span>&#8599;</span></a
                  >
                }
              }
              @if (cert.recommendedPrep?.length) {
                <div class="divider-subtle my-2 pt-2">
                  @for (step of cert.recommendedPrep; track step; let i = $index) {
                    <div class="cert-row">
                      <span class="font-mono font-bold text-forest">{{ i + 1 }}</span>
                      <span>{{ step }}</span>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        }

        <!-- ALL PLATFORMS uniform grid -->
        <div class="grid-features">
          @if (getPlatform('academy'); as p) {
            <div class="card-feature" [style.border-left]="'4px solid ' + (p.color || '#2D5A3D')">
              <div class="flex items-center flex-wrap gap-2 mb-1.5">
                <span class="font-display text-sm font-bold text-forest">{{ p.name }}</span>
                <span class="badge text-[9px]">{{ countCourses(p) }} certs &middot; {{ p.pricing }}</span>
              </div>
              <p class="text-xs text-gray-500 mb-2 leading-snug">{{ p.description }}</p>
              @for (layer of p.layers || []; track layer.id) {
                <div class="card-stat__label mt-1.5 mb-0.5">{{ layer.name }}</div>
                <div class="flex flex-wrap gap-1 mb-1">
                  @for (c of layer.courses; track c.id) {
                    <span class="tag text-[10px]">{{ c.title }}</span>
                  }
                </div>
              }
              @if (p.url) {
                <a [href]="p.url" target="_blank" class="text-xs font-semibold text-forest mt-2 no-underline hover:underline inline-block">Visitar &#8599;</a>
              }
            </div>
          }
          @if (getPlatform('coursera'); as p) {
            <div class="card-feature" [style.border-left]="'4px solid ' + (p.color || '#0056D2')">
              <div class="flex items-center flex-wrap gap-2 mb-1.5">
                <span class="font-display text-sm font-bold text-forest">{{ p.name }}</span>
                <span class="badge text-[9px]">{{ countCourses(p) }} certs</span>
              </div>
              <p class="text-xs text-gray-500 mb-2 leading-snug">{{ p.description }}</p>
              @for (spec of p.specializations || []; track spec.id) {
                <div class="card-stat__label mt-1.5 mb-0.5">{{ spec.title }}</div>
                <div class="flex flex-wrap gap-1 mb-1">
                  @for (c of spec.courses; track c.id) {
                    <span class="tag text-[10px]">{{ c.title }}</span>
                  }
                </div>
              }
              @if (p.individualCourses?.length) {
                <div class="card-stat__label mt-1.5 mb-0.5">Individuales</div>
                <div class="flex flex-wrap gap-1 mb-1">
                  @for (c of p.individualCourses; track c.id) {
                    <span class="tag text-[10px]">{{ c.title }}</span>
                  }
                </div>
              }
              @if (p.url) {
                <a [href]="p.url" target="_blank" class="text-xs font-semibold text-forest mt-2 no-underline hover:underline inline-block">Visitar &#8599;</a>
              }
            </div>
          }
          @if (getPlatform('deeplearning-ai'); as p) {
            <div class="card-feature" [style.border-left]="'4px solid ' + (p.color || '#FF6F00')">
              <div class="flex items-center flex-wrap gap-2 mb-1.5">
                <span class="font-display text-sm font-bold text-forest">{{ p.name }}</span>
                <span class="badge text-[9px]">{{ countCourses(p) }} certs &middot; {{ p.pricing }}</span>
              </div>
              <p class="text-xs text-gray-500 mb-2 leading-snug">{{ p.description }}</p>
              <div class="flex flex-wrap gap-1 mb-1">
                @for (c of p.courses || []; track c.id) {
                  <span class="tag text-[10px]">{{ c.title }}</span>
                }
              </div>
              @if (p.url) {
                <a [href]="p.url" target="_blank" class="text-xs font-semibold text-forest mt-2 no-underline hover:underline inline-block">Visitar &#8599;</a>
              }
            </div>
          }
          @if (getPlatform('third-party'); as p) {
            <div class="card-feature" [style.border-left]="'4px solid ' + (p.color || '#6B7280')">
              <div class="flex items-center flex-wrap gap-2 mb-1.5">
                <span class="font-display text-sm font-bold text-forest">{{ p.name }}</span>
              </div>
              <p class="text-xs text-gray-500 mb-2 leading-snug">{{ p.description }}</p>
              <div class="flex flex-wrap gap-1 mb-1">
                @for (c of p.courses || []; track c.id) {
                  <span class="tag text-[10px]">{{ c.title }}</span>
                }
              </div>
            </div>
          }
          @if (upcomingCerts().length) {
            <div class="card-feature opacity-80" style="border-left: 4px solid #9CA3AF;">
              <div class="flex items-center flex-wrap gap-2 mb-1.5">
                <span class="font-display text-sm font-bold text-gray-500">Proximamente</span>
                <span class="badge text-[9px]">{{ upcomingCerts().length }}</span>
              </div>
              @for (cert of upcomingCerts(); track cert.id) {
                <div class="cert-row">
                  <span class="font-semibold">{{ cert.name }}</span>
                </div>
                <p class="text-xs text-gray-500 mb-2 leading-snug">{{ cert.focus }}</p>
              }
            </div>
          }
        </div>

        <!-- SUMMARIES side by side -->
        <div class="grid-2">
          @if (certSummaryTypes().length) {
            <div class="card-feature">
              <h2 class="font-display text-sm font-bold text-forest mb-2.5">
                Resumen de Certificaciones
              </h2>
              @for (row of certSummaryTypes(); track row.type) {
                <div class="cert-row">
                  <span>{{ row.type }}</span>
                  <span class="font-mono font-bold text-base">{{ row.count }}</span>
                  <span class="font-mono text-[11px] text-moss">{{ row.price }}</span>
                </div>
              }
            </div>
          }
          @if (summaryPlatforms().length) {
            <div class="card-feature">
              <h2 class="font-display text-sm font-bold text-forest mb-2.5">Resumen por Plataforma</h2>
              @for (row of summaryPlatforms(); track row.name) {
                <div class="cert-row">
                  <span>{{ row.name }}</span>
                  <span class="font-mono text-[11px]"
                    >{{ row.courses }} cursos &middot; {{ row.certs }} certs</span
                  >
                  <span class="font-mono text-[11px] text-moss">{{ row.price }}</span>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .cert-border-gold {
        border-left: 4px solid #C9A227;
      }
      .cert-row {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 10px;
        background: var(--color-bg-muted, #F7F8F7);
        border-radius: 6px;
        font-size: 12px;
        color: var(--color-text-accent, #5B7065);
        margin-bottom: 4px;
      }
      .cert-row span:first-child {
        flex: 1;
      }
      .cert-row--link {
        text-decoration: none;
        color: var(--color-text-primary, #04202C);
        cursor: pointer;
        transition: background var(--duration-fast) ease;
      }
      .cert-row--link:hover {
        background: var(--color-bg-hover, #EFF2F0);
      }
    `,
  ],
})
export class CertificationsComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private http = inject(HttpClient);

  loading = signal(true);
  error = signal<string | null>(null);

  private roadmap = signal<RoadmapData | null>(null);

  // Dynamic cert counts from data
  totalCerts = computed(() => {
    const data = this.roadmap();
    return (
      data?.certifications?.certSummary?.totalAvailableNow ??
      data?.summary?.totalCertificatesNumber ??
      0
    );
  });
  totalWithUpcoming = computed(() => {
    const data = this.roadmap();
    return (
      data?.certifications?.certSummary?.totalWithUpcoming ??
      this.totalCerts() + (data?.certifications?.upcoming?.length ?? 0)
    );
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
    return data?.platforms?.find((p) => p.id === id) ?? null;
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
    this.http
      .get<RoadmapData>('/assets/question-bank/roadmap.json')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.roadmap.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(
            'Error al cargar los datos de certificaciones. Por favor intenta de nuevo.',
          );
          this.loading.set(false);
        },
      });
  }
}
