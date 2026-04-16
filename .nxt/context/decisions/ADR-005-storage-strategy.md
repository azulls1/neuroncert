## ADR-005: SessionStorage + LocalStorage para Persistencia

**Fecha:** 2026-04-01
**Estado:** Accepted

### Contexto
El estado del examen en curso debe sobrevivir page refresh, pero el historial debe persistir entre sesiones del navegador.

### Decision
- `sessionStorage`: Estado de examen en progreso (questions, progress, timer)
- `localStorage`: Historial de examenes, resultados pasados (max 10)

### Consecuencias
- **Positivas**: No requiere backend para persistencia, experiencia fluida en refresh, historial disponible siempre
- **Negativas**: Datos limitados a un navegador/dispositivo, no sincronizacion cross-device

### Storage Keys
- `exam_state`: Estado actual del examen
- `exam_progress`: Progreso durante examen
- `exam_results`: Resultado del ultimo examen
- `last_results`: Resultados recientes
- `user_preferences`: Preferencias del usuario
