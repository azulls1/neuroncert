import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CurriculumService } from '../../core/services/curriculum.service';

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
  imports: [CommonModule, RouterLink],
  styles: [`
    :host { display: block; }

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
      border: 3px solid #5B7065;
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
      .flow-courses { grid-template-columns: repeat(2, 1fr); gap: 10px; }
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
      box-shadow: 0 0 0 2px #DFE4E0;
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
      border: 1px solid #EFF2F0;
      border-left: 4px solid #5B7065;
      transition: all 0.25s cubic-bezier(0.25, 0.1, 0.25, 1);
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }

    .flow-card:hover {
      transform: translateX(4px);
      box-shadow: 0 4px 16px rgba(4, 32, 44, 0.1);
      border-color: #DFE4E0;
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
      color: #5B7065;
      background: #EFF2F0;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .flow-card-title {
      font-size: 15px;
      font-weight: 600;
      color: #04202C;
      margin: 0;
      line-height: 1.3;
    }

    .flow-card-desc {
      font-size: 12px;
      color: #7D8F84;
      margin: 4px 0 0;
      line-height: 1.4;
    }

    .flow-duration {
      font-size: 11px;
      color: #9EADA3;
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
      background: linear-gradient(180deg, #DFE4E0, #04202C);
      border-radius: 2px;
    }

    .crown-card {
      margin-top: 40px;
      background: linear-gradient(135deg, #04202C 0%, #304040 50%, #5B7065 100%);
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
      background: radial-gradient(ellipse at center, rgba(158, 173, 163, 0.15) 0%, transparent 70%);
      animation: crownGlow 4s ease-in-out infinite;
    }

    @keyframes crownGlow {
      0%, 100% { opacity: 0.5; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.1); }
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
      border: 1px solid #EFF2F0;
      border-left: 4px solid #9EADA3;
      border-radius: 12px;
      padding: 16px 20px;
      opacity: 0.7;
    }

    /* ── Legend ── */
    .flow-legend {
      display: flex;
      justify-content: center;
      gap: 20px;
      flex-wrap: wrap;
      padding: 24px 0;
      border-top: 1px solid #EFF2F0;
      margin-top: 40px;
    }

    .legend-item { display: flex; align-items: center; gap: 6px; }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; }
    .legend-label { font-size: 12px; color: #7D8F84; }

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
      from { opacity: 0; }
      to   { opacity: 1; }
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

    .modal-wide { max-width: 700px; }

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
      color: #7D8F84;
      transition: all 0.2s;
    }
    .modal-close:hover { background: #EFF2F0; color: #04202C; }

    /* Scrollbar styling for modal */
    .modal-card::-webkit-scrollbar { width: 6px; }
    .modal-card::-webkit-scrollbar-track { background: transparent; }
    .modal-card::-webkit-scrollbar-thumb {
      background: #C9D1C8;
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
      border: 1px solid #EFF2F0;
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
      background: linear-gradient(135deg, #04202C 0%, #304040 100%);
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

    .roadmap-concept-caption p {
      font-size: 10px;
      color: #C9D1C8;
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
      from { transform: scale(0.8); opacity: 0; }
      to   { transform: scale(1); opacity: 1; }
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

    /* ── Legend card ── */
    .roadmap-legend-card {
      background: white;
      border: 1px solid #EFF2F0;
      border-radius: 16px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      justify-content: center;
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
      background: #F7F9F8;
      border-radius: 10px;
      transition: background 0.2s ease;
    }

    .roadmap-legend-item:hover {
      background: #EFF2F0;
    }

    /* ── Role cards grid ── */
    .role-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
    }

    @media (min-width: 768px) {
      .role-grid { grid-template-columns: repeat(3, 1fr); }
    }

    @media (min-width: 1200px) {
      .role-grid { grid-template-columns: repeat(4, 1fr); }
    }

    @media (max-width: 479px) {
      .role-grid { grid-template-columns: 1fr; }
    }

    .role-card {
      background: white;
      border: 1px solid #EFF2F0;
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
      border-color: #C9D1C8;
    }

    .role-card--active {
      border-color: #04202C;
      box-shadow: 0 4px 20px rgba(4, 32, 44, 0.12);
    }

    .role-card__icon {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: linear-gradient(135deg, #04202C, #304040);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .role-card__title {
      font-size: 14px;
      font-weight: 700;
      color: #04202C;
      margin: 0;
      line-height: 1.3;
    }

    .role-card__desc {
      font-size: 12px;
      color: #7D8F84;
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
      border-top: 1px solid #EFF2F0;
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
      border-top: 1px solid #EFF2F0;
      width: 100%;
      text-align: left;
    }

    /* ── Responsive ── */
    @media (max-width: 640px) {
      .flow-level-badge { width: 44px; height: 44px; }
      .flow-level-number { font-size: 18px; }
      .flow-courses { padding-left: 22px; }
      .flow-courses::before { left: 21px; }
      .flow-card { padding: 12px 14px; }
      .flow-card-title { font-size: 13px; }
      .modal-card { padding: 20px; margin: 8px; }
      .crown-card { padding: 20px; }
    }
  `],
  template: `
<div class="roadmap-container">

  <!-- Hero -->
  <div class="card-hero" style="margin-bottom: 32px;">
    <h1 class="card-hero__title">Ecosistema Claude — Ruta de Aprendizaje</h1>
    <p class="card-hero__desc">Tu ruta de aprendizaje paso a paso, desde los fundamentos hasta la certificacion. Sigue el camino de principio a fin.</p>
  </div>

  @if (loadError()) {
    <div class="alert alert-warning" style="margin-bottom: 24px;">
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
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
        Click para ampliar
      </div>
      <img src="assets/images/roadmap_concept.png"
           alt="Certifications Roadmap"
           loading="eager" />
      <div class="roadmap-concept-caption">
        <h3>Certifications Roadmap</h3>
        <div style="display: flex; gap: 4px; flex-wrap: wrap;">
          <span class="badge badge-active" style="font-size: 9px;">Entry</span>
          <span class="badge badge-info" style="font-size: 9px;">Advanced</span>
          <span class="badge" style="font-size: 9px; background: rgba(255,255,255,0.15); color: #C9D1C8;">Expert</span>
        </div>
      </div>
    </div>

    <!-- Col 2: Leyenda -->
    <section class="roadmap-legend-card">
      <h3 class="font-display" style="font-size: 15px; font-weight: 700; color: #04202C; margin-bottom: 16px;">Antes de empezar — Que significa cada cosa</h3>

      <div class="roadmap-legend-items">
        <div class="roadmap-legend-item">
          <span style="font-size: 20px;">📜</span>
          <div>
            <div style="font-size: 13px; color: #04202C; font-weight: 600;">Certificado de completacion</div>
            <div style="font-size: 11px; color: #9EADA3;">Gratis al terminar el curso</div>
          </div>
        </div>
        <div class="roadmap-legend-item">
          <span style="font-size: 20px;">🏅</span>
          <div>
            <div style="font-size: 13px; color: #04202C; font-weight: 600;">Certificado de Especializacion</div>
            <div style="font-size: 11px; color: #9EADA3;">Al completar todos los cursos</div>
          </div>
        </div>
        <div class="roadmap-legend-item">
          <span style="font-size: 20px;">🏆</span>
          <div>
            <div style="font-size: 13px; color: #04202C; font-weight: 600;">Certificacion formal</div>
            <div style="font-size: 11px; color: #9EADA3;">Examen supervisado + badge Credly</div>
          </div>
        </div>
        <div class="roadmap-legend-item">
          <span style="font-size: 20px;">🔮</span>
          <div>
            <div style="font-size: 13px; color: #04202C; font-weight: 600;">Proximamente</div>
            <div style="font-size: 11px; color: #9EADA3;">Anunciado, aun no disponible</div>
          </div>
        </div>
      </div>

      <div style="border-top: 1px solid #EFF2F0; padding-top: 14px; margin-top: 16px;">
        <div style="font-size: 11px; font-weight: 600; color: #7D8F84; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px;">Colores por Plataforma</div>
        <div style="display: flex; flex-wrap: wrap; gap: 12px;">
          @for (p of platformColors(); track p.id) {
            <div style="display: flex; align-items: center; gap: 6px;">
              <div style="width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 1px #DFE4E0;" [style.background]="p.color"></div>
              <span style="font-size: 12px; color: #5B7065;">{{ p.name }}</span>
            </div>
          }
        </div>
      </div>
    </section>

  </div>

  <!-- FLOW VISUALIZATION -->
  @if (levels().length) {
    @for (level of levels(); track level.level) {
      <div class="flow-level">

        <!-- Level header badge -->
        <div class="flow-level-header">
          <div class="flow-level-badge" style="background: linear-gradient(135deg, #04202C, #304040);">
            <span class="flow-level-number">{{ level.level }}</span>
          </div>
          <div class="flow-level-info">
            <h2 class="font-display" style="font-size: 1.125rem; font-weight: 700; color: #04202C; margin: 0;">{{ level.name }}</h2>
            @if (level.hours) {
              <span class="tag font-mono">{{ level.hours }}</span>
            }
          </div>
        </div>

        <!-- Courses in ORDER -->
        <div class="flow-courses">
          @for (course of level.courses; track course.id) {
            <div class="flow-step" (click)="selectCourse(course)">
              <!-- Vertical line connector -->
              <div class="flow-line">
                <div class="flow-dot" [style.background]="getPlatformColor(course.platformId)"></div>
              </div>

              <!-- Step card -->
              <div class="flow-card" [style.border-left-color]="getPlatformColor(course.platformId)">
                <div class="flow-card-header">
                  <span class="flow-step-number">{{ course.certNumber ? 'Cert ' + course.certNumber : 'Paso ' + course.globalStep }}</span>
                  <span style="font-size: 14px; line-height: 1;" [title]="getCertTooltip(course)">{{ getCertIcon(course) }}</span>
                  <span class="tag font-mono" style="font-size: 10px;" [style.color]="getPlatformColor(course.platformId)">{{ course.platformName }}</span>
                  @if (course.isNew) {
                    <span class="badge badge-warning" style="font-size: 9px;">NUEVO</span>
                  }
                  @if (course.flagship) {
                    <span class="badge badge-active" style="font-size: 9px;">FLAGSHIP</span>
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
    <div class="crown-card" (click)="selectCert()">
      <div style="position: relative; z-index: 2; text-align: center;">
        <div style="font-size: 32px; margin-bottom: 8px;">🏆</div>
        <h3 class="font-display" style="font-size: 1.15rem; font-weight: 700; color: white; margin: 0 0 6px;">Certificaciones Formales</h3>
        <p style="font-size: 13px; color: #C9D1C8; margin: 0 0 12px;">1 activa + 3 anunciadas | Badge digital Credly</p>
        <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
          <span class="badge badge-active" style="font-size: 10px;">🏆 CCA-F (Activa)</span>
          <span class="badge" style="font-size: 10px; background: rgba(255,255,255,0.1); color: #C9D1C8;">🔮 Seller</span>
          <span class="badge" style="font-size: 10px; background: rgba(255,255,255,0.1); color: #C9D1C8;">🔮 Developer</span>
          <span class="badge" style="font-size: 10px; background: rgba(255,255,255,0.1); color: #C9D1C8;">🔮 Advanced Architect</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Upcoming certifications -->
  @if (upcomingCerts().length) {
    <div class="upcoming-section">
      <h3 class="font-display" style="font-size: 0.875rem; font-weight: 700; color: #7D8F84; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">Proximas Certificaciones</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 10px;">
        @for (cert of upcomingCerts(); track cert.id) {
          <div class="upcoming-card">
            <h4 class="font-display" style="font-size: 0.875rem; font-weight: 600; color: #04202C; margin: 0;">{{ cert.name }}</h4>
            <p style="font-size: 0.75rem; color: #7D8F84; margin: 4px 0 0;">{{ cert.focus }}</p>
            <div style="display: flex; gap: 6px; align-items: center; margin-top: 8px;">
              @if (cert.expectedDate) {
                <span class="tag font-mono" style="font-size: 10px;">{{ cert.expectedDate }}</span>
              }
              <span class="badge" style="font-size: 9px;">PROXIMAMENTE</span>
            </div>
          </div>
        }
      </div>
    </div>
  }

  <!-- ═══ ROLE-BASED PATHS ═══ -->
  @if (rolePaths().length > 0) {
    <section style="margin-top: 48px;">
      <h2 class="font-display" style="font-size: 1.5rem; font-weight: 700; color: #04202C; margin-bottom: 8px; text-align: center;">Elige Tu Ruta</h2>
      <p style="font-size: 14px; color: #7D8F84; text-align: center; margin-bottom: 24px;">Selecciona tu rol para ver la ruta de certificacion recomendada</p>

      <div class="role-grid">
        @for (rp of rolePaths(); track rp.id) {
          <div class="role-card" [class.role-card--active]="selectedRole() === rp.id" (click)="toggleRole(rp.id)">

            <!-- Icon -->
            <div class="role-card__icon">
              <span class="font-mono" style="font-size: 12px; font-weight: 700;">{{ rp.role[0] }}{{ rp.role[1] }}</span>
            </div>

            <!-- Title -->
            <h3 class="role-card__title font-display">{{ rp.role }}</h3>

            <!-- Description -->
            <p class="role-card__desc">{{ rp.description }}</p>

            <!-- Stats -->
            <div class="role-card__stats">
              <div class="role-card__stat">
                <span class="font-mono" style="font-size: 1.25rem; font-weight: 700; color: #04202C;">{{ rp.certCount }}</span>
                <span style="font-size: 10px; color: #9EADA3;">certs</span>
              </div>
              <span class="tag font-mono" style="font-size: 11px;">{{ rp.cost }}</span>
            </div>

            <!-- Expanded: course list -->
            @if (selectedRole() === rp.id) {
              <div class="role-card__detail">
                @if (rp.formalCert) {
                  <span class="badge badge-active" style="font-size: 10px; margin-bottom: 8px;">{{ rp.formalCert }}</span>
                }
                <div style="font-size: 11px; font-weight: 600; color: #04202C; margin-bottom: 6px;">Cursos recomendados:</div>
                <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                  @if (rp.courses === 'all') {
                    <span class="tag font-mono" style="font-size: 10px; background: #EFF2F0;">30+ cursos de todas las plataformas</span>
                  } @else {
                    @for (courseId of rp.courses; track courseId) {
                      <span class="tag font-mono" style="font-size: 10px; background: #EFF2F0; cursor: pointer;" (click)="selectCourseById(courseId); $event.stopPropagation()">
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


  <!-- ═══════ COURSE MODAL ═══════ -->
  @if (selectedCourseData()) {
    <div class="modal-overlay" (click)="closeCourse()">
      <div class="modal-card animate-scaleIn" (click)="$event.stopPropagation()">
        <!-- Close button -->
        <button class="modal-close btn btn-icon" (click)="closeCourse()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <!-- Course header -->
        <div [style.border-bottom]="'3px solid ' + getPlatformColor(selectedCourseData()!.platformId)" style="padding-bottom: 16px; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;">
            <span class="tag font-mono" [style.border-color]="getPlatformColor(selectedCourseData()!.platformId)">{{ selectedCourseData()!.platformName }}</span>
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
          <h2 class="font-display" style="font-size: 1.2rem; font-weight: 700; color: #04202C; margin: 0;">{{ selectedCourseData()!.title }}</h2>
          <p style="font-size: 0.8125rem; color: #5B7065; margin: 8px 0 0;">{{ selectedCourseData()!.description }}</p>
        </div>

        <!-- Topics grid -->
        @if (selectedCourseData()!.topics?.length) {
          <div style="margin-bottom: 16px;">
            <h3 style="font-size: 0.8125rem; font-weight: 700; color: #04202C; margin-bottom: 8px;">Temas que cubre</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              @for (topic of selectedCourseData()!.topics; track topic) {
                <span class="tag font-mono" style="font-size: 11px; background: #F7F9F8;">{{ topic }}</span>
              }
            </div>
          </div>
        }

        <!-- Stats if flagship -->
        @if (selectedCourseData()!.stats) {
          <div class="grid-stats" style="gap: 8px; margin-bottom: 16px;">
            <div class="card-stat"><div class="card-stat__value">{{ selectedCourseData()!.stats!.lectures }}</div><div class="card-stat__label">Lecciones</div></div>
            <div class="card-stat"><div class="card-stat__value">{{ selectedCourseData()!.stats!.quizzes }}</div><div class="card-stat__label">Pruebas</div></div>
            <div class="card-stat"><div class="card-stat__value">{{ selectedCourseData()!.stats!.hours }}+</div><div class="card-stat__label">Horas</div></div>
          </div>
        }

        <!-- Prerequisites -->
        @if (selectedCourseData()!.prerequisites?.length) {
          <div style="margin-bottom: 16px;">
            <h3 style="font-size: 0.8125rem; font-weight: 700; color: #04202C; margin-bottom: 8px;">Prerequisitos</h3>
            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
              @for (pre of selectedCourseData()!.prerequisites; track pre) {
                <span class="badge badge-warning" style="font-size: 11px; cursor: pointer;" (click)="selectCourseById(pre)">{{ getCourseTitle(pre) }}</span>
              }
            </div>
          </div>
        }

        <!-- Instructor -->
        @if (selectedCourseData()!.instructor) {
          <p style="font-size: 0.8125rem; color: #5B7065; margin-bottom: 16px;">Instructor: <strong style="color: #04202C;">{{ selectedCourseData()!.instructor }}</strong></p>
        }

        <!-- Actions -->
        <div style="display: flex; gap: 12px; margin-top: 20px;">
          <a [href]="selectedCourseData()!.url" target="_blank" rel="noopener" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 6px;">
            Ir al curso
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
          <button class="btn btn-secondary" (click)="closeCourse()">Cerrar</button>
        </div>
      </div>
    </div>
  }

  <!-- ═══════ IMAGE LIGHTBOX ═══════ -->
  @if (showImageModal()) {
    <div class="image-lightbox" (click)="showImageModal.set(false)">
      <button class="lightbox-close" (click)="showImageModal.set(false)">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
      <img src="assets/images/roadmap_concept.png"
           alt="Certifications Roadmap - Full Size"
           (click)="$event.stopPropagation()" />
    </div>
  }

  <!-- ═══════ COURSE MODAL ═══════ -->

  <!-- ═══════ CERTIFICATION MODAL ═══════ -->
  @if (showCertModal()) {
    <div class="modal-overlay" (click)="closeCert()">
      <div class="modal-card modal-wide animate-scaleIn" (click)="$event.stopPropagation()">
        <button class="modal-close btn btn-icon" (click)="closeCert()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <h2 class="font-display" style="font-size: 1.2rem; font-weight: 700; color: #04202C; margin: 0 0 8px;">CCA-F — Arquitecto Certificado Claude: Fundamentos</h2>
        <p style="font-size: 0.8125rem; color: #5B7065; margin-bottom: 16px;">{{ certData()?.format }}</p>

        <div class="grid-stats" style="margin-bottom: 20px;">
          <div class="card-stat"><div class="card-stat__value">{{ ccafConfig()?.totalQuestions ?? 60 }}</div><div class="card-stat__label">Preguntas</div></div>
          <div class="card-stat"><div class="card-stat__value">{{ (ccafConfig()?.durationSec ?? 7200) / 60 }}</div><div class="card-stat__label">Minutos</div></div>
          <div class="card-stat"><div class="card-stat__value">{{ ccafConfig()?.passingScore ?? 720 }}</div><div class="card-stat__label">/ {{ ccafConfig()?.maxScore ?? 1000 }}</div></div>
          <div class="card-stat"><div class="card-stat__value">$0-99</div><div class="card-stat__label">Precio</div></div>
        </div>

        <h3 class="font-display" style="font-size: 0.875rem; font-weight: 700; color: #04202C; margin-bottom: 14px;">Dominios del Examen</h3>
        @for (domain of certData()?.domains; track domain.name) {
          <div style="margin-bottom: 14px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 0.8125rem; color: #04202C; font-weight: 600;">{{ domain.name }}</span>
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

        <h3 class="font-display" style="font-size: 0.875rem; font-weight: 700; color: #04202C; margin-bottom: 10px;">Recursos de Estudio</h3>
        <div class="stack-sm" style="margin-bottom: 20px;">
          @for (res of certData()?.studyResources; track res.name) {
            <a [href]="res.url" target="_blank" rel="noopener" class="card-compact hover-lift" style="cursor: pointer; text-decoration: none; display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 0.8125rem; color: #04202C;">{{ res.name }}</span>
              <span style="color: #5B7065; margin-left: auto; font-size: 12px;">&#8599;</span>
            </a>
          }
        </div>

        <div style="display: flex; gap: 12px;">
          <a routerLink="/ccaf" class="btn btn-cta" (click)="closeCert()">Practicar CCA-F</a>
          <a [href]="certData()?.url || ''" target="_blank" rel="noopener" class="btn btn-secondary">Info oficial &#8599;</a>
        </div>
      </div>
    </div>
  }

</div>
  `
})
export class RoadmapComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly curriculumService = inject(CurriculumService);

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
    return d.learningPath.map(lp => {
      const courses = lp.courses
        .map(id => this.courseMap.get(id))
        .filter((c): c is TreeCourse => !!c)
        .map(c => ({ ...c, globalStep: globalStep++ }));

      return {
        level: lp.level,
        name: lp.name,
        hours: lp.hours,
        courses
      };
    });
  });

  /* ── Computed: platform colors for legend ──────────────────────────── */
  platformColors = computed<PlatformColor[]>(() => {
    const d = this.data();
    if (!d) return [];
    return d.platforms.map(p => ({
      id: p.id,
      name: p.name,
      color: p.color
    }));
  });

  /* ── Computed: certification data ──────────────────────────────────── */
  certData = computed<Certification | null>(() => {
    const d = this.data();
    if (!d) return null;
    return d.certifications.available.find(c => c.id === 'cca-f') ?? null;
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
    this.http.get<RoadmapData>('/assets/question-bank/roadmap.json').subscribe({
      next: (data) => {
        this.data.set(data);
        this.buildMaps(data);
      },
      error: (err) => {
        console.error('[Roadmap] Failed to load roadmap.json:', err);
        this.loadError.set('No se pudo cargar la ruta de aprendizaje. Intenta recargar la pagina.');
      }
    });
    // Load curriculum catalog so ccafConfig() is available
    this.curriculumService.loadCatalog().subscribe({
      error: (err) => console.error('[Roadmap] Catalog load failed:', err)
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
    if (course.certType === 'formal' || course.id === 'cca-f') return 'Certificacion formal (examen supervisado)';
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
          certNumber: (course as any).certNumber
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
            topics: cert.domains?.map(d => d.name) ?? [],
            platformId: 'partner-network',
            platformName: 'Partner Network',
            platformColor: '#D97706',
            certType: 'formal'
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
            certType: 'upcoming'
          });
        }
      }
    }

    // Register partner-network color
    this.platformColorMap.set('partner-network', '#D97706');
  }
}
