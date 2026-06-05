## Why

El cambio #9 (`storefront-shell-navigation`) introdujo navegación CMS con fallback a `lib/data/categories.ts`, pero en la práctica la taxonomía queda **triplicada** (Payload, array estático, mapas `SLUG_GLYPH_*`), el `unstable_cache` puede **congelar un árbol vacío** cuando el CMS arranca tarde, y el tercer nivel (familias) solo aparece como **anclas `#slug`** sin PLP indexable. Tras completar catálogo, home segmentada (#15) y búsqueda predictiva (#14), la tienda debe tratar Payload como **única fuente de verdad** para categorías, con resiliencia operativa vía snapshot versionado (Opción C acordada en explore) y glyphs desde `homeGlyph`.

## What Changes

- **Snapshot versionado de categorías:** script `sync:categories` que exporta la lista plana de Payload a JSON en el repo; runtime intenta CMS live y, si falla o devuelve vacío, usa el snapshot (no el array estático TS).
- **Glyphs desde CMS:** `buildNavigationTree` y home featured usan `homeGlyph` del documento; eliminar mapas hardcoded por slug.
- **Tercer nivel familias operativo:** rutas `/c/[category]/[sub]/[family]`, enlaces reales en mega-menú y drawer móvil (sustituir `#anchor`), breadcrumbs y PLP filtrado por slug de familia.
- **Seed CMS ampliado:** familias demo bajo al menos una subcategoría para QA local.
- **Fix cache vacío:** no persistir en `unstable_cache` respuestas CMS vacías que provoquen fallback silencioso durante minutos.
- **Limpieza:** retirar `CATEGORIES` como taxonomía runtime; mover fixtures a tests si hace falta; eliminar `searchCategories()` demo sin consumidores.
- **BREAKING (comportamiento):** si CMS y snapshot fallan, la navegación queda vacía (sin taxonomía estática embebida). Dev/CI deben ejecutar seed + sync antes de validar navegación.

## Capabilities

### New Capabilities

- `storefront-category-snapshot`: Contrato del snapshot JSON, script de sincronización, resolución runtime CMS → snapshot, política de cache y CI.

### Modified Capabilities

- `storefront-shell-navigation`: Fallback estático sustituido por snapshot; familias con URLs `/c/.../.../...`; glyphs desde `homeGlyph`.
- `storefront-app-shell`: Escenarios de degradación actualizados (snapshot, no `CATEGORIES` estático).
- `storefront-home-segmented`: Featured categories y fallback de raíces usan `homeGlyph` CMS sin mapa slug hardcoded.

## Impact

- `apps/storefront`: `fetch-navigation-tree.ts`, nueva ruta PLP tercer nivel, `MegaMenu`/`MobileNav`, script sync, JSON snapshot, tests, `package.json` scripts.
- `apps/cms`: seed `storefront-navigation.ts` con familias demo (sin cambio de schema; `homeGlyph` ya existe).
- Specs delta en este cambio; sync a `openspec/specs/` al archivar.
- Alineado a **RF-010** (navegación por categorías), **US-01** (contexto categoría en búsqueda/EVA), alcance §1.2–4.
- No bloquea ROADMAP pendiente; mejora transversal post-#9 recomendada antes de #40/#43.

## Non-Goals

- Top bar o footer 100 % editables desde CMS (#42).
- Sincronización en tiempo real vía webhook Payload (fase 2; solo script/CI en este cambio).
- Cuarto nivel de taxonomía en navegación pública.
- Reindexación Qdrant (ya cubierta por hooks existentes; solo verificar slugs de familias).
- URLs hardcoded de carruseles home (`/c/impresion`, etc.) — cambio separado si se desea merchandising 100 % CMS.
