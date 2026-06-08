## Context

- **Estado actual:** PLP facetada (#10) renderiza `ProductCard` con `PlpProductRow`, quotes batch y stock en `/c/*` y `/search`. No existe control de comparación ni ruta dedicada. Estado cliente similar en `useUiStore` (Zustand + persist parcial) y wishlist en localStorage.
- **Alcance:** **US-06** CA1–CA4; listados facetados únicamente.
- **Dependencias ROADMAP:** #10 completado. Campos producto disponibles: `brand`, `supplier`, `facetColor`, `facetMaterial`, `packUnit`, `shortDescription`, `stockIndicator`, imagen catálogo.

## Goals / Non-Goals

**Goals:**

- Store Zustand `useCompareStore` persistido (`jeyjo-compare`): hasta 3 entradas `{ sku, slug, title, imageUrl }` ordenadas por selección.
- Toggle "Comparar" en `ProductCard` cuando recibe `row` (modo PLP); no en modo legacy `product` demo salvo que se use en grid PLP.
- Barra fija `CompareBar` en layout shop cuando `count >= 1`: miniaturas, contador "X de 3", botón "Comparar" (habilitado con ≥2 SKUs), limpiar todo.
- Ruta `(shop)/comparar/page.tsx`: lee `searchParams.skus` (CSV o repetido); valida 2–3 SKUs públicos; server loader `loadComparePage(skus)` devuelve filas enriquecidas + quotes + stock.
- Tabla responsive: filas de atributo × columnas producto; fila cabecera con imagen, nombre, enlace PDP; filas precio (dual RF-011), marca, proveedor, color, material, unidad envase, stock semáforo, descripción corta truncada (~240 chars).
- Add-to-cart por columna: `addItem(sku, packUnit)` + `setMiniCartOpen(true)` — mismo patrón PLP.
- Al superar 3: no añadir; toast o banner inline con texto exacto US-06 CA2 (reutilizar patrón toast existente o `role="alert"` en barra).
- Sincronizar URL `/comparar?skus=a,b,c` con selección al navegar desde barra; si usuario abre URL directa, hidratar store con SKUs válidos.
- Tests unitarios: store (límite 3, toggle idempotente), parser `skus` query, mapper atributos.

**Non-Goals:**

- CMS schema changes, dimensiones físicas, comparar desde home/PDP, persistencia servidor, GA4, export.

## Decisions

### 1. Estado cliente vs URL

**Decisión:** Zustand persist como fuente durante navegación PLP; al pulsar "Comparar" navegar a `/comparar?skus=${skus.join(',')}`. La página servidor valida SKUs contra catálogo público; si alguno deja de ser público, mostrar aviso y columna vacía o redirigir con SKUs válidos restantes.

**Alternativa descartada:** Solo query string sin store — pierde selección al volver atrás sin URL.

### 2. Carga de datos en `/comparar`

**Decisión:** Server Component `loadCompareProducts(skus: string[])` en `lib/compare/load-compare-page.ts`:
1. `fetchPublicProductsBySkus(skus)` — nueva función sobre Payload REST `where[sku][in]=…` + `isPublicProduct`, `depth=1` (reutilizar filtro de `fetch-product-list.ts`).
2. `POST /api/pricing/batch` interno o import directo del handler server-side para quotes.
3. Batch stock vía helper PLP existente (`resolveStockIndicatorsForSkus` o equivalente).
4. Mapper `toCompareColumn(row, quote, stock)` con filas ordenadas según orden de `skus` en URL.

**Alternativa descartada:** Client fetch N+1 por SKU — más lento y expone CMS URL al cliente.

### 3. Control en tarjeta

**Decisión:** Checkbox estilizado bajo imagen o junto a acciones con label "Comparar"; `aria-checked` refleja store. No bloquear click en card/link.

**Alternativa:** Botón icono solo — peor accesibilidad CA1 ("checkbox o botón"; checkbox preferido).

### 4. Conjunto de atributos CA3

**Decisión:** Filas fijas v1:

| Fila | Fuente |
|------|--------|
| Precio | `PriceQuote` + dual display |
| Marca | `brand` |
| Proveedor | `supplier` |
| Color | `facetColor` o "—" |
| Material | `facetMaterial` o "—" |
| Unidad de envase | `packUnit` (texto "Caja de N uds.") |
| Disponibilidad | `StockIndicatorBadge` |
| Descripción | `shortDescription` plain, truncada |

"Dimensiones" en US-06 se cubre con unidad de envase + color/material hasta PIM; documentado en non-goals.

### 5. Mínimo 2 productos para ver comparación

**Decisión:** Botón "Comparar" en barra deshabilitado con 1 SKU; tooltip "Selecciona al menos 2 productos". Página `/comparar` con 1 SKU muestra empty state con CTA volver al catálogo; con 0 SKUs redirect `/`.

**Alternativa:** Permitir 1 columna — no cumple espíritu US-06 ("entre 2 y 3").

### 6. Integración layout

**Decisión:** Montar `CompareBar` en `(shop)/layout.tsx` junto a shell existente; lee store cliente only (`dynamic` boundary o `'use client'` wrapper).

## Risks / Trade-offs

- **[SKUs obsoletos en localStorage]** → Validación servidor en `/comparar`; limpiar entradas inválidas del store al hidratar.
- **[Atributos vacíos en muchos productos]** → Mostrar "—"; no ocultar fila (consistencia tabla).
- **[Descripción HTML en shortDescription]** → Strip tags en mapper; no render rich text en comparación v1.
- **[Tabla ancha en móvil]** → Scroll horizontal contenedor + sticky primera columna de etiquetas; probar 320px.
- **[Precio B2B toggle]** → Reutilizar `useUiStore.priceMode` + `getPriceViewFromQuote`; mismo comportamiento PLP.

## Migration Plan

1. Implementar store + UI tarjeta/barra (feature usable en PLP sin ruta).
2. Añadir loader y página `/comparar`.
3. Deploy storefront only; sin migraciones DB.
4. **Rollback:** ocultar `CompareBar` y toggle vía env `NEXT_PUBLIC_COMPARE_ENABLED=false` (default true) o revert deploy.

## Open Questions

- Ninguna bloqueante: conjunto de atributos v1 acordado con non-goals PIM; confirmar copy exacto CA2 en español durante implementación.
