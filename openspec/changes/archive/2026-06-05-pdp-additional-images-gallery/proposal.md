## Why

La PDP muestra una fila de cuatro miniaturas vacías (maquetación hardcodeada del prototipo) aunque la imagen principal carga bien. El equipo catálogo solo puede subir **una** imagen propia (`ownImage`) más la URL de proveedor; el campo `gallery` del template Payload permanece oculto. **RF-012** exige ficha enriquecida y **US-16** gestión PIM de contenido visual — sin galería real no se pueden publicar productos con varias fotos de marketing ni corregir el bug visible en producción.

## What Changes

- **CMS — campo `additionalImages`:** Array de uploads (`media`) en `enrichmentFields`, visible en pestaña Marketing/SEO junto a `ownImage`, con descripción de prioridad (principal + extras solo PDP).
- **Paquete `@jeyjo/catalog-images`:** Nueva función `resolvePdpGalleryUrls` que devuelve lista ordenada y deduplicada: imagen catálogo principal (`resolveCatalogImage`) + URLs de `additionalImages`; sin incluir `providerImageUrl` como ítem extra si ya es la principal.
- **Storefront PDP:** Sustituir placeholders `[0,1,2,3]` por componente cliente `ProductImageGallery` con imagen activa, miniaturas clicables, fila oculta si solo hay una imagen; corregir layout (`fill` en miniaturas).
- **Tipos y fetch:** Extender `PdpProductView` con `galleryUrls: string[]`; mapear en `fetch-product-pdp.ts` con `depth` suficiente para media anidada.
- **Tests:** Unit tests del resolver de galería; test de mapper PDP; test de componente o integración storefront.
- **Sin cambio** en PLP, búsqueda, carrito, Qdrant thumbnail (siguen con una sola imagen vía `resolveCatalogImage`).

## Capabilities

### New Capabilities

<!-- Ninguna — extensión de capacidades existentes -->

### Modified Capabilities

- `payload-enrichment-fields`: Campo `additionalImages` (array upload) y reglas admin.
- `catalog-image-resolution`: Función `resolvePdpGalleryUrls` con orden, deduplicación y tests.
- `storefront-pdp-product-detail`: Galería interactiva multi-imagen; eliminar placeholders decorativos.

## Impact

- `apps/cms/src/collections/Products/enrichmentFields.ts` — nuevo campo.
- `apps/cms/src/collections/Products/index.ts` — `defaultPopulate` incluye `additionalImages`.
- `packages/catalog-images/` — resolver y tipos ampliados.
- `apps/storefront/src/lib/catalog/fetch-product-pdp.ts`, `src/lib/pdp/types.ts` — `galleryUrls`.
- `apps/storefront/src/components/product/ProductImageGallery.tsx` (nuevo, client).
- `apps/storefront/src/app/(shop)/p/[id]/page.tsx` — integración galería.
- `apps/storefront/src/components/ui/ProductImage.tsx` — fix sizing en modo thumbnail.
- Tests en `packages/catalog-images`, `apps/storefront/tests/`.
- Depende de #21 (`pim-seo-dual-images`) completado. No bloquea Merchant feed (#34) en v1 (sin `additional_image_link`).

## Non-Goals

- Reutilizar o exponer el campo `gallery` del template e-commerce Payload (variantes).
- Imágenes adicionales desde URL de proveedor (solo uploads propios en `additionalImages`).
- Galería en PLP, quick view, carrito o suggest.
- `additional_image_link` en feed Merchant Center (posible follow-up).
- Descarga masiva de imágenes de proveedor a Storage.
- Zoom/lightbox fullscreen (v2).

## Assumptions

- Máximo **8** imágenes adicionales por producto (validación admin).
- Orden de galería: principal catálogo primero, luego `additionalImages` en orden del array CMS.
- Productos existentes sin `additionalImages` se comportan como hoy (una imagen, sin fila de miniaturas).
