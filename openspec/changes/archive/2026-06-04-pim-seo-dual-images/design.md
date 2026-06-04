## Context

El cambio #3 (`payload-collections-bootstrap`) introdujo campos PIM en `Products` (`longDescription`, `metaDescription`, `keywords`, `providerImageUrl`, `ownImage`, pestaña Marketing/SEO) y `resolveDisplayImage` en CMS (`ownImage` > `providerImageUrl`). El plugin SEO de Payload añade `meta.title`, `meta.description` e `meta.image` en la pestaña "SEO Preview", pero el storefront solo consume `metaDescription` en `generateMetadata` del PDP; PLP y suggest siguen con glyph; no hay bulk SEO ni panel de salud (US-16 CA3–CA4).

RF-024 exige imagen dual de **catálogo** (URL proveedor vs adjunto) y verificación en PDP; US-16 CA3–CA4 piden plantillas masivas y alertas PIM. Este diseño separa explícitamente **imagen de catálogo** (display) de **imagen SEO/social** (`meta.image` con fallback a display).

## Goals / Non-Goals

**Goals:**

- Paquete monorepo `@jeyjo/catalog-images` con `resolveCatalogImage` (display) y `resolveSeoImage` (social/structured data).
- Admin: copy claro en campos dual-image; endpoint bulk plantilla SEO; vista salud PIM (alertas CA4 parcial).
- Storefront: PDP metadata completa (OG/Twitter/JSON-LD); PLP/suggest/cross-sell con `imageUrl` display.
- CMS indexer: `thumbnailUrl` vía `resolveCatalogImage` (sin usar SEO image en miniaturas).
- Tests unitarios de cadenas de fallback y regresión metadata PDP.

**Non-Goals:**

- Auditor SEO técnico (#43), GMC/GA4 (#34), proxy de imágenes proveedor, categorías con imagen SEO, reindex masivo manual.

## Decisions

### 1. Paquete compartido `@jeyjo/catalog-images`

**Decisión:** Nuevo paquete en `packages/catalog-images/` exportando funciones puras sin dependencia de Payload/Next.

**Rationale:** Misma regla RF-024 en CMS worker, storefront fetchers y tests; evita duplicar `resolveImageUrl` en `fetch-product-pdp.ts` y `resolveDisplayImage.ts`.

**Alternativa descartada:** Mantener solo `apps/cms/src/utilities/resolveDisplayImage.ts` e importar desde storefront vía path alias — acopla apps y rompe límites de paquete en CI.

**API:**

```ts
type MediaLike = { url?: string | null } | number | null

resolveCatalogImage({ ownImage, providerImageUrl }): string | null
// ownImage.url > providerImageUrl > null

resolveSeoImage({ metaImage, ownImage, providerImageUrl }): string | null
// metaImage.url > resolveCatalogImage(...) > null
```

URLs relativas de Supabase/media se absolutizan en capa storefront/CMS con helper existente (`absoluteMediaUrl` / `NEXT_PUBLIC_SERVER_URL`).

### 2. Canal canónico SEO = `meta.image` del plugin

**Decisión:** No añadir campo `seoImage` duplicado; documentar en admin que `meta.image` (pestaña SEO Preview) es la imagen para Open Graph y JSON-LD; catálogo usa `ownImage` / `providerImageUrl` en pestaña Marketing.

**Rationale:** Evita tres fuentes de verdad; el plugin ya ofrece preview y upload a `media`.

**Alternativa descartada:** Campo `seoImage` separado en `enrichmentFields` — redundante con `meta.image`.

### 3. Bulk SEO vía endpoint CMS autenticado

**Decisión:** `POST /api/products/bulk-seo-template` (staff, `staffUpdateAccess`) acepta `template` con placeholder `{title}`; actualiza `meta.description` y opcionalmente `meta.title` en productos `published` seleccionados por query (`ids[]` o `allPublished` con límite 500).

**Rationale:** US-16 CA3 "un clic" sin job queue; operación idempotente y auditable vía `audit_log` hook existente.

**Alternativa descartada:** Hook en save de cada producto — no cumple "masivo en un clic".

### 4. Panel salud PIM (CA4 parcial)

**Decisión:** Componente admin en lista de productos o ruta `/admin/pim-health` que consulta hasta 500 publicados y muestra contadores + enlaces: sin imagen catálogo, sin `metaDescription`, slugs duplicados (agrupación en memoria).

**Rationale:** CA4 completo (#43) incluirá auditor técnico; aquí solo alertas operativas para el equipo catálogo.

### 5. Storefront metadata PDP

**Decisión:** Extender `generateMetadata` en `apps/storefront/src/app/(shop)/p/[id]/page.tsx` con `openGraph` y `twitter` usando `resolveSeoImage`; añadir `<script type="application/ld+json">` `Product` en página con `image`, `name`, `description`, `sku`.

**Rationale:** Cumple RF-024 verificación social sin cambiar UI de galería (sigue `resolveCatalogImage`).

### 6. PLP y suggest: `imageUrl` en filas

**Decisión:** `mapDocToRow` / tipos `PlpProductRow` incluyen `imageUrl: string | null`; `ProductCard` usa `ProductImage` con URL o glyph; suggest API hidrata desde CMS con depth 1 para `ownImage`/`providerImageUrl`.

**Rationale:** RF-024 visible en listados; Qdrant payload `thumbnailUrl` ya usa display — alinear hydrate path del suggest con misma función del paquete.

### 7. Migración de `resolveDisplayImage`

**Decisión:** Re-exportar desde CMS `resolveDisplayImage` → `resolveCatalogImage` del paquete para no romper imports internos; deprecar archivo tras migración en la misma PR de apply.

## Risks / Trade-offs

- **[Risk] URLs proveedor en `og:image` no absolutas o bloqueadas por crawlers** → Mitigation: absolutizar en servidor; documentar que imágenes SEO dedicadas deben subirse a `meta.image` para artículos estratégicos.
- **[Risk] Bulk SEO sobrescribe metas editadas manualmente** → Mitigation: confirmación en UI admin; opción "solo vacíos"; audit log.
- **[Risk] CORS/hotlink en `<img>` de URL proveedor en PLP** → Mitigation: aceptado en RF-024; `referrerPolicy`/`crossOrigin` según pruebas; no proxy en v1.
- **[Risk] Panel salud O(n) en 500 productos** → Mitigation: límite fijo, cache 60s en admin, paginación en iteración futura.

## Migration Plan

1. Publicar `@jeyjo/catalog-images` y añadir dependencia en `apps/cms` y `apps/storefront`.
2. Sustituir llamadas a `resolveDisplayImage` / `resolveImageUrl` por imports del paquete.
3. Desplegar CMS + storefront; sin migración SQL.
4. Tras deploy, ejecutar bulk SEO solo si negocio lo solicita (opt-in).
5. Rollback: revertir deploy; campos Payload sin cambio de schema.

## Open Questions

- ¿Plantilla bulk debe rellenar solo `meta.description` o también `metaDescription` (campo legacy)? **Propuesta v1:** ambos cuando `metaDescription` está vacío, para coherencia con storefront que lee `metaDescription` primero.
- ¿Límite bulk 500 ids suficiente para catálogo inicial? **Sí** hasta sync ERP masivo (#7); operador puede repetir por lotes.
