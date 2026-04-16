import { Routes } from '@angular/router';
import {
  examRunGuard,
  examSubmitGuard,
  examReviewGuard,
  examResultsGuard,
  ccafResultsGuard,
} from './core/guards/exam.guard';
import { examLeaveGuard } from './core/guards/exam-leave.guard';

/**
 * Route tree for the Claude AI Learning Platform
 * Includes dashboard, learning tracks, CCA-F certification, and exam flow
 */
export const routes: Routes = [
  // Dashboard — main landing page
  {
    path: '',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    title: 'Claude AI Learning Platform',
  },

  // Learning tracks browser
  {
    path: 'tracks',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/tracks/track-list/track-list.component').then(
            (m) => m.TrackListComponent,
          ),
        title: 'Learning Tracks — Claude AI',
        data: { skipPrerender: true },
      },
      {
        path: ':trackId',
        loadComponent: () =>
          import('./features/tracks/track-detail/track-detail.component').then(
            (m) => m.TrackDetailComponent,
          ),
        title: 'Track Detail',
        data: { skipPrerender: true },
      },
      {
        path: ':trackId/theory',
        loadComponent: () =>
          import('./features/tracks/track-theory/track-theory.component').then(
            (m) => m.TrackTheoryComponent,
          ),
        title: 'Theory & Study',
        data: { skipPrerender: true },
      },
      {
        path: ':trackId/practice',
        loadComponent: () =>
          import('./features/tracks/track-practice/track-practice.component').then(
            (m) => m.TrackPracticeComponent,
          ),
        title: 'Practice',
        data: { skipPrerender: true },
      },
    ],
  },

  // Learning roadmap
  {
    path: 'roadmap',
    loadComponent: () =>
      import('./features/roadmap/roadmap.component').then((m) => m.RoadmapComponent),
    title: 'Learning Roadmap',
    data: { skipPrerender: true },
  },

  // All certifications hub
  {
    path: 'certifications',
    loadComponent: () =>
      import('./features/certifications/certifications.component').then(
        (m) => m.CertificationsComponent,
      ),
    title: 'All Certifications — Claude AI',
    data: { skipPrerender: true },
  },

  // CCA-F certification section
  {
    path: 'ccaf',
    loadComponent: () =>
      import('./features/ccaf/ccaf-home/ccaf-home.component').then((m) => m.CCAFHomeComponent),
    title: 'CCA-F Certification — Claude AI',
    data: { skipPrerender: true },
  },
  {
    path: 'ccaf/exam',
    loadComponent: () =>
      import('./features/ccaf/ccaf-exam/ccaf-exam.component').then((m) => m.CCAFExamComponent),
    title: 'Configure CCA-F Exam — Claude AI',
    data: { skipPrerender: true },
  },
  {
    path: 'ccaf/results',
    loadComponent: () =>
      import('./features/ccaf/ccaf-results/ccaf-results.component').then(
        (m) => m.CCAFResultsComponent,
      ),
    title: 'CCA-F Results',
    canActivate: [ccafResultsGuard],
    data: { skipPrerender: true },
  },

  // Exam flow
  {
    path: 'exam',
    children: [
      {
        path: 'start',
        loadComponent: () =>
          import('./features/exam/start/start.component').then((m) => m.StartComponent),
        title: 'Configure Exam — Claude AI',
        data: { skipPrerender: true },
      },
      {
        path: 'run',
        loadComponent: () =>
          import('./features/exam/run/run.component').then((m) => m.RunComponent),
        title: 'Exam in Progress',
        canActivate: [examRunGuard],
        canDeactivate: [examLeaveGuard],
        data: { skipPrerender: true },
      },
      {
        path: 'submit',
        loadComponent: () =>
          import('./features/exam/submit/submit.component').then((m) => m.SubmitComponent),
        title: 'Submit Exam — Claude AI',
        canActivate: [examSubmitGuard],
        data: { skipPrerender: true },
      },
      {
        path: 'review',
        loadComponent: () =>
          import('./features/exam/review/review.component').then((m) => m.ReviewComponent),
        title: 'Exam Review — Claude AI',
        canActivate: [examReviewGuard],
        data: { skipPrerender: true },
      },
      {
        path: 'results',
        loadComponent: () =>
          import('./features/exam/results/results.component').then((m) => m.ResultsComponent),
        title: 'Exam Results — Claude AI',
        canActivate: [examResultsGuard],
        data: { skipPrerender: true },
      },
      {
        path: 'history',
        loadComponent: () =>
          import('./features/exam/history/history.component').then((m) => m.HistoryComponent),
        title: 'Historial de Examenes — Claude AI',
        data: { skipPrerender: true },
      },
    ],
  },

  // Study mode (flashcards + concept review)
  {
    path: 'study',
    children: [
      {
        path: 'flashcards/:trackId',
        loadComponent: () =>
          import('./features/study/flashcard/flashcard.component').then(
            (m) => m.FlashcardComponent,
          ),
        title: 'Flashcards',
        data: { skipPrerender: true },
      },
      {
        path: 'review/:trackId',
        loadComponent: () =>
          import('./features/study/concept-review/concept-review.component').then(
            (m) => m.ConceptReviewComponent,
          ),
        title: 'Concept Review',
        data: { skipPrerender: true },
      },
    ],
  },

  // 404 Not Found
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then((m) => m.NotFoundComponent),
    title: '404 — Claude AI',
  },
];
