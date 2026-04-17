# NeuronCert

Plataforma de estudio y simulacion de examenes para la certificacion **CCA-F (Claude Certified Associate - Foundational)**.

Banco de **800+ preguntas bilingues** (EN/ES) con scoring ponderado por dominio, persistencia offline-first y deploy containerizado.

## Stack

| Capa | Tecnologia |
|------|-----------|
| Framework | Angular 20 (standalone, signals, zoneless) |
| Styling | Tailwind CSS 4 + Forest Design System |
| Backend | Supabase (self-hosted) |
| Deploy | Docker (Node 22 + Nginx 1.27, multi-stage) |
| Testing | Karma + Jasmine |
| CI/CD | GitHub Actions |

## Arquitectura

```
src/app/
├── core/
│   ├── guards/          5 functional guards + leave guard
│   ├── models/          14 interfaces TypeScript
│   ├── services/        11 servicios core
│   ├── interceptors/    Resilience (retry + timeout + circuit breaker)
│   └── utils/           exam.utils.ts, circuit-breaker.ts
├── features/
│   ├── dashboard/       Hero + quick actions + resume exam
│   ├── exam/            start -> run -> submit -> review -> results -> history
│   ├── ccaf/            Simulacion certificacion CCA-F (0-1000, aprobatorio 720)
│   ├── tracks/          Tracks de aprendizaje por nivel
│   ├── study/           Flashcards + concept review
│   ├── roadmap/         Ruta de aprendizaje + dominios CCA-F
│   └── certifications/  Catalogo de 40+ certificaciones
└── shared/              question-card, timer-badge, progress-steps, stat-card
```

## Banco de Preguntas

- **806 preguntas** en 44 archivos JSON
- **6 dominios CCA-F**: Agentic Architecture, Tool Design & MCP, Claude Code Config, Prompt Engineering, Context & Reliability, Scenarios
- **5 plataformas**: Academy (19 tracks), Coursera (16), DeepLearning.AI (4), Third-party (2), CCA-F (1)
- **3 dificultades**: easy, medium, hard
- Todas bilingues EN/ES con explicaciones detalladas

## Scoring CCA-F

Escala ponderada 0-1000 por dominio. Cada dominio tiene un peso (`weight`) y el score final se calcula:

```
score = SUM(correct_in_domain / total_in_domain * domain.weight * 1000)
```

Aprobatorio: **720/1000**

## Inicio Rapido

### Desarrollo local

```bash
npm install
npm start
# http://localhost:4200
```

### Docker

```bash
docker compose up --build -d
# http://localhost:8080
```

### Tests

```bash
npm test
```

## Persistencia

Estrategia offline-first con 3 capas:

```
Signals (UI) -> localStorage (persistencia local) -> Supabase (sync remoto async)
```

- El examen funciona 100% offline
- Sync a Supabase es fire-and-forget (no bloquea UI)
- Circuit breaker protege contra fallos en cascada
- Merge inteligente (best-of-both) al reconectar

## Supabase

| Tabla | Proposito |
|-------|----------|
| `iagentek_simuexamen_exam_results` | Resultados de examenes |
| `iagentek_simuexamen_progress` | Progreso por track |
| `iagentek_simuexamen_study_sessions` | Sesiones de estudio |
| `iagentek_simuexamen_leaderboard` | Ranking global |

Validacion server-side via RPC `validate_exam_answers` con fallback client-side.

## Deploy

- **Dominio**: `neuroncert.iagentek.com.mx`
- **Nginx**: Reverse proxy `/supabase/` (same-origin, sin CORS), security headers, CSP, HSTS, gzip, rate limiting
- **Docker**: Non-root user, healthcheck, resource limits (128M RAM, 0.5 CPU)

## Estructura de Environment

```typescript
// src/environments/environment.ts
{
  supabase: {
    url: '/supabase',       // proxied via nginx
    anonKey: '...'
  },
  CCAF_QUESTIONS: 60,       // preguntas por examen CCA-F
  CCAF_DURATION_SEC: 7200,  // 120 minutos
  CCAF_PASSING_SCORE: 720,  // de 1000
}
```

## Licencia

Proyecto privado de [iagentek](https://iagentek.com.mx).
