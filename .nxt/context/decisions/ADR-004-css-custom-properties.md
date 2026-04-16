## ADR-004: CSS Custom Properties sin Framework CSS

**Fecha:** 2026-04-01
**Estado:** Accepted

### Contexto
El simulador necesita un tema visual profesional y consistente.

### Decision
CSS3 puro con custom properties para theming, sin Tailwind, Bootstrap ni otro framework CSS.

### Consecuencias
- **Positivas**: Control total del diseno, cero dependencias CSS, bundle mas ligero, tematizacion via variables CSS
- **Negativas**: Mas CSS manual, sin utilidades predefinidas

### Paleta de Colores
- Navy Blues: #0F172A (bg deep), #1A2537 (bg secondary)
- Gold Accents: #B17B20 (primary), #D79F3B (hover/highlight)
- Status: Green (success), Yellow (warning), Red (danger)

### Tipografia
- UI: Inter (system sans-serif fallback)
- Code: JetBrains Mono
