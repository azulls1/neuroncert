import { Component, DestroyRef, OnInit, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { CurriculumService } from '../../core/services/curriculum.service';
import { CCAFDomainsComponent } from './ccaf-domains/ccaf-domains.component';
import { LoggingService } from '../../core/services/logging.service';
import { ConfigService } from '../../core/services/config.service';

/* ── Inline interfaces matching roadmap.json ─────────────────────────── */

interface RoadmapCourse {
  id: string;
  number?: number;
  title: string;
  description: string;
  url: string;
  level: number;
  duration?: string;
  topics: string[];
  audience?: string;
  prerequisites?: string[];
  certificate?: boolean;
  isNew?: boolean;
  flagship?: boolean;
  instructor?: string;
  stats?: { lectures: number; quizzes: number; hours: number };
}

interface RoadmapLayer {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  color: string;
  courses: RoadmapCourse[];
}

interface RoadmapPlatform {
  id: string;
  name: string;
  icon: string;
  color: string;
  url: string;
  description: string;
  pricing: string;
  layers?: RoadmapLayer[];
  courses?: RoadmapCourse[];
  specializations?: {
    id: string;
    title: string;
    description?: string;
    url?: string;
    audience: string;
    courses: RoadmapCourse[];
  }[];
  individualCourses?: RoadmapCourse[];
}

interface CertDomain {
  name: string;
  weight: number;
  topics: string[];
}

interface Certification {
  id: string;
  name: string;
  status: string;
  format?: string;
  passingScore?: string;
  price?: string;
  url?: string;
  domains?: CertDomain[];
  studyResources?: { name: string; url: string }[];
  recommendedPrep?: string[];
  prerequisite?: string;
  audience?: string;
  focus?: string;
  expectedDate?: string;
}

interface LearningPathLevel {
  level: number;
  name: string;
  hours?: string;
  courses: string[];
}

interface SummaryPlatform {
  name: string;
  courses: string;
  price: string;
}

interface RolePath {
  id: string;
  role: string;
  icon: string;
  description: string;
  courses: string[] | 'all';
  certCount: number;
  cost: string;
  formalCert?: string;
}

interface RoadmapData {
  platforms: RoadmapPlatform[];
  certifications: {
    partnerNetwork: {
      name: string;
      url: string;
      description: string;
      requirements: string[];
    };
    available: Certification[];
    upcoming: Certification[];
  };
  learningPath: LearningPathLevel[];
  summary: {
    totalCourses: string;
    totalCertificatesNumber?: number;
    totalCertifications: string;
    platforms: SummaryPlatform[];
  };
  rolePaths?: RolePath[];
}

/* ── Flow-specific interfaces ──────────────────────────────────────────── */

interface TreeCourse {
  id: string;
  title: string;
  description: string;
  url: string;
  level: number;
  duration?: string;
  topics: string[];
  audience?: string;
  prerequisites?: string[];
  certificate?: boolean;
  isNew?: boolean;
  flagship?: boolean;
  instructor?: string;
  stats?: { lectures: number; quizzes: number; hours: number };
  platformId: string;
  platformName: string;
  platformColor?: string;
  certType?: 'completion' | 'specialization' | 'formal' | 'upcoming';
  certNumber?: number;
  globalStep?: number;
}

interface FlowLevel {
  level: number;
  name: string;
  hours?: string;
  courses: TreeCourse[];
}

interface PlatformColor {
  id: string;
  name: string;
  color: string;
}

/**
 * RoadmapComponent — Vertical flowchart for the Claude learning ecosystem.
 * Displays a single sequential path from Step 1 to final certification.
 */
@Component({
  selector: 'app-roadmap',
  standalone: true,
  imports: [CommonModule, CCAFDomainsComponent],
  styles: [
    `
      :host {
        display: block;
      }

      /* ── Container ── */
      .roadmap-container {
        max-width: 100%;
        margin: 0 auto;
        padding: 0 0 40px;
      }

      /* ── Level section ── */
      .flow-level {
        margin-bottom: 8px;
      }

      .flow-level-header {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px 0;
        position: relative;
      }

      .flow-level-badge {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        flex-shrink: 0;
        box-shadow: 0 4px 16px rgba(4, 32, 44, 0.25);
        border: 3px solid #5b7065;
        position: relative;
        z-index: 2;
      }

      .flow-level-number {
        font-family: 'Sora', sans-serif;
        font-size: 22px;
        font-weight: 700;
      }

      .flow-level-info {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
      }

      /* ── Steps ── */
      .flow-courses {
        display: grid;
        grid-template-columns: 1fr;
        gap: 8px;
        padding-left: 0;
        position: relative;
      }

      @media (min-width: 640px) {
        .flow-courses {
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
      }

      .flow-step {
        display: flex;
        gap: 12px;
        padding: 0;
        cursor: pointer;
        position: relative;
      }

      .flow-line {
        display: flex;
        align-items: center;
        position: relative;
        width: 16px;
        flex-shrink: 0;
      }

      .flow-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 0 0 2px #dfe4e0;
        position: relative;
        z-index: 2;
        transition: all 0.2s ease;
      }

      .flow-step:hover .flow-dot {
        transform: scale(1.3);
        box-shadow: 0 0 0 3px rgba(4, 32, 44, 0.2);
      }

      .flow-card {
        flex: 1;
        background: white;
        border-radius: 12px;
        padding: 16px 20px;
        border: 1px solid #eff2f0;
        border-left: 4px solid #5b7065;
        transition: all 0.25s cubic-bezier(0.25, 0.1, 0.25, 1);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
      }

      .flow-card:hover {
        transform: translateX(4px);
        box-shadow: 0 4px 16px rgba(4, 32, 44, 0.1);
        border-color: #dfe4e0;
      }

      .flow-card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 6px;
      }

      .flow-step-number {
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        font-weight: 600;
        color: #5b7065;
        background: #eff2f0;
        padding: 2px 8px;
        border-radius: 4px;
      }

      .flow-card-title {
        font-size: 15px;
        font-weight: 600;
        color: #04202c;
        margin: 0;
        line-height: 1.3;
      }

      .flow-card-desc {
        font-size: 12px;
        color: #7d8f84;
        margin: 4px 0 0;
        line-height: 1.4;
      }

      .flow-duration {
        font-size: 11px;
        color: #9eada3;
        margin-left: auto;
      }

      /* ── Crown / CCA-F ── */
      .flow-crown {
        margin: 32px 0;
        padding-left: 28px;
        position: relative;
      }

      .flow-crown::before {
        content: '';
        position: absolute;
        left: 27px;
        top: 0;
        height: 40px;
        width: 3px;
        background: linear-gradient(180deg, #dfe4e0, #04202c);
        border-radius: 2px;
      }

      .crown-card {
        margin-top: 40px;
        background: linear-gradient(135deg, #04202c 0%, #304040 50%, #5b7065 100%);
        border-radius: 16px;
        padding: 28px 32px;
        color: white;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 8px 32px rgba(4, 32, 44, 0.3);
        position: relative;
        overflow: hidden;
      }

      .crown-card::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(
          ellipse at center,
          rgba(158, 173, 163, 0.15) 0%,
          transparent 70%
        );
        animation: crownGlow 4s ease-in-out infinite;
      }

      @keyframes crownGlow {
        0%,
        100% {
          opacity: 0.5;
          transform: scale(1);
        }
        50% {
          opacity: 1;
          transform: scale(1.1);
        }
      }

      .crown-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 16px 48px rgba(4, 32, 44, 0.4);
      }

      /* ── Upcoming certs ── */
      .upcoming-section {
        margin-top: 32px;
      }

      .upcoming-card {
        background: white;
        border: 1px solid #eff2f0;
        border-left: 4px solid #9eada3;
        border-radius: 12px;
        padding: 16px 20px;
        opacity: 0.7;
      }

      /* ── Modal ── */
      .modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 50;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        animation: overlayIn 0.2s ease-out;
      }

      @keyframes overlayIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      .modal-card {
        background: white;
        border-radius: 16px;
        padding: 28px;
        max-width: 580px;
        width: 100%;
        max-height: 85vh;
        overflow-y: auto;
        position: relative;
        box-shadow: 0 24px 64px rgba(0, 0, 0, 0.2);
      }

      .modal-wide {
        max-width: 700px;
      }

      .modal-close {
        position: absolute;
        top: 12px;
        right: 12px;
        z-index: 1;
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: transparent;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #7d8f84;
        transition: all 0.2s;
      }
      .modal-close:hover {
        background: #eff2f0;
        color: #04202c;
      }

      /* Scrollbar styling for modal */
      .modal-card::-webkit-scrollbar {
        width: 6px;
      }
      .modal-card::-webkit-scrollbar-track {
        background: transparent;
      }
      .modal-card::-webkit-scrollbar-thumb {
        background: #c9d1c8;
        border-radius: 3px;
      }

      /* ── Intro grid: image + legend side by side ── */
      .roadmap-intro-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 20px;
        margin-bottom: 32px;
        align-items: stretch;
        max-width: 900px;
        margin-left: auto;
        margin-right: auto;
      }

      @media (min-width: 768px) {
        .roadmap-intro-grid {
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
      }

      /* ── Roadmap concept thumbnail ── */
      .roadmap-concept {
        border-radius: 16px;
        overflow: hidden;
        border: 1px solid #eff2f0;
        box-shadow: 0 4px 24px rgba(4, 32, 44, 0.08);
        transition: all 0.3s ease;
        cursor: pointer;
        position: relative;
        display: flex;
        flex-direction: column;
      }

      .roadmap-concept:hover {
        box-shadow: 0 8px 32px rgba(4, 32, 44, 0.16);
        transform: translateY(-2px);
      }

      .roadmap-concept:hover .roadmap-expand-hint {
        opacity: 1;
      }

      .roadmap-concept img {
        width: 100%;
        flex: 1;
        object-fit: cover;
        display: block;
        min-height: 0;
      }

      .roadmap-expand-hint {
        position: absolute;
        top: 12px;
        right: 12px;
        background: rgba(4, 32, 44, 0.75);
        color: white;
        font-size: 11px;
        font-weight: 600;
        padding: 6px 12px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 6px;
        opacity: 0;
        transition: opacity 0.2s ease;
        backdrop-filter: blur(4px);
        pointer-events: none;
      }

      .roadmap-concept-caption {
        background: linear-gradient(135deg, #04202c 0%, #304040 100%);
        padding: 12px 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 8px;
        flex-shrink: 0;
      }

      .roadmap-concept-caption h3 {
        font-family: 'Sora', sans-serif;
        font-size: 13px;
        font-weight: 700;
        color: white;
        margin: 0;
      }

      /* ── Image lightbox modal ── */
      .image-lightbox {
        position: fixed;
        inset: 0;
        z-index: 60;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        animation: overlayIn 0.2s ease-out;
        cursor: zoom-out;
      }

      .image-lightbox img {
        max-width: 90vw;
        max-height: 90vh;
        object-fit: contain;
        border-radius: 12px;
        box-shadow: 0 32px 80px rgba(0, 0, 0, 0.5);
        animation: lightboxZoom 0.25s cubic-bezier(0.25, 0.1, 0.25, 1);
      }

      @keyframes lightboxZoom {
        from {
          transform: scale(0.8);
          opacity: 0;
        }
        to {
          transform: scale(1);
          opacity: 1;
        }
      }

      .lightbox-close {
        position: absolute;
        top: 20px;
        right: 20px;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.15);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        transition: background 0.2s;
      }

      .lightbox-close:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      .roadmap-legend-items {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .roadmap-legend-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 14px;
        background: #f7f9f8;
        border-radius: 10px;
        transition: background 0.2s ease;
      }

      .roadmap-legend-item:hover {
        background: #eff2f0;
      }

      /* ── Role cards grid ── */
      .role-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 14px;
      }

      @media (min-width: 768px) {
        .role-grid {
          grid-template-columns: repeat(3, 1fr);
        }
      }

      @media (min-width: 1200px) {
        .role-grid {
          grid-template-columns: repeat(4, 1fr);
        }
      }

      @media (max-width: 479px) {
        .role-grid {
          grid-template-columns: 1fr;
        }
      }

      .role-card {
        background: white;
        border: 1px solid #eff2f0;
        border-radius: 14px;
        padding: 20px;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.25, 0.1, 0.25, 1);
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }

      .role-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 28px rgba(4, 32, 44, 0.1);
        border-color: #c9d1c8;
      }

      .role-card--active {
        border-color: #04202c;
        box-shadow: 0 4px 20px rgba(4, 32, 44, 0.12);
      }

      .role-card__icon {
        width: 48px;
        height: 48px;
        border-radius: 14px;
        background: linear-gradient(135deg, #04202c, #304040);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .role-card__title {
        font-size: 14px;
        font-weight: 700;
        color: #04202c;
        margin: 0;
        line-height: 1.3;
      }

      .role-card__desc {
        font-size: 12px;
        color: #7d8f84;
        margin: 0;
        line-height: 1.4;
        flex: 1;
      }

      .role-card__stats {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 4px;
        padding-top: 10px;
        border-top: 1px solid #eff2f0;
        width: 100%;
        justify-content: center;
      }

      .role-card__stat {
        display: flex;
        align-items: baseline;
        gap: 4px;
      }

      .role-card__detail {
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid #eff2f0;
        width: 100%;
        text-align: left;
      }

      /* ── Responsive ── */
      @media (max-width: 640px) {
        .flow-level-badge {
          width: 44px;
          height: 44px;
        }
        .flow-level-number {
          font-size: 18px;
        }
        .flow-courses {
          padding-left: 22px;
        }
        .flow-courses::before {
          left: 21px;
        }
        .flow-card {
          padding: 12px 14px;
        }
        .flow-card-title {
          font-size: 13px;
        }
        .modal-card {
          padding: 20px;
          margin: 8px;
        }
        .crown-card {
          padding: 20px;
        }
      }
    `,
  ],
  template: `
    <div class="roadmap-container">
      <!-- Hero -->
      <div class="card-hero dark-surface mb-8">
        <h1 class="card-hero__title">Ecosistema Claude — Ruta de Aprendizaje</h1>
        <p class="card-hero__desc">
          Tu ruta de aprendizaje paso a paso, desde los fundamentos hasta la certificacion. Sigue el
          camino de principio a fin.
        </p>
      </div>

      @if (loadError()) {
        <div class="alert alert-warning mb-6">
          <div class="alert__content">
            <div class="alert__title">Error al cargar</div>
            <span>{{ loadError() }}</span>
          </div>
        </div>
      }

      <!-- Roadmap Concept + Leyenda — Grid 2 columnas -->
      <div class="roadmap-intro-grid">
        <!-- Col 1: Imagen thumbnail (click to expand) -->
        <div class="roadmap-concept" (click)="showImageModal.set(true)">
          <div class="roadmap-expand-hint">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
            Click para ampliar
          </div>
          <img
            src="assets/images/roadmap_concept.png"
            alt="Certifications Roadmap"
            loading="eager"
          />
          <div class="roadmap-concept-caption">
            <h3>Certifications Roadmap</h3>
            <div class="flex flex-wrap gap-1">
              <span class="badge badge-active text-[9px]">Entry</span>
              <span class="badge badge-info text-[9px]">Advanced</span>
              <span class="badge badge--on-dark text-[9px]">Expert</span>
            </div>
          </div>
        </div>

        <!-- Col 2: Leyenda -->
        <section class="roadmap-legend-card card-section">
          <h3 class="font-display text-[15px] font-bold text-forest mb-4">
            Antes de empezar — Que significa cada cosa
          </h3>

          <div class="roadmap-legend-items">
            <div class="roadmap-legend-item">
              <span class="text-xl">📜</span>
              <div>
                <div class="text-[13px] text-forest font-semibold">Certificado de completacion</div>
                <div class="text-[11px] text-gray-700">Gratis al terminar el curso</div>
              </div>
            </div>
            <div class="roadmap-legend-item">
              <span class="text-xl">🏅</span>
              <div>
                <div class="text-[13px] text-forest font-semibold">Certificado de Especializacion</div>
                <div class="text-[11px] text-gray-700">Al completar todos los cursos</div>
              </div>
            </div>
            <div class="roadmap-legend-item">
              <span class="text-xl">🏆</span>
              <div>
                <div class="text-[13px] text-forest font-semibold">Certificacion formal</div>
                <div class="text-[11px] text-gray-700">Examen supervisado + badge Credly</div>
              </div>
            </div>
            <div class="roadmap-legend-item">
              <span class="text-xl">🔮</span>
              <div>
                <div class="text-[13px] text-forest font-semibold">Proximamente</div>
                <div class="text-[11px] text-gray-700">Anunciado, aun no disponible</div>
              </div>
            </div>
          </div>

          <div class="divider my-4"></div>
          <div class="card-stat__label mb-2">Colores por Plataforma</div>
          <div class="flex flex-wrap gap-3">
            @for (p of platformColors(); track p.id) {
              <div class="flex items-center gap-1.5">
                <div
                  class="w-3 h-3 rounded-full border-2 border-white shadow-soft"
                  [style.background]="p.color"
                ></div>
                <span class="text-xs text-forest">{{ p.name }}</span>
              </div>
            }
          </div>
        </section>
      </div>

      <!-- FLOW VISUALIZATION -->
      @if (levels().length) {
        @for (level of levels(); track level.level) {
          <div class="flow-level">
            <!-- Level header badge -->
            <div class="flow-level-header">
              <div class="flow-level-badge gradient-dark">
                <span class="flow-level-number">{{ level.level }}</span>
              </div>
              <div class="flow-level-info">
                <h2 class="font-display text-lg font-bold text-forest m-0">{{ level.name }}</h2>
                @if (level.hours) {
                  <span class="tag font-mono">{{ level.hours }}</span>
                }
              </div>
            </div>

            <!-- Courses in ORDER -->
            <div class="flow-courses">
              @for (course of level.courses; track course.id) {
                <div class="flow-step" (click)="selectCourse(course)">
                  <div class="flow-line">
                    <div
                      class="flow-dot"
                      [style.background]="getPlatformColor(course.platformId)"
                    ></div>
                  </div>

                  <div
                    class="flow-card"
                    [style.border-left-color]="getPlatformColor(course.platformId)"
                  >
                    <div class="flow-card-header">
                      <span class="flow-step-number">{{
                        course.certNumber
                          ? 'Cert ' + course.certNumber
                          : 'Paso ' + course.globalStep
                      }}</span>
                      <span class="text-sm leading-none"
                        [title]="getCertTooltip(course)">{{ getCertIcon(course) }}</span>
                      <span
                        class="tag font-mono text-[10px]"
                        [style.color]="getPlatformColor(course.platformId)"
                        >{{ course.platformName }}</span
                      >
                      @if (course.isNew) {
                        <span class="badge badge-warning text-[9px]">NUEVO</span>
                      }
                      @if (course.flagship) {
                        <span class="badge badge-active text-[9px]">FLAGSHIP</span>
                      }
                      @if (course.duration) {
                        <span class="flow-duration font-mono">{{ course.duration }}</span>
                      }
                    </div>
                    <h3 class="flow-card-title font-display">{{ course.title }}</h3>
                    <p class="flow-card-desc">{{ course.description }}</p>
                  </div>
                </div>
              }
            </div>
          </div>
        }
      }

      <!-- Certification crown at the bottom -->
      <div class="flow-crown">
        <div class="crown-card dark-surface" (click)="selectCert()">
          <div class="relative z-[2] text-center">
            <div class="text-[32px] mb-2">🏆</div>
            <h3 class="font-display text-lg font-bold text-on-dark m-0 mb-1.5">
              Certificaciones Formales
            </h3>
            <p class="text-on-dark-muted text-[13px] m-0 mb-3">
              1 activa + 3 anunciadas | Badge digital Credly
            </p>
            <div class="flex flex-wrap gap-2 justify-center">
              <span class="badge badge-active text-[10px]">🏆 CCA-F (Activa)</span>
              <span class="badge badge--on-dark text-[10px]">🔮 Seller</span>
              <span class="badge badge--on-dark text-[10px]">🔮 Developer</span>
              <span class="badge badge--on-dark text-[10px]">🔮 Advanced Architect</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Upcoming certifications -->
      @if (upcomingCerts().length) {
        <div class="upcoming-section">
          <h3 class="card-stat__label mb-3">Proximas Certificaciones</h3>
          <div class="grid-auto">
            @for (cert of upcomingCerts(); track cert.id) {
              <div class="upcoming-card">
                <h4 class="font-display text-sm font-semibold text-forest m-0">{{ cert.name }}</h4>
                <p class="text-xs text-gray-700 mt-1 m-0">{{ cert.focus }}</p>
                <div class="flex items-center gap-1.5 mt-2">
                  @if (cert.expectedDate) {
                    <span class="tag font-mono text-[10px]">{{ cert.expectedDate }}</span>
                  }
                  <span class="badge text-[9px]">PROXIMAMENTE</span>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- ROLE-BASED PATHS -->
      @if (rolePaths().length > 0) {
        <section class="mt-12">
          <h2 class="font-display text-2xl font-bold text-forest mb-2 text-center">
            Elige Tu Ruta
          </h2>
          <p class="text-sm text-gray-700 text-center mb-6">
            Selecciona tu rol para ver la ruta de certificacion recomendada
          </p>

          <div class="role-grid">
            @for (rp of rolePaths(); track rp.id) {
              <div
                class="role-card"
                [class.role-card--active]="selectedRole() === rp.id"
                (click)="toggleRole(rp.id)"
              >
                <div class="role-card__icon">
                  <span class="font-mono text-xs font-bold"
                    >{{ rp.role[0] }}{{ rp.role[1] }}</span
                  >
                </div>
                <h3 class="role-card__title font-display">{{ rp.role }}</h3>
                <p class="role-card__desc">{{ rp.description }}</p>
                <div class="role-card__stats">
                  <div class="role-card__stat">
                    <span class="font-mono text-xl font-bold text-forest">{{ rp.certCount }}</span>
                    <span class="text-[10px] text-gray-700">certs</span>
                  </div>
                  <span class="tag font-mono text-[11px]">{{ rp.cost }}</span>
                </div>
                @if (selectedRole() === rp.id) {
                  <div class="role-card__detail">
                    @if (rp.formalCert) {
                      <span class="badge badge-active text-[10px] mb-2">{{ rp.formalCert }}</span>
                    }
                    <div class="text-[11px] font-semibold text-forest mb-1.5">
                      Cursos recomendados:
                    </div>
                    <div class="flex flex-wrap gap-1">
                      @if (rp.courses === 'all') {
                        <span class="tag font-mono text-[10px] bg-gray-100"
                          >30+ cursos de todas las plataformas</span
                        >
                      } @else {
                        @for (courseId of rp.courses; track courseId) {
                          <span
                            class="tag font-mono text-[10px] bg-gray-100 cursor-pointer"
                            (click)="selectCourseById(courseId); $event.stopPropagation()"
                          >
                            {{ getCourseTitle(courseId) || courseId }}
                          </span>
                        }
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </section>
      }

      <!-- COURSE MODAL -->
      @if (selectedCourseData()) {
        <div class="modal-overlay" (click)="closeCourse()">
          <div class="modal-card animate-scaleIn" (click)="$event.stopPropagation()">
            <button class="modal-close btn btn-icon" (click)="closeCourse()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div
              class="pb-4 mb-4"
              [style.border-bottom]="
                '3px solid ' + getPlatformColor(selectedCourseData()!.platformId)
              "
            >
              <div class="flex items-center flex-wrap gap-2 mb-2">
                <span
                  class="tag font-mono"
                  [style.border-color]="getPlatformColor(selectedCourseData()!.platformId)"
                  >{{ selectedCourseData()!.platformName }}</span
                >
                <span class="badge badge-info">Nivel {{ selectedCourseData()!.level }}</span>
                @if (selectedCourseData()!.globalStep) {
                  <span class="flow-step-number">Paso {{ selectedCourseData()!.globalStep }}</span>
                }
                @if (selectedCourseData()!.audience) {
                  <span class="badge">{{ selectedCourseData()!.audience }}</span>
                }
                @if (selectedCourseData()!.duration) {
                  <span class="tag font-mono">{{ selectedCourseData()!.duration }}</span>
                }
                @if (selectedCourseData()!.certificate) {
                  <span class="badge badge-active">Certificado</span>
                }
              </div>
              <h2 class="font-display text-xl font-bold text-forest m-0">
                {{ selectedCourseData()!.title }}
              </h2>
              <p class="text-[0.8125rem] text-forest mt-2 m-0">
                {{ selectedCourseData()!.description }}
              </p>
            </div>

            @if (selectedCourseData()!.topics?.length) {
              <div class="mb-4">
                <h3 class="text-[0.8125rem] font-bold text-forest mb-2">Temas que cubre</h3>
                <div class="flex flex-wrap gap-1.5">
                  @for (topic of selectedCourseData()!.topics; track topic) {
                    <span class="tag font-mono text-[11px] bg-gray-50">{{ topic }}</span>
                  }
                </div>
              </div>
            }

            @if (selectedCourseData()!.stats) {
              <div class="grid-stats gap-2 mb-4">
                <div class="card-stat">
                  <div class="card-stat__value">{{ selectedCourseData()!.stats!.lectures }}</div>
                  <div class="card-stat__label">Lecciones</div>
                </div>
                <div class="card-stat">
                  <div class="card-stat__value">{{ selectedCourseData()!.stats!.quizzes }}</div>
                  <div class="card-stat__label">Pruebas</div>
                </div>
                <div class="card-stat">
                  <div class="card-stat__value">{{ selectedCourseData()!.stats!.hours }}+</div>
                  <div class="card-stat__label">Horas</div>
                </div>
              </div>
            }

            @if (selectedCourseData()!.prerequisites?.length) {
              <div class="mb-4">
                <h3 class="text-[0.8125rem] font-bold text-forest mb-2">Prerequisitos</h3>
                <div class="flex flex-wrap gap-1.5">
                  @for (pre of selectedCourseData()!.prerequisites; track pre) {
                    <span
                      class="badge badge-warning text-[11px] cursor-pointer"
                      (click)="selectCourseById(pre)"
                      >{{ getCourseTitle(pre) }}</span
                    >
                  }
                </div>
              </div>
            }

            @if (selectedCourseData()!.instructor) {
              <p class="text-[0.8125rem] text-forest mb-4">
                Instructor:
                <strong class="text-forest">{{ selectedCourseData()!.instructor }}</strong>
              </p>
            }

            <div class="flex gap-3 mt-5">
              <a
                [href]="selectedCourseData()!.url"
                target="_blank"
                rel="noopener"
                class="btn btn-primary"
              >
                Ir al curso
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
              <button class="btn btn-secondary" (click)="closeCourse()">Cerrar</button>
            </div>
          </div>
        </div>
      }

      <!-- IMAGE LIGHTBOX -->
      @if (showImageModal()) {
        <div class="image-lightbox" (click)="showImageModal.set(false)">
          <button class="lightbox-close" (click)="showImageModal.set(false)">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <img
            src="assets/images/roadmap_concept.png"
            alt="Certifications Roadmap - Full Size"
            (click)="$event.stopPropagation()"
          />
        </div>
      }

      <!-- CERTIFICATION MODAL -->
      <app-ccaf-domains
        [domains]="certData()?.domains ?? []"
        [totalQuestions]="ccafConfig()?.totalQuestions ?? config.ccafQuestionCount"
        [durationMin]="(ccafConfig()?.durationSec ?? config.ccafDurationSec) / 60"
        [passingScore]="ccafConfig()?.passingScore ?? config.ccafPassingScore"
        [maxScore]="ccafConfig()?.maxScore ?? config.ccafMaxScore"
        [format]="certData()?.format ?? ''"
        [studyResources]="certData()?.studyResources ?? []"
        [certUrl]="certData()?.url ?? ''"
        [visible]="showCertModal()"
        (close)="closeCert()"
      />
    </div>
  `,
})
export class RoadmapComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly http = inject(HttpClient);
  private readonly curriculumService = inject(CurriculumService);
  private readonly logger = inject(LoggingService);
  protected readonly config = inject(ConfigService);

  /* ── Raw data ──────────────────────────────────────────────────────── */
  private data = signal<RoadmapData | null>(null);

  /* ── UI state ──────────────────────────────────────────────────────── */
  selectedCourseData = signal<TreeCourse | null>(null);
  showCertModal = signal(false);
  showImageModal = signal(false);
  selectedRole = signal<string | null>(null);
  loadError = signal<string | null>(null);

  /* ── Flat course map for lookups ───────────────────────────────────── */
  private courseMap = new Map<string, TreeCourse>();

  /* ── Platform color map ────────────────────────────────────────────── */
  private platformColorMap = new Map<string, string>();

  /* ── Computed: flow levels with global step numbers ────────────────── */
  levels = computed<FlowLevel[]>(() => {
    const d = this.data();
    if (!d) return [];

    let globalStep = 1;
    return d.learningPath.map((lp) => {
      const courses = lp.courses
        .map((id) => this.courseMap.get(id))
        .filter((c): c is TreeCourse => !!c)
        .map((c) => ({ ...c, globalStep: globalStep++ }));

      return {
        level: lp.level,
        name: lp.name,
        hours: lp.hours,
        courses,
      };
    });
  });

  /* ── Computed: platform colors for legend ──────────────────────────── */
  platformColors = computed<PlatformColor[]>(() => {
    const d = this.data();
    if (!d) return [];
    return d.platforms.map((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
    }));
  });

  /* ── Computed: certification data ──────────────────────────────────── */
  certData = computed<Certification | null>(() => {
    const d = this.data();
    if (!d) return null;
    return d.certifications.available.find((c) => c.id === 'cca-f') ?? null;
  });

  /* ── Computed: CCA-F config from CurriculumService ────────────────── */
  ccafConfig = computed(() => this.curriculumService.getCCAFConfig());

  /* ── Computed: upcoming certifications ─────────────────────────────── */
  upcomingCerts = computed<Certification[]>(() => {
    const d = this.data();
    if (!d) return [];
    return d.certifications.upcoming ?? [];
  });

  /* ── Computed: role-based learning paths ──────────────────────────── */
  rolePaths = computed<RolePath[]>(() => {
    const d = this.data();
    if (!d) return [];
    return d.rolePaths ?? [];
  });

  /* ── Lifecycle ─────────────────────────────────────────────────────── */
  ngOnInit(): void {
    this.http
      .get<RoadmapData>('/assets/question-bank/roadmap.json')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.data.set(data);
          this.buildMaps(data);
        },
        error: (err) => {
          this.logger.error('Failed to load roadmap.json', 'Roadmap', err);
          this.loadError.set(
            'No se pudo cargar la ruta de aprendizaje. Intenta recargar la pagina.',
          );
        },
      });
    // Load curriculum catalog so ccafConfig() is available
    this.curriculumService
      .loadCatalog()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (err) => this.logger.error('Catalog load failed', 'Roadmap', err),
      });
  }

  /* ── Public methods ────────────────────────────────────────────────── */

  selectCourse(course: TreeCourse): void {
    this.selectedCourseData.set(course);
  }

  selectCourseById(courseId: string): void {
    const tc = this.courseMap.get(courseId);
    if (tc) {
      this.selectedCourseData.set(tc);
    }
  }

  closeCourse(): void {
    this.selectedCourseData.set(null);
  }

  selectCert(): void {
    this.showCertModal.set(true);
  }

  closeCert(): void {
    this.showCertModal.set(false);
  }

  toggleRole(id: string): void {
    this.selectedRole.set(this.selectedRole() === id ? null : id);
  }

  getPlatformColor(platformId: string): string {
    return this.platformColorMap.get(platformId) ?? '#5B7065';
  }

  getCourseTitle(courseId: string): string {
    return this.courseMap.get(courseId)?.title ?? courseId;
  }

  getCertIcon(course: TreeCourse): string {
    if (course.certType === 'formal' || course.id === 'cca-f') return '\u{1F3C6}';
    if (course.certType === 'upcoming') return '\u{1F52E}';
    if (course.certType === 'specialization') return '\u{1F3C5}';
    return '\u{1F4DC}';
  }

  getCertTooltip(course: TreeCourse): string {
    if (course.certType === 'formal' || course.id === 'cca-f')
      return 'Certificacion formal (examen supervisado)';
    if (course.certType === 'upcoming') return 'Proximamente';
    if (course.certType === 'specialization') return 'Certificado de Especializacion';
    return 'Certificado de completacion';
  }

  /* ── Private ───────────────────────────────────────────────────────── */

  private buildMaps(data: RoadmapData): void {
    this.courseMap.clear();
    this.platformColorMap.clear();

    for (const platform of data.platforms) {
      this.platformColorMap.set(platform.id, platform.color);

      const addCourse = (course: RoadmapCourse, certTypeOverride?: TreeCourse['certType']) => {
        const tc: TreeCourse = {
          id: course.id,
          title: course.title,
          description: course.description,
          url: course.url,
          level: course.level,
          duration: course.duration,
          topics: course.topics ?? [],
          audience: course.audience,
          prerequisites: course.prerequisites,
          certificate: course.certificate,
          isNew: course.isNew,
          flagship: course.flagship,
          instructor: course.instructor,
          stats: course.stats,
          platformId: platform.id,
          platformName: platform.name,
          certType: certTypeOverride ?? (course as any).certType ?? 'completion',
          certNumber: (course as any).certNumber,
        };
        this.courseMap.set(course.id, tc);
      };

      // Layers (Academy)
      if (platform.layers) {
        for (const layer of platform.layers) {
          for (const course of layer.courses) {
            addCourse(course);
          }
        }
      }

      // Direct courses (DeepLearning.AI, GitHub)
      if (platform.courses) {
        for (const course of platform.courses) {
          addCourse(course);
        }
      }

      // Specializations (Coursera)
      if (platform.specializations) {
        for (const spec of platform.specializations) {
          for (const course of spec.courses) {
            addCourse(course);
          }
        }
      }

      // Individual courses (Coursera) — may include specialization cert entries
      if (platform.individualCourses) {
        for (const course of platform.individualCourses) {
          addCourse(course);
        }
      }
    }

    // Map certifications as courses too (for learning path level 5 reference)
    // CCA-F — formal certification
    if (data.certifications?.available) {
      for (const cert of data.certifications.available) {
        if (!this.courseMap.has(cert.id)) {
          this.courseMap.set(cert.id, {
            id: cert.id,
            title: cert.name,
            description: cert.format ?? '',
            url: cert.url ?? '',
            level: 5,
            topics: cert.domains?.map((d) => d.name) ?? [],
            platformId: 'partner-network',
            platformName: 'Partner Network',
            platformColor: '#D97706',
            certType: 'formal',
          });
        }
      }
    }

    // Upcoming certifications
    if (data.certifications?.upcoming) {
      for (const cert of data.certifications.upcoming) {
        if (!this.courseMap.has(cert.id)) {
          this.courseMap.set(cert.id, {
            id: cert.id,
            title: cert.name,
            description: cert.focus ?? '',
            url: '',
            level: 5,
            topics: [],
            platformId: 'partner-network',
            platformName: 'Partner Network',
            platformColor: '#6B7280',
            certType: 'upcoming',
          });
        }
      }
    }

    // Register partner-network color
    this.platformColorMap.set('partner-network', '#D97706');
  }
}
