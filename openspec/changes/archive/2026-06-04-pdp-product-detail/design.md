## Context

- **Estado actual:** `(shop)/p/[id]/page.tsx` renderiza PDP con `getProduct` / `getRelatedProducts` desde `lib/data/products.ts`, `generateStaticParams` sobre array demo, galería con 4 thumbnails duplicados (glyph), `ProductBuyBox` con precios stub (`getPriceView(product)`) y stock numérico local, tabs con descripción plana. Existen piezas parciales del stack real: `fetchProductBySkuFromCms` (snapshot mínimo), `/api/pricing/resolve`, `/api/stock/[sku]`, `fetch-product-list` para PLP, componentes UI jeyjo-next (`ProductImage`, `StockBadge`, `QtyStepper`).
- **Alcance:** §1.8 ficha producto, **RF-012**, **RF-008**, **RF-011**, **US-03** (CA1–CA4 parcial hasta #12 mini-carrito).
- **Dependencias ROADMAP:** #6 (`price-engine-core`), #8 (`stock-multisource-adapters`), #10 (`plp-faceted-listing`). Bloquea #12, #15, #34.

## Goals / Non-Goals

**Goals:**

- Tipo `PdpProductView` serializable (servidor → cliente) con campos CMS: slug, sku, título, marca, OEM, EAN, `packUnit`, `longDescription` (HTML serializado), specs, imagen URL, `ecoLabel`, categoría primaria, `relatedProducts[]` (filas PLP mínimas), `attachments[]`.
- Loader `loadPdpPage(slugOrSku)` en `src/lib/pdp/load-pdp-page.ts`: resuelve por `slug` preferido, fallback `skuErp`; aplica `isPublicCatalogProduct`; prefetch `PriceQuote` + `StockIndicator`; batch quotes/stock para related SKUs (máx. 8).
- Página RSC `(shop)/p/[id]/page.tsx`: `generateMetadata` desde `metaDescription`/`title`; `notFound()` si no público; breadcrumbs desde árbol navegación + categoría primaria (patrón PLP).
- `ProductBuyBox` refactor: props `quote`, `stockIndicator`, `packUnit`; cliente opcional SWR a `/api/pricing/resolve` y `/api/stock/[sku]` solo si props ausentes (modo híbrido transición).
- **RF-008:** `QtyStepper` con `onInvalidQuantity` → snackbar/toast inline: "Este artículo se vende en cajas de N unidades"; redondeo `ceil(qty/packUnit)*packUnit`.
- **US-03 CA4:** si `level=limited` y `allowOrderWithoutStock`, botón activo + banner aviso con REF.
- `ProductTabs`: descripción desde `longDescription` HTML (sanitize server-side); specs desde view-model; tab adjuntos condicional.
- Cross-selling: `ProductGrid` con filas related + `quotesBySku` / `stockBySku` (reutilizar mapper PLP `plpRowToProduct` + quotes).
- Eliminar import de `lib/data/products.ts` en ruta PDP; mantener demo file para otras rutas hasta migración total.

**Non-Goals:**

- Mini-carrito UX completo (#12), carrito persistente, checkout.
- Galería multi-imagen real (#21); v1 = 1 imagen + thumbnails decorativos deshabilitados o repetidos con `aria-hidden`.
- Reviews reales; ocultar bloque rating si CMS no expone dato.
- JSON-LD / GA4 product events (#34).
- Auth B2B por sesión (#16).

## Decisions

### 1. Resolución de URL: slug canónico

**Decisión:** Parámetro ruta `[id]` acepta slug o SKU (compatibilidad enlaces legacy). Lookup CMS: `where[slug][equals]` primero; si falla, `where[skuErp][equals]`. Si match por SKU y slug existe, `redirect` 308 a `/p/{slug}`.

**Alternativa descartada:** Solo SKU en URL — peor SEO y diverge de seed CMS con slugs.

### 2. Snapshot CMS ampliado

**Decisión:** Extender `CmsProductSnapshot` → `CmsPdpProductDoc` con `title`, `slug`, `longDescription` (Lexical JSON → HTML en servidor con helper `@payloadcms/richtext-lexical` o serialización simplificada), `oemRef`, `ean`, `supplier` (depth 1), `categories[]`, `relatedProducts` (depth 1, filtrar publicados), `attachments` (array `{label, file url}`), `providerImageUrl`, `ownImage`, campos ERP ya sincronizados. `fetchPublicProductBySlugFromCms` con `unstable_cache` 60s.

**Alternativa:** GraphQL Payload — no adoptado en storefront; REST consistente con PLP.

### 3. Precios en buy box

**Decisión:** Servidor resuelve quote en `loadPdpPage` vía `resolvePriceQuote(sku)` interno (misma lógica que route). Pasa `initialQuote` a `ProductBuyBox`. Cliente usa quote inicial; no refetch salvo cambio futuro de sesión B2B (#16).

**Alternativa:** Client-only fetch — peor LCP y flash de precio; descartada.

### 4. Stock y add-to-cart

**Decisión:** `ProductBuyBox` recibe `StockIndicatorPublic`; deshabilita botón solo si `limited` **y** `allowOrderWithoutStock === false`. Usa `StockIndicatorBadge` (PLP) en lugar de `StockBadge` numérico.

**Alternativa:** Mantener stock entero — contradice RF-005.

### 5. Envase cerrado RF-008

**Decisión:** Wrapper `PackQtyStepper` alrededor de `QtyStepper`: en blur o intento de decremento inválido, ajusta valor y muestra `InlineNotice` bajo stepper (copy US-03 CA2). Step y min = `packUnit`.

### 6. Descripción larga HTML

**Decisión:** Servidor convierte Lexical → HTML string en loader; `ProductTabs` usa `dangerouslySetInnerHTML` con HTML ya sanitizado (`sanitize-html` allowlist: p, h2–h4, ul, ol, li, strong, em, a[href]).

### 7. Adjuntos

**Decisión:** Si Payload no tiene campo `attachments` aún, añadir en CMS tab enrichment: `attachments[]` con `label` + upload `media`. Storefront lista enlaces `target=_blank` con icono download. Sección oculta si array vacío.

### 8. Related products cross-sell

**Decisión:** Resolver `relatedProducts` IDs a filas públicas (mismo shape que PLP row); excluir wildcard/draft; limit 8; título sección "Productos relacionados" / "Complementos recomendados" configurable v1 fijo.

**Alternativa:** Heurística por categoría — reemplaza demo `getRelatedProducts`; no cumple RF-012 configurable.

### 9. generateStaticParams

**Decisión:** ISR: `generateStaticParams` obtiene slugs publicados vía CMS (`limit=500` v1) o vacío en dev sin CMS; `dynamicParams = true` para slugs no pre-renderizados.

### 10. Componentes e imagen

**Decisión:** `ProductImage` acepta `imageUrl?: string | null`; si URL, `<img>` con `next/image`; si no, glyph existente. Tokens `--surface-*` sin hex nuevos.

## Risks / Trade-offs

- **[Risk] Lexical → HTML en servidor añade dependencia** → Mitigation: helper compartido en `lib/cms/lexical-to-html.ts`; fallback a texto plano si conversión falla.
- **[Risk] Related products sin quotes batch lento** → Mitigation: cap 8 SKUs, reuse `resolvePriceQuotesBatch`.
- **[Risk] Campo attachments ausente en CMS** → Mitigation: tarea apply añade campo; PDP oculta sección hasta entonces.
- **[Risk] Slug duplicado o cambio post-publicación rompe enlaces** → Mitigation: redirect SKU→slug; staff warning duplicate slug ya en Payload.
- **[Trade-off] Galería multi-thumb placeholder** → Aceptado hasta #21; una imagen real es suficiente para RF-012 mínimo.
- **[Trade-off] Rating placeholder vs oculto** → Ocultar bloque si `reviews` ausente en CMS.

## Migration Plan

1. Extender tipos y fetch CMS (`fetch-product-pdp.ts`); tests mapper + visibility.
2. Implementar `load-pdp-page.ts` con quote/stock/related batch.
3. Refactor `ProductBuyBox`, `PackQtyStepper`, `ProductTabs`, `ProductImage`.
4. Reescribir `(shop)/p/[id]/page.tsx`; quitar demo imports.
5. CMS: campo `attachments` si falta; seed relatedProducts en `jeyjo-catalog`.
6. Verificar `pnpm --filter storefront typecheck`, `test`, `build`; manual US-03 CA2, RF-012 cross-sell, RF-011 precio dual.
7. Rollback: `PDP_USE_DEMO_DATA=true` restaura página demo (flag en `.env.example`).

## Open Questions

- ¿Campo `attachments` ya existe en Products? **Acción apply:** verificar `Products/index.ts`; añadir si ausente.
- ¿Atributos técnicos ERP estructurados (JSON) o solo columnas fijas? **Decisión v1:** tabla fija ERP + enrichment; JSON pospuesto a #21 PIM.
- ¿Copy exacto aviso US-03 CA4? **Decisión:** "El pedido queda pendiente de validación por comprobación de stock de la referencia {REF}".
