## ADR-003: n8n Webhooks para Generacion de Preguntas

**Fecha:** 2026-04-01
**Estado:** Accepted

### Contexto
Las preguntas del examen CSA no deben estar hardcodeadas en el frontend por razones de seguridad (las respuestas correctas no deben ser accesibles al usuario via DevTools).

### Decision
Usar n8n como backend de logica via webhooks REST:
- `startExam(difficulty)`: Obtiene primera pregunta
- `validateAnswerAndGetNext(question, answer)`: Valida respuesta y devuelve siguiente pregunta

### Consecuencias
- **Positivas**: Preguntas generadas dinamicamente, respuestas correctas NUNCA expuestas al cliente, logica de negocio desacoplada, facil de modificar flujos sin tocar frontend
- **Negativas**: Dependencia de servicio externo (n8n en devwebhook.personalizzimo.com), latencia de red por cada pregunta

### Endpoints
- Start: `https://devwebhook.personalizzimo.com/webhook/3e9b5e81-...`
- Validate: `https://devwebhook.personalizzimo.com/webhook/59dcb81e-...`

### Dificultades Soportadas
- `facil`, `mediana`, `dificil` (enviadas en espanol al webhook)
- `any` → seleccion aleatoria por pregunta
