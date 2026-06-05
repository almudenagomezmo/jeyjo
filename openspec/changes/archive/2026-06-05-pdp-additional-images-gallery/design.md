## Context

- **Estado actual:** PDP (`apps/storefront/src/app/(shop)/p/[id]/page.tsx`) renderiza imagen principal vía `product.imageUrl` (`resolveCatalogImage`) y cuatro miniaturas hardcodeadas con la misma URL y `aria-hidden`. Las miniaturas aparecen vacías por colapso de layout: `ProductImage` usa `next/image` con `fill` sin altura mínima en contenedores anidados `grid aspect-square place-items-center`.
- **CMS:** `ownImage` + `providerImageUrl` en `enrichmentFields`; campo `gallery` del template Payload oculto (`admin: { hidden: true }`). Cambio #21 dejó multi-imagen fuera de alcance explícitamente.
- **Decisión producto:** Opción B — nuevo array `additionalImages` en enrichment, separado del template e-commerce.

## Goals / Non-Goals

**Goals:**

- Campo `additionalImages` editable en admin Payload (uploads a `media` / bucket `catalog-media`).
- `resolvePdpGalleryUrls({ ownImage, providerImageUrl, additionalImages })` en `@jeyjo/catalog-images`.
- `PdpProductView.galleryUrls: string[]` poblado en servidor.
- Componente cliente `ProductImageGallery`: imagen grande + miniaturas; click cambia activa; borde `border-primary` en activa; ocultar fila si `galleryUrls.length <= 1`.
- Corregir render de miniaturas (`w-full h-full` o variant `size="thumb"` en `ProductImage`).
- Unit tests resolver + mapper; verificación manual RF-012 galería.

**Non-Goals:**

- PLP/search/cart thumbnail (siguen `resolveCatalogImage`).
- Merchant `additional_image_link`, JSON-LD array extendido (v1 opcional, no requerido).
- Lightbox/zoom, drag-reorder en storefront, imágenes por variante.
- Migración automática desde campo `gallery` oculto.

## Decisions

### 1. Modelo de datos: `additionalImages` en enrichment

**Decisión:** Añadir en `enrichmentFields.ts`:

```ts
{
  name: 'additionalImages',
  type: 'array',
  label: 'Imágenes adicionales (galería PDP)',
  maxRows: 8,
  fields: [{ name: 'image', type: 'upload', relationTo: 'media', required: true }],
  admin: {
    description: 'Fotos extra solo visibles en la ficha de producto. La imagen principal sigue siendo «Imagen propia» (o URL proveedor si no hay propia).',
  },
}
```

**Alternativa descartada:** Desocultar `gallery` — acoplado a variantes e-commerce, semántica distinta.

### 2. Resolución de URLs de galería

**Decisión:** Nueva función pura en `packages/catalog-images`:

```
primary = resolveCatalogImage({ ownImage, providerImageUrl })
extras  = additionalImages[].image → mediaUrl (orden CMS)
gallery = dedupe([primary, ...extras].filter(Boolean))
```

- Deduplicación por URL string normalizada (trim, sin fragment).
- Si `primary` es null y hay extras, galería = solo extras (caso raro: extras sin imagen catálogo).
- `providerImageUrl` **no** se repite como ítem adicional.

**Alternativa descartada:** Incluir provider como segunda imagen automática — confunde con fotos de marketing propias.

### 3. PLP y thumbnail único sin cambios

**Decisión:** `resolveCatalogImage` permanece la fuente de `imageUrl` / `thumbnailUrl` en PLP, Qdrant, suggest. Solo PDP consume `galleryUrls`.

### 4. Componente galería (client)

**Decisión:** `ProductImageGallery` (`'use client'`) recibe props serializables:

```ts
type Props = {
  galleryUrls: string[]
  glyphProduct: Pick<Product, 'glyph' | 'colors' | 'eco'>
  title: string
}
```

Estado local `activeIndex`. Miniaturas: botones accesibles (`aria-label="Ver imagen N"`), `aria-current` en activa. Sin `aria-hidden` en la fila.

**Alternativa descartada:** Galería 100 % server con query params — peor UX (full navigation por click).

### 5. Fix layout `ProductImage`

**Decisión:** Añadir prop opcional `variant?: 'default' | 'thumb'`. En `thumb`: contenedor `relative aspect-square w-full h-full min-h-0`; `Image` mantiene `fill` + `object-contain p-1`; `sizes="80px"`.

**Causa raíz:** hijo con `fill` no aporta tamaño intrínseco dentro de `place-items-center`; forzar `w-full h-full` en el slot interno del Card.

### 6. Populate CMS

**Decisión:** Añadir `additionalImages: true` (y nested `image` URL) a `defaultPopulate` de Products para evitar round-trips extra en PDP fetch (`depth: 2` ya usado).

### 7. JSON-LD (opcional v1)

**Decisión:** Si `galleryUrls.length > 1`, incluir todas en `Product.image` array en JSON-LD existente; si no, comportamiento actual. Implementar solo si el helper ya centralizado lo permite sin scope creep.

## Risks / Trade-offs

- **[Risk] Productos con muchas imágenes pesadas en LCP** → Mitigation: `priority` solo en imagen activa; lazy en miniaturas; recomendación admin <500KB.
- **[Risk] Duplicado ownImage también en additionalImages** → Mitigation: dedupe en resolver.
- **[Risk] Regeneración `payload-types.ts`** → Mitigation: incluir en tarea apply tras cambio schema.
- **[Trade-off] Sin imágenes proveedor en galería** → Equipo sube fotos propias; provider sigue siendo fallback de imagen única principal.
- **[Trade-off] Sin reorden drag en storefront** → Orden = CMS array; reorder en admin Payload.

## Migration Plan

1. Añadir campo CMS + regenerar tipos.
2. Implementar `resolvePdpGalleryUrls` + tests.
3. Extender mapper PDP y tipos.
4. Crear `ProductImageGallery` + fix `ProductImage`.
5. Reemplazar bloque galería en `page.tsx`.
6. Manual: producto fixture con 3 `additionalImages`; verificar miniaturas visibles y click.
7. Rollback: revert deploy; campo CMS additive (no rompe productos existentes).

## Open Questions

- ¿Copy admin en español definitivo para `additionalImages`? **Decisión v1:** texto propuesto en §1.
- ¿JSON-LD multi-image en v1? **Decisión:** sí si cambio es trivial en `buildProductJsonLdFromView`; si no, follow-up.
