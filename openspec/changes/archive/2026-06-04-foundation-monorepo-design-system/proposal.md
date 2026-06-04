## Why

Jeyjo arranca con especificaciones completas pero sin una base de código unificada: el prototipo UI (`jeyjo-next`) y el template Payload (`jeyjo_back`) viven separados. Sin monorepo, tokens de diseño centralizados y CI común, cada cambio OpenSpec posterior duplicaría estructura, estilos y convenciones, incumpliendo la arquitectura acordada (Next.js tienda + Payload CMS) y el manual visual corporativo.

## What Changes

- Crear monorepo con dos aplicaciones: `apps/storefront` (Next.js, derivado de `especificaciones_inicio/diseño/jeyjo-next`) y `apps/cms` (Payload, adaptado desde `jeyjo_back`).
- Establecer paquete compartido opcional `packages/tsconfig` / convenciones raíz (pnpm workspaces o npm workspaces).
- Portar el sistema de diseño: `globals.css` con tokens CSS (`:root`, `.dark`, `@theme inline`) como única fuente de verdad de color, tipografía, radios y sombras.
- Portar primitives UI mínimos (`Button`, `Card`, `Container`, `Logo`, utilidades `cn`, `format`) al storefront.
- Layout raíz vacío: `TopBar`, `Header`, `Footer` esqueleto sin catálogo real ni APIs de negocio.
- CI en raíz: lint, typecheck y build de ambas apps (GitHub Actions o script npm equivalente).
- Documentar variables de entorno de ejemplo (`.env.example`) por app.
- **No incluye:** Supabase schema, Payload colecciones de negocio, ERP, auth, catálogo real, Qdrant.

## Capabilities

### New Capabilities

- `monorepo-workspace`: Estructura de carpetas, workspaces, scripts raíz (`dev`, `build`, `lint`), política de dependencias compartidas.
- `design-tokens`: Tokens CSS centralizados alineados al manual Pantone Jeyjo; modo claro/oscuro vía clase `.dark` en `<html>`.
- `storefront-ui-primitives`: Componentes UI base reutilizables en la tienda, copiados/adaptados desde jeyjo-next.
- `storefront-app-shell`: App Next.js 15 App Router con layout global, fuentes (Manrope/JetBrains), página placeholder y 404.
- `cms-app-bootstrap`: App Payload existente reubicada en `apps/cms` con build y dev operativos dentro del monorepo.
- `ci-pipeline`: Verificación automática lint + typecheck + build en PR/merge.

### Modified Capabilities

- _(ninguna — los documentos en `openspec/specs/` son fuente de verdad del dominio; este cambio solo añade infraestructura de proyecto)_

## Impact

- Nuevo árbol `apps/`, `packages/` (si aplica) en la raíz del repositorio.
- `jeyjo_back` y `especificaciones_inicio/diseño/jeyjo-next` quedan como referencia histórica hasta migración completa; el código activo vive en `apps/`.
- Equipo de desarrollo: convención única TypeScript strict, Tailwind v4, ESLint/Prettier.
- Sin impacto en producción hasta despliegue posterior (Vercel: dos proyectos o monorepo con filtros de ruta).
- Cumple preparación de RNF-017, RNF-014, RNF-015; desbloquea cambio #2 del [ROADMAP](../ROADMAP.md).
