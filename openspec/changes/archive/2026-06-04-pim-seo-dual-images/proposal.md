## Why

El bootstrap Payload (#3) introdujo campos PIM/SEO e imagen dual (`providerImageUrl` + `ownImage`, prioridad propia > proveedor) con **US-16 CA1–CA2** y verificación parcial de **RF-024**. En storefront, la PDP ya resuelve imagen dual, pero PLP, tarjetas relacionadas y metadatos Open Graph siguen sin imagen en muchos casos; el buscador depende de `thumbnailUrl` indexado pero no hay validación ni preview unificado en admin. **US-16 CA3** (plantillas SEO masivas) y **CA4** (alertas de catálogo sin foto/metadescripción/slug duplicado) quedaron explícitamente fuera del bootstrap. Sin completar este cambio (#21), el equipo catálogo no puede operar SEO a escala ni cumplir el criterio de verificación RF-024 en PLP/PDP; el auditor técnico (#43) y Merchant feed (#34) quedan bloqueados.

## What Changes

- **Resolver de imagen dual compartido:** Extraer la regla `ownImage > providerImageUrl > null` a utilidad reutilizable (`packages/catalog-images` o equivalente) consumida por CMS (`resolveDisplayImage`), storefront (PLP, PDP, carrito, búsqueda) y worker Qdrant.
- **Storefront — imágenes en catálogo:** Añadir `imageUrl` resuelto a filas PLP y pasarlo a `ProductCard` / quick view; configurar `next/image` `remotePatterns` para dominios de proveedor (env o allowlist documentada).
- **Storefront — metadatos SEO enriquecidos:** PDP `generateMetadata` con `openGraph`/`twitter` usando imagen resuelta y `metaDescription`; alinear título con plugin SEO Payload cuando exista `meta.title`.
- **CMS — UX imagen dual:** Preview en admin de la imagen efectiva; validación de URL de proveedor (http/https); descripción de prioridad ya existente reforzada con indicador visual de fuente activa.
- **Generador SEO masivo (US-16 CA3):** Vista admin Payload con plantilla configurable (p. ej. `[Nombre del Producto] - Compra online al mejor precio en Jeyjo`), filtros (categoría, solo vacíos) y acción bulk sobre `metaDescription` (y opcionalmente `meta.title`) con confirmación y entrada en `audit_log`.
- **Panel salud SEO PIM (US-16 CA4):** Vista/listado admin con contadores y filtros de productos: sin imagen resuelta, sin metadescripción, slug duplicado; badges en listado de productos; enlaces directos a edición.
- **Tests e integración:** Unit tests del resolver; integración storefront PLP/PDP con fixture dual-image; test admin bulk (mock Payload local).
- **Documentación:** Variables `CATALOG_IMAGE_REMOTE_HOSTS` (o similar) en `.env.example`.

## Capabilities

### New Capabilities

- `catalog-image-resolution`: Paquete `@jeyjo/catalog-images` con `resolveCatalogImage` (display RF-024) y `resolveSeoImage` (social/JSON-LD con fallback a catálogo).
- `cms-pim-seo-admin`: Bulk plantilla SEO (US-16 CA3) y panel salud PIM (US-16 CA4 parcial) — sin foto catálogo, sin metadescripción, slug duplicado.
- `storefront-product-seo-metadata`: Open Graph, Twitter y JSON-LD `Product` en PDP usando `resolveSeoImage`.

### Modified Capabilities

- `payload-enrichment-fields`: Completar RF-024 — separación explícita imagen catálogo vs `meta.image` SEO; `defaultPopulate` con `meta.image`.
- `storefront-plp-faceted`: Tarjetas PLP y quick view con `imageUrl` vía `resolveCatalogImage`.
- `storefront-pdp-product-detail`: Galería con imagen catálogo; metadata delegada a `storefront-product-seo-metadata`.
- `storefront-predictive-search`: Thumbnails suggest vía imagen catálogo, no `meta.image`.
- `qdrant-search-indexer`: `thumbnailUrl` indexado solo con `resolveCatalogImage`.

## Impact

- `packages/catalog-images/` (nuevo) o `packages/shared/` según convención monorepo.
- `apps/cms/src/utilities/resolveDisplayImage.ts` — reexport/wrap paquete compartido.
- `apps/cms/src/collections/Products/` — componentes admin preview, validación URL.
- `apps/cms/src/components/admin/` o custom views Payload — bulk generator + health dashboard.
- `apps/storefront/src/lib/catalog/` — PLP row mapping, metadata PDP.
- `apps/storefront/src/components/product/ProductCard.tsx` — pasar `imageUrl`.
- `apps/storefront/next.config.ts` — remotePatterns dinámicos o ampliados.
- `apps/cms/src/search-indexer/worker.ts` — usar paquete compartido (sin cambio de comportamiento).
- Tests en `apps/cms/tests/` y `apps/storefront/tests/`.
- Desbloquea ROADMAP #43 (`seo-technical-auditor`), #34 (`analytics-ga4-merchant-feed` parcial — imágenes feed).
- Depende de #3 (`payload-collections-bootstrap`) y #5 (`backoffice-mfa-audit-roles`) completados.

## Non-Goals

- Auditor SEO técnico (Core Web Vitals, schema.org avanzado, sitemap crawl) — cambio #43.
- Feed Google Merchant Center completo — cambio #34.
- Descarga automática de imágenes de proveedor a Supabase Storage.
- Galería multi-imagen en PDP (campos `gallery` template siguen ocultos).
- Edición masiva de `longDescription` o keywords (solo meta título/descripción en v1).
- Traducciones multi-idioma de plantillas SEO.
- Permisos granulares nuevos más allá de roles staff existentes (#5).

## Assumptions

- Dominios proveedor habituales (Distrisantiago, Arnoia) se configuran vía env; en dev `example.com` ya está permitido.
- Bulk generator opera sobre productos publicados y borrador; respeta `maxLength` 160 en metadescripción.
- Health dashboard consulta Payload localmente (no materialized view Supabase en v1).
- `meta.image` del plugin SEO Payload permanece opcional; imagen social por defecto = imagen dual resuelta.
