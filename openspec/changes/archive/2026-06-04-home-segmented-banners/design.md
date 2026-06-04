## Context

- **Estado actual:** `/` renderiza placeholder de fundación sin catálogo. El prototipo `jeyjo-next/src/app/page.tsx` define la UX objetivo: hero con `SearchBar`, tarjetas segmento B2C/B2B, rejilla de categorías, carruseles "Top ventas" y "Eco", franja de confianza. PLP (#10) ya expone `listPublicProducts`, batch pricing y `ProductGrid` con `PriceQuote`; navegación (#9) lee categorías CMS.
- **Alcance:** §1.6 home segmentada; **US-02** en tarjetas de carrusel; coherencia con toggle cabecera (**RF-011**).
- **Dependencias ROADMAP:** #9, #10 completados. No bloquea #12 ni #14 pero mejora validación de merchandising.

## Goals / Non-Goals

**Goals:**

- Global Payload `home` con banners (`image`, `href`, `segment`, `startAt`, `endAt`, `sortOrder`), `featuredCategories[]`, y tres carruseles curados (`topSalesB2c`, `topSalesB2b`, `ecoHighlight`) como relaciones a `products`.
- Storefront RSC: `fetchHomeMerchandising()` + `fetchHomeCarouselProducts(skus)` reutilizando filtros `public-product-filter`.
- Segmento home sincronizado con `PriceModeToggle` vía cookie `jeyjo-price-mode` (existente o unificada).
- UI portada de jeyjo-next: `HomeHero`, `SegmentCards`, `FeaturedCategories`, `HomeProductCarousel`, `TrustStrip`; tokens solo desde `globals.css`.
- Batch `POST /api/pricing/batch` y stock batch para SKUs de carruseles (máx. 24 SKUs por sección).
- Filtrado de banners en servidor: `startAt <= now <= endAt` y `segment` ∈ {`b2c`, `b2b`, `both`} según modo activo.

**Non-Goals:**

- Qdrant, predictivo, voz (#13–14).
- Auth B2B real (#16); segmento = toggle manual.
- Ranking automático de ventas desde ERP (#30).
- Page builder Payload en URL pública del storefront.
- EVA hero, newsletter (#39), carrito (#12).

## Decisions

### 1. Modelo CMS: global `home` en Payload

**Decisión:** Añadir `globals/Home.ts` registrado en `payload.config.ts` con grupos: `promoBanners[]`, `featuredCategories[]` (relación `categories`, máx. 6), `carousels` (tres arrays de relación `products` con `maxRows` 12). Acceso: staff con área `personalizacion` (mismo patrón que #5).

**Alternativa descartada:** Colección `pages` con bloques Lexical — orientada al sitio CMS interno, no al contrato merchandising de la tienda Next.

**Alternativa descartada:** JSON estático en repo — sin fechas de banner ni curación sin deploy.

### 2. API storefront: REST global + productos por ID

**Decisión:** `fetch-home.ts` llama `GET ${CMS_URL}/api/globals/home?depth=2` con secret servidor; resuelve productos de carruseles con `where[id][in]=...` o helper `listPublicProductsByIds(ids)` que reutiliza shape `PlpProductRow`.

**Alternativa:** Local API Payload dentro de monorepo — requiere empaquetar Payload en storefront; descartada.

### 3. Segmento B2C/B2B en home

**Decisión:** Leer cookie `jeyjo-price-mode` en RSC; `HomeSegmentToggle` client component actualiza cookie y `router.refresh()`. Banners filtran por `segment`; carrusel visible: `topSalesB2c` si `b2c`, `topSalesB2b` si `b2b`; sección eco común. Tarjetas segmento (Particulares / Empresas) enlazan a PLP o `/cuenta` placeholder.

**Alternativa:** Estado solo en React sin cookie — desincronía con cabecera; descartada.

### 4. Categorías destacadas

**Decisión:** Usar relación CMS ordenada; storefront mapea a `{ slug, name, glyph }` con `glyph` desde campo enrichment en `categories` o fallback `ProductGlyph` por slug. Enlace `/c/{slug}`.

**Fallback:** Si global vacío, mostrar hasta 6 categorías raíz del árbol #9 (`fetchCategoryTree` roots).

### 5. Carruseles de producto

**Decisión:** Componente `HomeProductCarousel` envuelve scroll horizontal o grid responsive reutilizando `ProductCard` con props `quote` + `stockIndicator`. Servidor prefetch batch quotes/stock para todos los SKUs de carruseles activos en una sola pasada.

**Alternativa:** Embla carousel obligatorio — opcional en v1; grid con scroll snap suficiente para paridad visual.

### 6. Banners promocionales

**Decisión:** Array `promoBanners` con `media` (upload Supabase), `href`, `alt`, `segment`, `startAt`, `endAt`, `sortOrder`. Hook `beforeValidate` en CMS: `endAt >= startAt`. Storefront: `filterActiveBanners(banners, now, segment)`.

**Alternativa:** Bloque `banner` Lexical existente — estilos alerta, no hero promo; no reutilizar.

### 7. Degradación y caché

**Decisión:** `unstable_cache` 120s en `fetchHomeMerchandising`. Si CMS falla: render hero estático + segment cards sin carruseles; log warning. Eliminar requisito "home sin backend" del shell (ver delta spec).

### 8. Estructura de archivos storefront

**Decisión:**

```
apps/storefront/src/
  app/page.tsx                    # RSC orchestrator
  components/home/
    HomeHero.tsx
    SegmentCards.tsx
    PromoBannerStrip.tsx
    FeaturedCategories.tsx
    HomeProductCarousel.tsx
    TrustStrip.tsx
    HomeSegmentToggle.tsx
  lib/home/
    fetch-home.ts
    filter-banners.ts
    types.ts
```

## Risks / Trade-offs

- **[Risk] Global `home` sin seed** → Mitigation: endpoint seed o documentación en `apps/cms/docs`; apply task crea datos QA.
- **[Risk] Carruseles vacíos tras sync** → Mitigation: staff cura manualmente; UI oculta sección si 0 productos.
- **[Risk] Desfase cookie segmento vs cabecera** → Mitigation: misma clave cookie; un solo `setPriceMode` compartido.
- **[Trade-off] Top ventas manuales vs ERP** → v1 curación CMS; métricas reales en #30.
- **[Trade-off] Home depende de CMS** → aceptado; shell degrada secciones opcionales, no 500.

## Migration Plan

1. Añadir global `home` en CMS y migrar seed.
2. Implementar `fetch-home` y página RSC.
3. Sustituir placeholder; verificar `pnpm --filter storefront build`.
4. Staff publica banners y cura carruseles en admin.
5. Rollback: revertir `page.tsx` al placeholder (una ruta); global CMS inofensivo si no se consulta.

## Open Questions

- ¿Campo `glyph` en `categories` ya existe o se añade en este cambio? → **Decisión apply:** añadir `homeGlyph` opcional en `categories` si falta.
- ¿Límite de banners simultáneos en hero? → **v1:** máx. 3 activos en carrusel; resto omitidos.
