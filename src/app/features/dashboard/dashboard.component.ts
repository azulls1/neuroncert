import { Component, DestroyRef, inject, computed, OnInit, Signal, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CurriculumService } from '../../core/services/curriculum.service';
import { ProgressService } from '../../core/services/progress.service';
import { ExamStateService } from '../../core/services/exam-state.service';
import { ConfigService } from '../../core/services/config.service';
import { LearningTrack, LearningLevel } from '../../core/models';
import { StatCardComponent } from '../../shared';
import { LoggingService } from '../../core/services/logging.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, StatCardComponent],
  template: `
    <div class="welcome">
      @if (hasResumableExam()) {
        <div
          class="alert alert-info"
          style="margin: 0 0 16px; border-radius: 12px; padding: 16px 20px;"
        >
          <div
            class="alert__content"
            style="display: flex; align-items: center; flex-wrap: wrap; gap: 8px;"
          >
            <div class="alert__title" style="margin-right: 4px;">Examen en progreso</div>
            <span>Tienes un examen sin terminar.</span>
            <a
              routerLink="/exam/run"
              (click)="resumeExam()"
              class="btn btn-primary"
              style="margin-left: 12px;"
              >Continuar Examen</a
            >
            <button (click)="dismissResumable()" class="btn btn-ghost" style="margin-left: 8px;">
              Descartar
            </button>
          </div>
        </div>
      }
      <!-- HERO -- Full-width gradient with animated elements -->
      <section class="hero">
        <div class="hero-bg">
          <!-- Animated gradient orbs -->
          <div class="hero-orb hero-orb-1"></div>
          <div class="hero-orb hero-orb-2"></div>
          <div class="hero-orb hero-orb-3"></div>
        </div>
        <div class="hero-content">
          <div class="animate-fadeInUp" style="margin-bottom: 16px;">
            <img
              src="/assets/icons/logo_ia_withe.webp"
              alt="Claude AI Learning Platform"
              style="width: 56px; height: 56px; border-radius: 12px; object-fit: contain;"
            />
          </div>
          <div class="hero-badge animate-fadeInUp">
            <span class="font-mono" style="font-size: 12px; letter-spacing: 0.1em;"
              >ECOSISTEMA CLAUDE AI</span
            >
          </div>
          <h1 class="hero-title animate-fadeInUp">
            Domina Claude.<br />
            <span class="hero-title-accent">Tu Ecosistema de Aprendizaje Completo.</span>
          </h1>
          <p class="hero-subtitle animate-fadeInUp">
            {{ trackCount() }}+ cursos en {{ platformCount() }} plataformas. {{ certCount() }}+
            certificaciones. {{ levelCount() }} niveles de aprendizaje. Desde principiante hasta
            experto certificado — todos los caminos estan aqui.
          </p>
          <div class="hero-actions animate-fadeInUp">
            <a routerLink="/roadmap" class="hero-btn-primary">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              Explorar Roadmap
            </a>
            <a routerLink="/tracks" class="hero-btn-secondary">
              Ver Todos los Tracks
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>
          <!-- Floating stat pills -->
          <div class="hero-pills animate-fadeInUp">
            <div class="hero-pill">
              <span class="hero-pill-value font-mono">{{ trackCount() }}+</span>
              <span class="hero-pill-label">Cursos</span>
            </div>
            <div class="hero-pill">
              <span class="hero-pill-value font-mono">{{ questionCount() }}+</span>
              <span class="hero-pill-label">Preguntas</span>
            </div>
            <div class="hero-pill">
              <span class="hero-pill-value font-mono">{{ levelCount() }}</span>
              <span class="hero-pill-label">Niveles</span>
            </div>
            <div class="hero-pill">
              <span class="hero-pill-value font-mono">{{ platformCount() }}</span>
              <span class="hero-pill-label">Plataformas</span>
            </div>
          </div>
        </div>
      </section>

      @if (catalogError()) {
        <div class="alert alert-warning">
          <div class="alert__content">
            <div class="alert__title">Error al cargar datos</div>
            <span>{{ catalogError() }}</span>
          </div>
        </div>
      }

      <!-- QUICK ACTIONS -- "What do you want to do?" -->
      <section class="actions-section">
        <h2 class="section-title font-display">Que te gustaria hacer?</h2>
        <div class="actions-grid">
          <!-- Learning Roadmap -->
          <a routerLink="/roadmap" class="action-card action-roadmap">
            <div class="action-icon">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <div class="action-content">
              <h3 class="action-title font-display">Ruta de Aprendizaje</h3>
              <p class="action-desc">
                Ruta paso a paso con {{ trackCount() }}+ cursos en {{ levelCount() }} niveles.
              </p>
            </div>
            <div class="action-arrow">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </a>

          <!-- All Certifications -->
          <a routerLink="/roadmap" fragment="certifications" class="action-card action-ccaf">
            <div class="action-icon">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                aria-hidden="true"
              >
                <circle cx="12" cy="8" r="6" />
                <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" />
              </svg>
            </div>
            <div class="action-content">
              <h3 class="action-title font-display">Todas las Certificaciones</h3>
              <p class="action-desc">
                {{ certCount() }}+ certificados disponibles. Academy, Coursera, DeepLearning.AI y
                mas.
              </p>
            </div>
            <div class="action-arrow">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </a>

          <!-- Learning Tracks -->
          <a routerLink="/tracks" class="action-card action-tracks">
            <div class="action-icon">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                aria-hidden="true"
              >
                <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
                <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
              </svg>
            </div>
            <div class="action-content">
              <h3 class="action-title font-display">Tracks de Aprendizaje</h3>
              <p class="action-desc">
                Explora cursos por plataforma y nivel. Encuentra tu siguiente habilidad.
              </p>
            </div>
            <div class="action-arrow">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </a>

          <!-- Practice & Exams -->
          <a routerLink="/exam/start" class="action-card action-practice">
            <div class="action-icon">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                aria-hidden="true"
              >
                <path
                  d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
                />
              </svg>
            </div>
            <div class="action-content">
              <h3 class="action-title font-display">Practica y Examenes</h3>
              <p class="action-desc">
                {{ questionCount() }}+ preguntas de practica. Simulador CCA-F, flashcards, repaso de
                conceptos.
              </p>
            </div>
            <div class="action-arrow">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </a>
        </div>
      </section>

      <!-- YOUR PROGRESS -->
      <section class="progress-section">
        <h2 class="section-title font-display">Tu Progreso</h2>
        <div class="stats-grid">
          <app-stat-card
            [value]="'' + overallProgress().tracksStarted"
            label="Tracks Iniciados"
            iconClass="stat-icon-tracks"
            [barPercent]="tracksPercentage()"
          >
            <svg
              slot="icon"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            </svg>
          </app-stat-card>

          <app-stat-card
            [value]="'' + overallProgress().totalExamsTaken"
            label="Examenes Completados"
            iconClass="stat-icon-exams"
            [barPercent]="examsPercentage()"
            barClass="stat-bar-green"
          >
            <svg
              slot="icon"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
          </app-stat-card>

          <app-stat-card
            [value]="
              overallProgress().ccafBestScore > 0 ? '' + overallProgress().ccafBestScore : '---'
            "
            label="Mejor Score CCA-F"
            iconClass="stat-icon-score"
            [barPercent]="ccafPercentage()"
            barClass="stat-bar-gold"
            [hint]="ccafPassingScore() + ' / ' + ccafMaxScore() + ' para aprobar'"
          >
            <svg
              slot="icon"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              />
            </svg>
          </app-stat-card>

          <app-stat-card
            [value]="certCount() + '+'"
            label="Certificados Disponibles"
            iconClass="stat-icon-certs"
            [hint]="'En ' + platformCount() + ' plataformas'"
          >
            <svg
              slot="icon"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18" />
              <path d="M9 21V9" />
            </svg>
          </app-stat-card>
        </div>
      </section>

      <!-- CERTIFICATION PATHS -->
      <section class="spotlight">
        <div class="spotlight-card">
          <div class="spotlight-bg"></div>
          <div class="spotlight-content">
            <div class="spotlight-badge font-mono">{{ certCount() }}+ CERTIFICADOS DISPONIBLES</div>
            <h2 class="spotlight-title font-display">Tus Rutas de Certificacion</h2>
            <p class="spotlight-desc">
              Multiples caminos para demostrar tu experiencia con Claude. Desde cursos gratuitos
              hasta certificaciones formales.
            </p>

            <div class="cert-paths">
              <!-- Formal cert -->
              <div class="cert-path-card">
                <div
                  class="cert-path-icon"
                  style="background: linear-gradient(135deg, #D97706, #F59E0B);"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                </div>
                <div class="cert-path-info">
                  <h3 class="cert-path-name font-display">Certificacion CCA-F</h3>
                  <p class="cert-path-detail">
                    Examen supervisado. {{ ccafTotalQuestions() }} preguntas,
                    {{ ccafPassingScore() }}/{{ ccafMaxScore() }} para aprobar. Badge digital via
                    Credly.
                  </p>
                  <span class="cert-path-meta font-mono">$0 - $99</span>
                </div>
              </div>

              <!-- Academy certs -->
              <div class="cert-path-card">
                <div
                  class="cert-path-icon"
                  style="background: linear-gradient(135deg, #04202C, #304040);"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                  >
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5" />
                  </svg>
                </div>
                <div class="cert-path-info">
                  <h3 class="cert-path-name font-display">Anthropic Academy</h3>
                  <p class="cert-path-detail">
                    {{ academyTrackCount() }} certificados de completacion gratuitos. Oficiales de
                    Anthropic en Skilljar.
                  </p>
                  <span class="cert-path-meta font-mono">GRATIS</span>
                </div>
              </div>

              <!-- Coursera certs -->
              <div class="cert-path-card">
                <div
                  class="cert-path-icon"
                  style="background: linear-gradient(135deg, #0056D2, #2563EB);"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polygon points="10 8 16 12 10 16 10 8" />
                  </svg>
                </div>
                <div class="cert-path-info">
                  <h3 class="cert-path-name font-display">Certificados Coursera</h3>
                  <p class="cert-path-detail">
                    {{ courseraTrackCount() }} certificados disponibles. Anthropic, Vanderbilt,
                    Edureka.
                  </p>
                  <span class="cert-path-meta font-mono">~$49/mo</span>
                </div>
              </div>

              <!-- DeepLearning.AI -->
              <div class="cert-path-card">
                <div
                  class="cert-path-icon"
                  style="background: linear-gradient(135deg, #FF6F00, #FF9800);"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 2a10 10 0 0110 10 10 10 0 01-10 10A10 10 0 012 12 10 10 0 0112 2z"
                    />
                    <path d="M12 8v4l3 3" />
                  </svg>
                </div>
                <div class="cert-path-info">
                  <h3 class="cert-path-name font-display">DeepLearning.AI</h3>
                  <p class="cert-path-detail">
                    {{ deeplearningTrackCount() }} certificados gratuitos de cursos cortos. Con
                    Andrew Ng y equipo Anthropic.
                  </p>
                  <span class="cert-path-meta font-mono">GRATIS</span>
                </div>
              </div>

              <!-- Upcoming -->
              <div class="cert-path-card" style="opacity: 0.6;">
                <div
                  class="cert-path-icon"
                  style="background: linear-gradient(135deg, #6B7280, #9CA3AF);"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </div>
                <div class="cert-path-info">
                  <h3 class="cert-path-name font-display">Proximamente S2 2026</h3>
                  <p class="cert-path-detail">
                    Certificaciones Seller, Developer y Advanced Architect anunciadas.
                  </p>
                  <span class="cert-path-meta font-mono">POR VENIR</span>
                </div>
              </div>
            </div>

            <div class="spotlight-actions" style="margin-top: 28px;">
              <a routerLink="/roadmap" class="hero-btn-primary" style="padding: 10px 24px;">
                Ver Roadmap Completo
              </a>
              <a routerLink="/ccaf" class="hero-btn-secondary" style="padding: 10px 24px;">
                Practicar CCA-F
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .welcome {
        overflow: hidden;
      }

      /* ====== HERO ====== */
      .hero {
        position: relative;
        min-height: 480px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 60px 24px 48px;
        overflow: hidden;
        background: linear-gradient(135deg, #04202c 0%, #1a3036 30%, #304040 60%, #5b7065 100%);
        border-radius: 0 0 32px 32px;
        margin: -40px -48px 0;
      }

      @media (min-width: 640px) {
        .hero {
          min-height: 520px;
          padding: 80px 40px 60px;
          margin: -40px -48px 0;
        }
      }

      @media (min-width: 1440px) {
        .hero {
          margin: -40px -64px 0;
        }
      }

      .hero-bg {
        position: absolute;
        inset: 0;
        overflow: hidden;
      }

      .hero-orb {
        position: absolute;
        border-radius: 50%;
        filter: blur(80px);
        opacity: 0.3;
      }

      .hero-orb-1 {
        width: 400px;
        height: 400px;
        background: #5b7065;
        top: -100px;
        right: -100px;
        animation: orbFloat1 8s ease-in-out infinite;
      }

      .hero-orb-2 {
        width: 300px;
        height: 300px;
        background: #9eada3;
        bottom: -50px;
        left: -50px;
        animation: orbFloat2 10s ease-in-out infinite;
      }

      .hero-orb-3 {
        width: 200px;
        height: 200px;
        background: #c9d1c8;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        animation: orbFloat3 12s ease-in-out infinite;
      }

      @keyframes orbFloat1 {
        0%,
        100% {
          transform: translate(0, 0) scale(1);
        }
        50% {
          transform: translate(-30px, 20px) scale(1.1);
        }
      }

      @keyframes orbFloat2 {
        0%,
        100% {
          transform: translate(0, 0) scale(1);
        }
        50% {
          transform: translate(20px, -30px) scale(1.05);
        }
      }

      @keyframes orbFloat3 {
        0%,
        100% {
          transform: translate(-50%, -50%) scale(1);
          opacity: 0.2;
        }
        50% {
          transform: translate(-50%, -50%) scale(1.2);
          opacity: 0.4;
        }
      }

      .hero-content {
        position: relative;
        z-index: 2;
        text-align: center;
        max-width: 720px;
      }

      .hero-badge {
        display: inline-block;
        padding: 6px 16px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 9999px;
        color: #c9d1c8;
        margin-bottom: 24px;
        backdrop-filter: blur(8px);
        background: rgba(255, 255, 255, 0.05);
      }

      .hero-title {
        font-family: 'Sora', sans-serif;
        font-size: 2.5rem;
        font-weight: 700;
        color: white;
        line-height: 1.1;
        margin: 0 0 20px;
        letter-spacing: -0.02em;
      }

      @media (min-width: 640px) {
        .hero-title {
          font-size: 3.5rem;
        }
      }

      @media (min-width: 1024px) {
        .hero-title {
          font-size: 4rem;
        }
      }

      .hero-title-accent {
        background: linear-gradient(135deg, #9eada3, #c9d1c8, #ffffff);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .hero-subtitle {
        font-size: 1rem;
        color: #7d9088;
        line-height: 1.6;
        margin: 0 0 32px;
        max-width: 540px;
        margin-left: auto;
        margin-right: auto;
      }

      @media (min-width: 640px) {
        .hero-subtitle {
          font-size: 1.125rem;
        }
      }

      .hero-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
        flex-wrap: wrap;
        margin-bottom: 40px;
      }

      .hero-btn-primary {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 12px 28px;
        background: white;
        color: #04202c;
        font-weight: 600;
        font-size: 14px;
        border-radius: 12px;
        text-decoration: none;
        transition: all 0.25s cubic-bezier(0.25, 0.1, 0.25, 1);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      }

      .hero-btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      }

      .hero-btn-secondary {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 12px 28px;
        background: transparent;
        color: white;
        font-weight: 500;
        font-size: 14px;
        border: 1px solid rgba(255, 255, 255, 0.25);
        border-radius: 12px;
        text-decoration: none;
        transition: all 0.25s ease;
      }

      .hero-btn-secondary:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.4);
      }

      .hero-pills {
        display: flex;
        justify-content: center;
        gap: 12px;
        flex-wrap: wrap;
      }

      .hero-pill {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 12px 20px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        backdrop-filter: blur(8px);
        min-width: 80px;
      }

      .hero-pill-value {
        font-size: 20px;
        font-weight: 700;
        color: white;
        line-height: 1;
      }

      .hero-pill-label {
        font-size: 11px;
        color: #7d9088;
        margin-top: 4px;
      }

      /* ====== ACTIONS ====== */
      .actions-section {
        padding: 48px 0 0;
      }

      .section-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: #04202c;
        margin-bottom: 24px;
      }

      .actions-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 12px;
      }

      @media (min-width: 640px) {
        .actions-grid {
          grid-template-columns: 1fr 1fr;
        }
      }

      .action-card {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 20px;
        background: white;
        border: 1px solid #eff2f0;
        border-radius: 16px;
        text-decoration: none;
        color: inherit;
        transition: all 0.25s cubic-bezier(0.25, 0.1, 0.25, 1);
        cursor: pointer;
      }

      .action-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 32px rgba(4, 32, 44, 0.08);
        border-color: #c9d1c8;
      }

      .action-card:hover .action-arrow {
        transform: translateX(4px);
        opacity: 1;
      }

      .action-card:hover .action-icon {
        transform: scale(1.1);
      }

      .action-icon {
        width: 52px;
        height: 52px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: transform 0.25s ease;
      }

      .action-ccaf .action-icon {
        background: linear-gradient(135deg, #04202c, #304040);
        color: white;
      }
      .action-tracks .action-icon {
        background: linear-gradient(135deg, #304040, #5b7065);
        color: white;
      }
      .action-roadmap .action-icon {
        background: linear-gradient(135deg, #5b7065, #9eada3);
        color: white;
      }
      .action-practice .action-icon {
        background: linear-gradient(135deg, #1a3036, #5b7065);
        color: white;
      }

      .action-content {
        flex: 1;
        min-width: 0;
      }
      .action-title {
        font-size: 15px;
        font-weight: 600;
        color: #04202c;
        margin: 0 0 4px;
      }
      .action-desc {
        font-size: 12px;
        color: #5b6b62;
        margin: 0;
        line-height: 1.4;
      }

      .action-arrow {
        color: #7d9088;
        flex-shrink: 0;
        opacity: 0.5;
        transition: all 0.25s ease;
      }

      /* ====== PROGRESS STATS ====== */
      .progress-section {
        padding: 48px 0 0;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      @media (min-width: 768px) {
        .stats-grid {
          grid-template-columns: repeat(4, 1fr);
        }
      }

      /* ====== CCA-F SPOTLIGHT ====== */
      .spotlight {
        padding: 48px 0 16px;
      }

      .spotlight-card {
        position: relative;
        border-radius: 20px;
        overflow: hidden;
        background: linear-gradient(135deg, #04202c 0%, #1a3036 40%, #304040 100%);
        padding: 40px 32px;
        color: white;
      }

      @media (min-width: 640px) {
        .spotlight-card {
          padding: 48px 40px;
        }
      }

      .spotlight-bg {
        position: absolute;
        inset: 0;
        background: radial-gradient(
          ellipse at top right,
          rgba(91, 112, 101, 0.3) 0%,
          transparent 60%
        );
      }

      .spotlight-content {
        position: relative;
        z-index: 2;
      }

      .spotlight-badge {
        display: inline-block;
        padding: 4px 12px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        color: #7d9088;
        font-size: 11px;
        letter-spacing: 0.1em;
        margin-bottom: 16px;
      }

      .spotlight-title {
        font-size: 1.75rem;
        font-weight: 700;
        margin: 0 0 12px;
        line-height: 1.2;
      }

      @media (min-width: 640px) {
        .spotlight-title {
          font-size: 2rem;
        }
      }

      .spotlight-desc {
        font-size: 14px;
        color: #c9d1c8;
        margin: 0 0 24px;
        max-width: 560px;
        line-height: 1.6;
      }

      .spotlight-actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }

      /* ====== CERT PATHS ====== */
      .cert-paths {
        display: grid;
        grid-template-columns: 1fr;
        gap: 10px;
        margin-top: 20px;
      }

      @media (min-width: 640px) {
        .cert-paths {
          grid-template-columns: 1fr 1fr;
        }
      }

      .cert-path-card {
        display: flex;
        align-items: flex-start;
        gap: 14px;
        padding: 16px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        transition: all 0.2s ease;
      }

      .cert-path-card:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.15);
      }

      .cert-path-icon {
        width: 44px;
        height: 44px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        color: white;
      }

      .cert-path-info {
        flex: 1;
        min-width: 0;
      }
      .cert-path-name {
        font-size: 14px;
        font-weight: 600;
        color: white;
        margin: 0 0 4px;
      }
      .cert-path-detail {
        font-size: 11px;
        color: #c9d1c8;
        margin: 0;
        line-height: 1.4;
      }
      .cert-path-meta {
        font-size: 10px;
        color: #7d9088;
        margin-top: 6px;
        display: inline-block;
      }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private curriculum = inject(CurriculumService);
  private progress = inject(ProgressService);
  private examState = inject(ExamStateService);
  private logger = inject(LoggingService);
  private readonly configSvc = inject(ConfigService);

  /** Signal refs from services */
  private tracks: Signal<LearningTrack[]> = this.curriculum.getTracks();
  private levels: Signal<LearningLevel[]> = this.curriculum.getLevels();

  /** Overall progress from ProgressService */
  overallProgress = this.progress.getOverallProgress();

  // ---------------------------------------------------------------------------
  // Computed stats from catalog data
  // ---------------------------------------------------------------------------

  /** Total number of tracks (courses) in the catalog */
  trackCount = computed(() => this.tracks().length || 0);

  /** Total questions available across all CCA-F domains */
  questionCount = computed(() => {
    const ccaf = this.curriculum.getCCAFConfig();
    if (!ccaf) return 0;
    return ccaf.domains.reduce((sum, d) => sum + d.totalQuestions, 0);
  });

  /** Number of learning levels */
  levelCount = computed(() => this.levels().length || 0);

  /** Number of unique platforms */
  platformCount = computed(() => {
    const platforms = new Set(this.tracks().map((t) => t.platform));
    return platforms.size || 0;
  });

  /** Number of tracks that offer certifications (have 'exam' content type) */
  certCount = computed(() => {
    // All tracks are cert-bearing in this ecosystem
    return this.tracks().length || 0;
  });

  // ---------------------------------------------------------------------------
  // CCA-F config signals
  // ---------------------------------------------------------------------------

  /** CCA-F passing score from config */
  ccafPassingScore = computed(() => {
    const ccaf = this.curriculum.getCCAFConfig();
    return ccaf?.passingScore ?? this.configSvc.ccafPassingScore;
  });

  /** CCA-F max score from config */
  ccafMaxScore = computed(() => {
    const ccaf = this.curriculum.getCCAFConfig();
    return ccaf?.maxScore ?? this.configSvc.ccafMaxScore;
  });

  /** CCA-F total questions per exam from config */
  ccafTotalQuestions = computed(() => {
    const ccaf = this.curriculum.getCCAFConfig();
    return ccaf?.totalQuestions ?? this.configSvc.ccafQuestionCount;
  });

  // ---------------------------------------------------------------------------
  // Per-platform track counts
  // ---------------------------------------------------------------------------

  /** Tracks on Anthropic Academy */
  academyTrackCount = computed(
    () => this.tracks().filter((t) => t.platform === 'academy').length || 0,
  );

  /** Tracks on Coursera */
  courseraTrackCount = computed(
    () => this.tracks().filter((t) => t.platform === 'coursera').length || 0,
  );

  /** Tracks on DeepLearning.AI */
  deeplearningTrackCount = computed(
    () => this.tracks().filter((t) => t.platform === 'deeplearning-ai').length || 0,
  );

  // ---------------------------------------------------------------------------
  // Progress percentages
  // ---------------------------------------------------------------------------

  /** Percentage of tracks started out of total available */
  tracksPercentage = computed(() => {
    const p = this.overallProgress();
    const totalTracks = this.trackCount();
    if (totalTracks === 0) return 0;
    return Math.min(100, (p.tracksStarted / totalTracks) * 100);
  });

  /** Percentage indicator for exams taken relative to total tracks */
  examsPercentage = computed(() => {
    const totalTracks = this.trackCount();
    if (totalTracks === 0) return 0;
    return Math.min(100, (this.overallProgress().totalExamsTaken / totalTracks) * 100);
  });

  /** CCA-F best score as a percentage of max score */
  ccafPercentage = computed(() => {
    const score = this.overallProgress().ccafBestScore;
    const maxScore = this.ccafMaxScore();
    return score > 0 ? (score / maxScore) * 100 : 0;
  });

  /** Error state for catalog loading */
  catalogError = signal<string | null>(null);

  /** Whether there's a resumable exam in localStorage */
  hasResumableExam = computed(() => this.examState.hasResumableExam());

  /** Resumes the saved exam and navigates to the run screen */
  resumeExam(): void {
    this.examState.resumeSavedExam();
  }

  /** Discards the saved exam progress */
  dismissResumable(): void {
    this.examState.clearSavedProgress();
  }

  ngOnInit(): void {
    this.curriculum
      .loadCatalog()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (err) => {
          this.logger.error('Catalog load failed', 'Dashboard', err);
          this.catalogError.set('No se pudo cargar el catalogo de cursos.');
        },
      });
  }
}
