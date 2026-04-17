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
    <div class="overflow-hidden">
      @if (hasResumableExam()) {
        <div class="alert alert-info mb-4 rounded-xl px-5 py-4">
          <div class="alert__content flex items-center flex-wrap gap-2">
            <div class="alert__title mr-1">Examen en progreso</div>
            <span>Tienes un examen sin terminar.</span>
            <a
              routerLink="/exam/run"
              (click)="resumeExam()"
              class="btn btn-primary ml-3"
              >Continuar Examen</a
            >
            <button (click)="dismissResumable()" class="btn btn-ghost ml-2">
              Descartar
            </button>
          </div>
        </div>
      }
      <!-- HERO -- Full-width gradient with animated elements -->
      <section class="card-hero dark-surface relative min-h-[480px] sm:min-h-[520px] flex items-center justify-center !rounded-none !rounded-b-[32px] !px-6 !py-15 sm:!px-10 sm:!py-20 -mx-8 sm:-mx-12 2xl:-mx-16 -mt-10"
        style="background: linear-gradient(135deg, #04202c 0%, #1a3036 30%, #304040 60%, #5b7065 100%);">
        <div class="absolute inset-0 overflow-hidden">
          <!-- Animated gradient orbs -->
          <div class="absolute rounded-full blur-[80px] opacity-30 w-[400px] h-[400px] bg-pine -top-[100px] -right-[100px] animate-[orbFloat1_8s_ease-in-out_infinite]"></div>
          <div class="absolute rounded-full blur-[80px] opacity-30 w-[300px] h-[300px] bg-moss -bottom-[50px] -left-[50px] animate-[orbFloat2_10s_ease-in-out_infinite]"></div>
          <div class="absolute rounded-full blur-[80px] opacity-30 w-[200px] h-[200px] bg-fog top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-[orbFloat3_12s_ease-in-out_infinite]"></div>
        </div>
        <div class="relative z-2 text-center max-w-[720px]">
          <div class="animate-fadeInUp mb-4">
            <img
              src="/assets/icons/logo_ia_withe.webp"
              alt="Claude AI Learning Platform"
              class="w-14 h-14 rounded-xl object-contain"
            />
          </div>
          <div class="badge--on-dark animate-fadeInUp inline-block rounded-full px-4 py-1.5 mb-6 backdrop-blur-sm">
            <span class="font-mono text-xs tracking-widest">ECOSISTEMA CLAUDE AI</span>
          </div>
          <h1 class="card-hero__title animate-fadeInUp !text-[2.5rem] sm:!text-[3.5rem] lg:!text-[4rem] !leading-[1.1] !mb-5 tracking-tight">
            Domina Claude.<br />
            <span class="bg-gradient-to-br from-moss via-fog to-white bg-clip-text text-transparent">Tu Ecosistema de Aprendizaje Completo.</span>
          </h1>
          <p class="card-hero__desc animate-fadeInUp text-on-dark-dim !text-base sm:!text-lg !leading-relaxed !mb-8 !max-w-[540px]">
            {{ trackCount() }}+ cursos en {{ platformCount() }} plataformas. {{ certCount() }}+
            certificaciones. {{ levelCount() }} niveles de aprendizaje. Desde principiante hasta
            experto certificado — todos los caminos estan aqui.
          </p>
          <div class="flex gap-3 justify-center flex-wrap mb-10 animate-fadeInUp">
            <a routerLink="/roadmap" class="btn rounded-xl px-7 py-3 font-semibold text-sm no-underline shadow-lg hover-lift bg-forest text-white">
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
            <a routerLink="/tracks" class="btn rounded-xl px-7 py-3 font-medium text-sm no-underline bg-white/15 text-white border border-white/40 hover:bg-white/25">
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
          <div class="flex justify-center gap-3 flex-wrap animate-fadeInUp">
            <div class="card--on-dark flex flex-col items-center px-5 py-3 rounded-xl min-w-[80px] !backdrop-blur-sm">
              <span class="font-mono text-xl font-bold text-on-dark leading-none">{{ trackCount() }}+</span>
              <span class="text-on-dark-dim text-[11px] mt-1">Cursos</span>
            </div>
            <div class="card--on-dark flex flex-col items-center px-5 py-3 rounded-xl min-w-[80px] !backdrop-blur-sm">
              <span class="font-mono text-xl font-bold text-on-dark leading-none">{{ questionCount() }}+</span>
              <span class="text-on-dark-dim text-[11px] mt-1">Preguntas</span>
            </div>
            <div class="card--on-dark flex flex-col items-center px-5 py-3 rounded-xl min-w-[80px] !backdrop-blur-sm">
              <span class="font-mono text-xl font-bold text-on-dark leading-none">{{ levelCount() }}</span>
              <span class="text-on-dark-dim text-[11px] mt-1">Niveles</span>
            </div>
            <div class="card--on-dark flex flex-col items-center px-5 py-3 rounded-xl min-w-[80px] !backdrop-blur-sm">
              <span class="font-mono text-xl font-bold text-on-dark leading-none">{{ platformCount() }}</span>
              <span class="text-on-dark-dim text-[11px] mt-1">Plataformas</span>
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
      <section class="pt-12">
        <h2 class="font-display text-2xl font-bold text-forest mb-6">Que te gustaria hacer?</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <!-- Learning Roadmap -->
          <a routerLink="/roadmap" class="card-feature hover-lift flex items-center gap-4 no-underline text-inherit cursor-pointer">
            <div class="card-feature__icon !w-[52px] !h-[52px] !rounded-[14px] !mb-0 shrink-0"
              style="background: linear-gradient(135deg, #5b7065, #9eada3); color: white;">
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
            <div class="flex-1 min-w-0">
              <h3 class="font-display text-[15px] font-semibold text-forest m-0 mb-1">Ruta de Aprendizaje</h3>
              <p class="text-xs text-gray-600 m-0 leading-snug">
                Ruta paso a paso con {{ trackCount() }}+ cursos en {{ levelCount() }} niveles.
              </p>
            </div>
            <div class="text-gray-400 shrink-0 opacity-50 transition-all duration-250">
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
          <a routerLink="/roadmap" fragment="certifications" class="card-feature hover-lift flex items-center gap-4 no-underline text-inherit cursor-pointer">
            <div class="card-feature__icon !w-[52px] !h-[52px] !rounded-[14px] !mb-0 shrink-0"
              style="background: linear-gradient(135deg, #04202c, #304040); color: white;">
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
            <div class="flex-1 min-w-0">
              <h3 class="font-display text-[15px] font-semibold text-forest m-0 mb-1">Todas las Certificaciones</h3>
              <p class="text-xs text-gray-600 m-0 leading-snug">
                {{ certCount() }}+ certificados disponibles. Academy, Coursera, DeepLearning.AI y
                mas.
              </p>
            </div>
            <div class="text-gray-400 shrink-0 opacity-50 transition-all duration-250">
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
          <a routerLink="/tracks" class="card-feature hover-lift flex items-center gap-4 no-underline text-inherit cursor-pointer">
            <div class="card-feature__icon !w-[52px] !h-[52px] !rounded-[14px] !mb-0 shrink-0"
              style="background: linear-gradient(135deg, #304040, #5b7065); color: white;">
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
            <div class="flex-1 min-w-0">
              <h3 class="font-display text-[15px] font-semibold text-forest m-0 mb-1">Tracks de Aprendizaje</h3>
              <p class="text-xs text-gray-600 m-0 leading-snug">
                Explora cursos por plataforma y nivel. Encuentra tu siguiente habilidad.
              </p>
            </div>
            <div class="text-gray-400 shrink-0 opacity-50 transition-all duration-250">
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
          <a routerLink="/exam/start" class="card-feature hover-lift flex items-center gap-4 no-underline text-inherit cursor-pointer">
            <div class="card-feature__icon !w-[52px] !h-[52px] !rounded-[14px] !mb-0 shrink-0"
              style="background: linear-gradient(135deg, #1a3036, #5b7065); color: white;">
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
            <div class="flex-1 min-w-0">
              <h3 class="font-display text-[15px] font-semibold text-forest m-0 mb-1">Practica y Examenes</h3>
              <p class="text-xs text-gray-600 m-0 leading-snug">
                {{ questionCount() }}+ preguntas de practica. Simulador CCA-F, flashcards, repaso de
                conceptos.
              </p>
            </div>
            <div class="text-gray-400 shrink-0 opacity-50 transition-all duration-250">
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
      <section class="pt-12">
        <h2 class="font-display text-2xl font-bold text-forest mb-6">Tu Progreso</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
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
      <section class="pt-12 pb-4">
        <div class="card-hero dark-surface relative !rounded-[20px] !px-8 !py-10 sm:!px-10 sm:!py-12">
          <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(91,112,101,0.3)_0%,_transparent_60%)]"></div>
          <div class="relative z-2">
            <div class="tag--on-dark font-mono !text-[11px] !tracking-widest text-on-dark-dim mb-4">{{ certCount() }}+ CERTIFICADOS DISPONIBLES</div>
            <h2 class="card-hero__title font-display !text-left !text-[1.75rem] sm:!text-[2rem] !leading-tight !mb-3">Tus Rutas de Certificacion</h2>
            <p class="card-hero__desc !text-left !text-sm !leading-relaxed !mb-6 !max-w-[560px] !mx-0">
              Multiples caminos para demostrar tu experiencia con Claude. Desde cursos gratuitos
              hasta certificaciones formales.
            </p>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-5">
              <!-- Formal cert -->
              <div class="card--on-dark flex items-start gap-3.5 !p-4 !rounded-xl transition-fast">
                <div class="w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0 text-white"
                  style="background: linear-gradient(135deg, #D97706, #F59E0B);">
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
                <div class="flex-1 min-w-0">
                  <h3 class="font-display text-sm font-semibold text-on-dark m-0 mb-1">Certificacion CCA-F</h3>
                  <p class="text-[11px] text-on-dark-muted m-0 leading-snug">
                    Examen supervisado. {{ ccafTotalQuestions() }} preguntas,
                    {{ ccafPassingScore() }}/{{ ccafMaxScore() }} para aprobar. Badge digital via
                    Credly.
                  </p>
                  <span class="font-mono text-[10px] text-on-dark-dim inline-block mt-1.5">$0 - $99</span>
                </div>
              </div>

              <!-- Academy certs -->
              <div class="card--on-dark flex items-start gap-3.5 !p-4 !rounded-xl transition-fast">
                <div class="w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0 text-white"
                  style="background: linear-gradient(135deg, #04202C, #304040);">
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
                <div class="flex-1 min-w-0">
                  <h3 class="font-display text-sm font-semibold text-on-dark m-0 mb-1">Anthropic Academy</h3>
                  <p class="text-[11px] text-on-dark-muted m-0 leading-snug">
                    {{ academyTrackCount() }} certificados de completacion gratuitos. Oficiales de
                    Anthropic en Skilljar.
                  </p>
                  <span class="font-mono text-[10px] text-on-dark-dim inline-block mt-1.5">GRATIS</span>
                </div>
              </div>

              <!-- Coursera certs -->
              <div class="card--on-dark flex items-start gap-3.5 !p-4 !rounded-xl transition-fast">
                <div class="w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0 text-white"
                  style="background: linear-gradient(135deg, #0056D2, #2563EB);">
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
                <div class="flex-1 min-w-0">
                  <h3 class="font-display text-sm font-semibold text-on-dark m-0 mb-1">Certificados Coursera</h3>
                  <p class="text-[11px] text-on-dark-muted m-0 leading-snug">
                    {{ courseraTrackCount() }} certificados disponibles. Anthropic, Vanderbilt,
                    Edureka.
                  </p>
                  <span class="font-mono text-[10px] text-on-dark-dim inline-block mt-1.5">~$49/mo</span>
                </div>
              </div>

              <!-- DeepLearning.AI -->
              <div class="card--on-dark flex items-start gap-3.5 !p-4 !rounded-xl transition-fast">
                <div class="w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0 text-white"
                  style="background: linear-gradient(135deg, #FF6F00, #FF9800);">
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
                <div class="flex-1 min-w-0">
                  <h3 class="font-display text-sm font-semibold text-on-dark m-0 mb-1">DeepLearning.AI</h3>
                  <p class="text-[11px] text-on-dark-muted m-0 leading-snug">
                    {{ deeplearningTrackCount() }} certificados gratuitos de cursos cortos. Con
                    Andrew Ng y equipo Anthropic.
                  </p>
                  <span class="font-mono text-[10px] text-on-dark-dim inline-block mt-1.5">GRATIS</span>
                </div>
              </div>

              <!-- Upcoming -->
              <div class="card--on-dark flex items-start gap-3.5 !p-4 !rounded-xl transition-fast opacity-60">
                <div class="w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0 text-white"
                  style="background: linear-gradient(135deg, #6B7280, #9CA3AF);">
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
                <div class="flex-1 min-w-0">
                  <h3 class="font-display text-sm font-semibold text-on-dark m-0 mb-1">Proximamente S2 2026</h3>
                  <p class="text-[11px] text-on-dark-muted m-0 leading-snug">
                    Certificaciones Seller, Developer y Advanced Architect anunciadas.
                  </p>
                  <span class="font-mono text-[10px] text-on-dark-dim inline-block mt-1.5">POR VENIR</span>
                </div>
              </div>
            </div>

            <div class="flex gap-3 flex-wrap mt-7">
              <a routerLink="/roadmap" class="btn rounded-xl px-6 py-2.5 font-semibold text-sm no-underline hover-lift bg-forest text-white">
                Ver Roadmap Completo
              </a>
              <a routerLink="/ccaf" class="btn rounded-xl px-6 py-2.5 font-medium text-sm no-underline bg-white/15 text-white border border-white/40 hover:bg-white/25">
                Practicar CCA-F
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [],
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
