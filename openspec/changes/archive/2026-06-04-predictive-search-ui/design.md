## Context

- **Estado actual:** `SearchBar` en cabecera (#9) usa `searchProducts` / `searchCategories` sobre `lib/data/products.ts` y `CATEGORIES` estáticos, umbral 2 caracteres, sin llamada a red. `loadPlpPageFromSearch` / `searchPublicProducts` filtran por `contains` en campos CMS o demo fallback. El indexer (#13) escribe puntos en Qdrant `products` y `categories` con `Xenova/multilingual-e5-small` (384 dim) y payload con título, refs, EAN, slug, imagen.
- **Requisitos:** **RF-009**, **US-01** (CA1–CA5), **CA-SEARCH-001–003**, **RNF-002** (&lt;150 ms suggest). Arquitectura §1: lectura Qdrant desde capa serverless Next.js, no desde el navegador.
- **Dependencias:** #9 shell, #13 indexer, #6 precios, #7 catálogo, #10 PLP facetada. No modifica worker ni cola.

## Goals / Non-Goals

**Goals:**

- Ruta `POST /api/search/suggest` (o `GET` con query acotada) en storefront: validar `q` (≥3 caracteres tras trim), embed, `searchPoints` en `products` (limit 10) y `categories` (limit 4), filtrar wildcard/no publicados en hidratación.
- Paridad de embedding con CMS: mismo `MODEL_ID`, pooling mean, normalize, dimensión 384 — vía paquete compartido `packages/search-embedding` o copia mínima documentada en monorepo.
- Cliente `SearchBar`: debounce 200–300 ms, abort prior request, panel con secciones “Categorías sugeridas” y “Productos”, precios dual vía batch pricing existente, mensaje US-01 CA5, combobox ARIA (`aria-expanded`, `aria-activedescendant`, flechas, Escape).
- `/search?q=`: resolver SKUs candidatos con misma pipeline vectorial (mayor limit, p. ej. 200) antes de facetas PLP; mantener URL state y paginación #10.
- Variables entorno storefront: `QDRANT_URL`, `QDRANT_API_KEY` (opcional local), `CMS_URL` ya existente.
- Tokens UI: reutilizar clases `animate-fade-up`, `border-border`, `bg-surface`; sin hex nuevos.

**Non-Goals:**

- Voz EVA, analytics de búsqueda, re-ranking ML, A/B.
- Embedding API externa (OpenAI) en producción.
- CMS admin search, colección Qdrant `pages`.
- Cambiar `vectorSize` o modelo sin migración coordinada con indexer.

## Decisions

### 1. Lectura Qdrant desde storefront (no proxy CMS)

**Decisión:** Cliente Qdrant en `apps/storefront/src/lib/qdrant/` (wrapper fino sobre `@qdrant/js-client-rest`, misma distancia Cosine que CMS). El navegador solo llama `/api/search/suggest`.

**Alternativa descartada:** Proxy en Payload — latencia extra, acopla tráfico tienda al CMS, cold start doble.

### 2. Embedding en la ruta suggest

**Decisión:** Extraer `embedQueryText` a `packages/search-embedding` importado por CMS indexer y storefront suggest (re-export desde CMS en apply si el paquete se introduce en el mismo PR). Singleton del pipeline en proceso serverless con warm en primer request.

**Alternativa descartada:** Precomputed sparse-only — no cumple tolerancia tipográfica RF-009.

### 3. Contrato API suggest

**Decisión:** `POST { "q": string }` → `{ products: SuggestProduct[], categories: SuggestCategory[], latencyMs?: number }`. `SuggestProduct`: `sku`, `title`, `slug`, `href`, `imageUrl?`, `refs`, `ean?`, `priceQuote?` (batch). Score Qdrant no expuesto al cliente. HTTP 400 si `q.length < 3`; 503 si Qdrant down con body `{ error, fallback?: false }`.

**Alternativa:** GraphQL Payload — no optimizado para &lt;150 ms.

### 4. Hidratación post-Qdrant

**Decisión:** IDs de punto = `entity_id` del indexer. Tras search, `fetchPublicProductsBySkus(ids)` desde Payload REST con `public-product-filter`; descartar SKUs no publicados o wildcard. Orden preservar score Qdrant. Categorías: payload Qdrant `title`, `slug` → `/c/{slug}`.

**Alternativa:** Solo payload Qdrant sin CMS — riesgo de datos obsoletos en precio/stock.

### 5. Precios en desplegable

**Decisión:** Reutilizar `POST /api/pricing/batch` server-side dentro de suggest route para hasta 10 SKUs (misma regla dual #6 / toggle cookie futura; v1 respeta `priceMode` del cliente vía header opcional `x-price-mode` o query en suggest).

### 6. SearchBar cliente

**Decisión:** Hook `usePredictiveSearch` con `fetch('/api/search/suggest')`, debounce, `AbortController`. Mínimo 3 caracteres (alinear US-01 CA1). Mantener submit Enter → `/search?q=`. Extraer subcomponentes `SearchSuggestPanel`, `SearchProductRow` para tests.

**Alternativa:** Server Action en cada keystroke — más round-trips RSC; descartada.

### 7. Página `/search` y PLP

**Decisión:** `searchPublicProducts(q)` delega a `vectorSearchProductSkus(q, { limit: 200 })` luego carga filas PLP y aplica facetas existentes sobre ese conjunto. Eliminar rama demo `matchesSearchQuery` en producción; mantener `PLP_DEMO_FALLBACK` solo dev.

### 8. Rendimiento y cache

**Decisión:** `unstable_cache` o LRU en memoria (max 100 entradas, TTL 60s) keyed por hash normalizado de `q` para vector de consulta; no cachear respuesta hidratada completa (precios cambian). Objetivo log `suggest_latency_ms` con fases embed / qdrant / hydrate.

**Trade-off:** Primera petición tras cold start puede &gt;150 ms — documentar warm-up en staging y Vercel `experimental` o cron ping opcional fuera de scope.

### 9. Accesibilidad

**Decisión:** `role="combobox"`, lista `role="listbox"`, opciones `role="option"`, foco trap no (solo panel flotante), cierre click-outside existente. Mensaje vacío exacto: «No hemos encontrado resultados para «{q}»» + chips categorías relacionadas si Qdrant devuelve categorías con score bajo umbral.

### 10. Fallback desarrollo

**Decisión:** Si `QDRANT_URL` ausente y `NODE_ENV=development`, suggest puede devolver stub vacío y SearchBar muestra banner dev; no usar datos demo silenciosamente en producción.

## Risks / Trade-offs

- **[Risk] Cold start Transformers.js en Vercel** → Mitigation: paquete compartido, considerar Edge no (modelo pesado); ping warm en deploy script opcional; medir p95 en staging.
- **[Risk] Doble carga del modelo (CMS + storefront)** → Mitigation: procesos separados aceptados; no duplicar en mismo isolate.
- **[Risk] Latencia &gt;150 ms con Qdrant Cloud lejano** → Mitigation: región EU alineada a Vercel; cache embedding; límite estricto de hidratación (10 SKUs).
- **[Risk] Desalineación embedding query vs document** → Mitigation: mismo modelo y `normalize: true`; prefijo `query:` / `passage:` si e5 lo exige — verificar en apply contra indexer `indexText`.
- **[Trade-off] `/search` candidatos top-200 vectoriales** → facetas pueden omitir matches lexicales fuera del top-K; aceptado hasta híbrido sparse+vector.

## Migration Plan

1. Añadir `QDRANT_*` a `.env.example` storefront y Vercel.
2. Implementar paquete/ruta suggest en feature branch; verificar indexer poblado en staging.
3. Sustituir `SearchBar` y `searchPublicProducts` en un deploy; monitorizar latencia y errores 503.
4. Rollback: feature flag `PREDICTIVE_SEARCH_ENABLED=false` restaura filtro texto CMS/demo sin quitar ruta.

## Open Questions

1. ¿Prefijo e5 `query:` en embed de consulta vs documento (revisar `indexText.ts` en apply)?
2. ¿Warm cron en storefront para modelo (coste Vercel) o aceptar primer hit lento?
3. ¿Header `x-price-mode` en suggest o inferir solo B2C anónimo en v1?
