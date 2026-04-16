## ADR-001: Angular Standalone Components sin NgModules

**Fecha:** 2026-04-01
**Estado:** Accepted

### Contexto
Angular 20 soporta standalone components como la opcion principal, eliminando la necesidad de NgModules para la mayoria de casos de uso.

### Decision
Usar standalone components exclusivamente en todo el proyecto, sin NgModules.

### Consecuencias
- **Positivas**: Menor boilerplate, lazy loading simplificado con loadComponent(), mejor tree-shaking, imports explicitos en cada componente
- **Negativas**: Imports repetidos entre componentes (mitigado con barrel exports)

### Archivos Afectados
- Todos los componentes en `src/app/features/` y `src/app/shared/`
- `src/app/app.ts` (root component)
- `src/app/app.config.ts` (providers centralizados)
