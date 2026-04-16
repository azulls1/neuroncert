## ADR-002: Angular Signals para State Management

**Fecha:** 2026-04-01
**Estado:** Accepted

### Contexto
El simulador necesita state management reactivo para el flujo del examen (status, questions, progress, timer). Opciones: NgRx, Zustand, Angular Signals.

### Decision
Usar Angular Signals (signal, computed, effect) como mecanismo primario de estado. RxJS solo para HTTP y streams de tiempo.

### Consecuencias
- **Positivas**: Sin dependencias externas, mejor performance con zoneless change detection, API mas simple que NgRx, computed signals para datos derivados (progress, navigation)
- **Negativas**: Menos tooling de debugging que Redux DevTools

### Implementacion
- `ExamStateService`: _status, _questions, _currentIndex como signal()
- `TimerService`: _remainingSeconds, _isRunning como signal()
- Computed: currentQuestion, progress, navigation, formattedTime
- RxJS: HttpClient para webhooks, BehaviorSubject para remainingTime$
