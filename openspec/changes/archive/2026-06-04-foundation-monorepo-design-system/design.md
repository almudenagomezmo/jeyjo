## Context

El proyecto Jeyjo define arquitectura headless en [04-arquitectura-jeyjo.md](../../specs/04-arquitectura-jeyjo.md): Next.js (tienda + área cliente) y Payload CMS (backoffice), desplegados en Vercel con Supabase y Qdrant en cambios posteriores.

Estado actual del repositorio:

- **Referencia UI:** `especificaciones_inicio/diseño/jeyjo-next` — Next.js 15, Tailwind v4, tokens en `src/app/globals.css`, componentes en `src/components/`.
- **Referencia CMS:** `jeyjo_back` — Payload 3.x + Next 16, plugin ecommerce (Stripe); se adaptará, no se copia tal cual el dominio ecommerce del template.

No hay monorepo ni CI unificada. El [ROADMAP](../../ROADMAP.md) sitúa este cambio como #1: todo lo demás depende de estructura y diseño común.

## Goals / Non-Goals

**Goals:**

- Monorepo con `apps/storefront` y `apps/cms` ejecutables con `pnpm dev` desde la raíz.
- Tokens de diseño **idénticos** al prototipo jeyjo-next (`:root`, `.dark`, `@theme inline`); cambios de marca solo en `globals.css`.
- Primitives UI portados al storefront para que cambios 9–15 no reescriban estilos.
- Layout shell (TopBar, Header, Footer, Container) sin datos de catálogo.
- ESLint + TypeScript strict + Prettier alineados en ambas apps.
- Workflow CI: lint, typecheck, build en cada PR.

**Non-Goals:**

- Schema Supabase, colecciones Payload de negocio, adaptadores ERP, auth, Qdrant, catálogo real, despliegue producción.
- Sustituir Stripe del template por Redsys (cambio 18).
- Eliminar carpetas legacy (`jeyjo_back`, `jeyjo-next` en especificaciones) en este cambio; pueden deprecarse en README.

## Decisions

### 1. Gestor de workspaces: pnpm

**Elección:** `pnpm-workspace.yaml` con `apps/*` y opcional `packages/*`.

**Rationale:** `jeyjo_back` ya usa pnpm; hoisting eficiente; filtros `pnpm --filter storefront dev`.

**Alternativa descartada:** npm workspaces — menos alineado con el template Payload existente.

### 2. Estructura de directorios

```
jeyjo/
├── apps/
│   ├── storefront/     # desde jeyjo-next
│   └── cms/            # desde jeyjo_back (sin renombrar lógica Payload aún)
├── packages/
│   └── eslint-config/  # opcional mínimo
├── especificaciones_inicio/   # referencia (sin mover)
├── openspec/
├── pnpm-workspace.yaml
├── package.json              # scripts orquestación
└── .github/workflows/ci.yml
```

### 3. Design tokens: copia literal + contrato de no divergencia

**Elección:** Copiar `globals.css` de jeyjo-next a `apps/storefront/src/app/globals.css`. Prohibido hardcodear colores hex en componentes; solo utilidades Tailwind mapeadas (`bg-surface`, `text-primary`, etc.).

**Fuente de verdad futura:** un único archivo; si el CMS admin necesita preview, en cambio posterior se evalúa paquete `@jeyjo/design-tokens` exportando el mismo CSS.

**Referencia Pantone:** `--brand: #22ce7a`, `--ink: #1c1b17`, `--navy: #3c4658`, `--forest: #255b4d` (ver prototipo).

### 4. Storefront: Next.js 15 + App Router

Mantener versiones del prototipo (React 19, Tailwind 4). `layout.tsx` aplica fuentes Manrope/JetBrains como en jeyjo-next. Theme: script inline o `next-themes` con clase `.dark` en `<html>` antes del paint (evitar FOUC).

### 5. CMS: migración incremental de jeyjo_back

**Elección:** Mover contenido de `jeyjo_back/` a `apps/cms/` preservando `payload.config.ts`, dependencias Payload 3.x. No eliminar plugin ecommerce en este cambio (reduce riesgo); documentar deuda: desacoplar Stripe en cambios de pagos.

**Puertos dev:** storefront `3000`, cms `3001` (variable `PORT` en cms).

### 6. Paquete compartido (mínimo)

Solo `packages/eslint-config` o raíz con `eslint.config` extendido si duplicación es baja. **No** extraer `@jeyjo/ui` aún — YAGNI hasta segundo consumidor.

### 7. CI

GitHub Actions: `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm build` con matrix o secuencial. Cache pnpm por hash de lockfile.

## Risks / Trade-offs

| Riesgo | Mitigación |
|--------|------------|
| Duplicación temporal jeyjo_back vs apps/cms | README raíz indica ruta canónica `apps/cms`; no editar `jeyjo_back` tras migración |
| Versión Next distinta (15 storefront vs 16 cms) | Aceptado en fundación; unificar en cambio posterior si Vercel lo exige |
| Template Stripe en cms confunde dominio Jeyjo | Documentar en README cms; no usar pasarela en demos |
| Tokens divergen entre apps | Regla de lint/review: solo `globals.css` para colores en storefront |
| Build lento en CI | Build paralelo con `pnpm -r build`; omitir e2e en este cambio |

## Migration Plan

1. Crear `pnpm-workspace.yaml` y `package.json` raíz.
2. Copiar jeyjo-next → `apps/storefront` (ajustar nombre paquete `@jeyjo/storefront`).
3. Copiar jeyjo_back → `apps/cms` (ajustar puerto, paths).
4. Verificar `pnpm install && pnpm build` en local.
5. Añadir workflow CI.
6. Actualizar README raíz con comandos y referencia a `openspec/ROADMAP.md`.

**Rollback:** Revertir commit; apps legacy siguen en rutas originales.

## Open Questions

- ¿Unificar Next 16 en storefront en este cambio o en cambio 2? → **Mantener 15 en storefront** por estabilidad del prototipo.
- ¿Extraer tokens a `packages/design-tokens`? → **No** en fundación; revisar si cms necesita preview en cambio 9+.
