# Changelog

Todos los cambios notables en este proyecto seran documentados aqui.

El formato esta basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

### Added
- Integracion de framework NXT AI Development v4.0.0 (agentes de contexto)
- Estructura `.nxt/` con persistencia, checkpoints y ADRs

---

## [1.0.0] - 2026-04-12

### Added
- Simulador completo de examen CSA ServiceNow
- Angular 20.1.0 con standalone components y zoneless change detection
- Sistema de estado reactivo basado en Angular Signals
- Integracion con n8n webhooks para generacion dinamica de preguntas
- Validacion de respuestas server-side (respuestas correctas nunca expuestas al cliente)
- Timer countdown de 90 minutos con auto-submit
- Warning visual a los 5 minutos restantes
- Navegacion secuencial entre preguntas (previous/next)
- Sistema de flagging/marcado de preguntas para revision
- Progreso en tiempo real (answered, flagged, total, percentage, score)
- Soporte para 3 niveles de dificultad (facil, mediana, dificil) + modo aleatorio
- Configuracion de examen: 120 preguntas, 90 minutos (estandar CSA)
- Pantalla de confirmacion de envio con resumen
- Resultados detallados con breakdown por pregunta
- Historial de examenes (ultimos 10, persistente en localStorage)
- Server-Side Rendering (SSR) via @angular/ssr + Express 5
- Lazy loading de todos los feature components
- Route guards para proteger rutas de examen (submit, review)
- Tema visual navy blue + gold con CSS custom properties
- Accesibilidad: keyboard navigation, focus management
- 7 servicios core: ExamState, Webhook, Timer, ExamHistory, Config, DataSource, SeedValidator
- 7 modelos TypeScript: Domain, Question, Option, ExamParams, ExamPayload, ExamResult, SeedData
- 3 componentes shared reutilizables: ProgressSteps, QuestionCard, TimerBadge
- Barrel exports para models y services
- Configuracion Prettier (100 char, single quotes)

### Architecture
- Feature-based architecture con Clean Architecture layers (core/features/shared)
- Angular Standalone Components (sin NgModules)
- Signals para state management (sin dependencias externas)
- RxJS para HTTP y streams reactivos
- sessionStorage para estado de examen activo
- localStorage para historial persistente

### Security
- Respuestas correctas nunca expuestas al frontend
- Validacion de respuestas exclusivamente via webhook server-side
- Logs sensibles deshabilitados por defecto
- Datos sensibles enmascarados (maskSensitiveData: true)

---

*Generado por NXT Changelog Agent (Logan) v4.0.0*
