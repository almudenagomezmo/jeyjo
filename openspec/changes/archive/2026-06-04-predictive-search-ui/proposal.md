## Why

El cambio #13 (`search-events-qdrant-worker`) dejó el índice Qdrant alimentado por la cola `search_events`, pero la cabecera del storefront sigue usando `SearchBar` con búsqueda **cliente** sobre datos demo (`lib/data/products.ts`, umbral de 2 caracteres, sin vectores). No se cumplen **RF-009** ni **US-01** (sugerencias visuales desde la 3.ª letra, &lt;150 ms, tolerancia tipográfica, EAN/referencias) ni los criterios **CA-SEARCH-001/002/003**. El ROADMAP marca #14 como siguiente paso natural tras #9 (shell con barra de búsqueda) y #13 (índice listo).

## What Changes

- **API de sugerencias en storefront:** ruta serverless que embebe la consulta con el mismo modelo que el indexer (`Xenova/multilingual-e5-small`, 384 dim), consulta Qdrant (`products`, `categories`) y devuelve hits normalizados (sin exponer Qdrant al navegador).
- **Hidratación de resultados:** enriquecer IDs de Qdrant con datos públicos desde Payload/CMS (título, slug, imagen, referencias, EAN) y precios vía motor #6 en batch acotado para el desplegable.
- **`SearchBar` productivo:** debounce, mínimo 3 caracteres, panel tipo Amazon/Booking (productos con miniatura, nombre, precio dual **RF-011**; categorías sugeridas), mensaje vacío alineado a US-01 CA5, navegación teclado y ARIA combobox.
- **Envío a `/search`:** Enter y CTA “Ver todos los resultados” conservan flujo a PLP facetada (#10); la página `/search?q=` usa el mismo backend vectorial para el conjunto candidato (sustituye filtro texto demo en PLP).
- **Rendimiento:** cache corta de embeddings de consulta, límite 10 productos / 4 categorías en suggest; objetivo p95 &lt;150 ms en staging con Qdrant cercano (RNF-002).
- **Observabilidad mínima:** logs de latencia en ruta suggest; feature flag o fallback demo solo en dev si Qdrant no está disponible.

## Capabilities

### New Capabilities

- `storefront-predictive-search`: API suggest, cliente SearchBar, integración Qdrant lectura, hidratación CMS + precios, y comportamiento de `/search` basado en vectores.

### Modified Capabilities

- `storefront-plp-faceted`: El requisito de `/search` deja de depender del filtro texto demo y pasa a candidatos resueltos por búsqueda vectorial + facetas existentes.
- `storefront-shell-navigation`: Ampliar el requisito de búsqueda en cabecera para exigir desplegable predictivo (3+ caracteres, &lt;150 ms) además del submit a `/search`.

## Impact

- `apps/storefront`: `SearchBar`, nueva lib `search/` (cliente API, tipos), `app/api/search/suggest/route.ts`, posible módulo `embedding` o paquete compartido; variables `QDRANT_URL`, `QDRANT_API_KEY`; actualización de `(shop)/search` y `fetch-product-list` / `searchPublicProducts`.
- `apps/cms`: sin cambios de indexer; opcional endpoint interno solo si se descarta embedding en storefront (preferido: lectura Qdrant desde storefront).
- `packages/`: evaluar extracción mínima de `embedDocumentText` + constantes Qdrant a paquete compartido para paridad indexer/suggest.
- Infra: `QDRANT_*` en proyecto Vercel storefront; cold start del modelo en serverless (riesgo documentado en design).
- Desbloquea cumplimiento de **US-01**, **RF-009** (parte lectura/UI), **CA-SEARCH-001–003**; no incluye voz EVA ni dashboard de errores de cola (#30).
- Depende de ROADMAP #9 y #13 (completados). Alineado a alcance §1.3 buscador, **RNF-002**.

## Non-Goals

- Búsqueda por voz / integración EVA (gap consciente en ROADMAP).
- Reindex masivo, cambios al worker `search-indexer` o esquema `search_events` (salvo bugfix trivial).
- Indexación de proveedores o colección `pages` en Qdrant.
- Búsqueda en backoffice Payload (`apps/cms` Search component).
- Analytics de términos, personalización por historial, o A/B de ranking.
- Sustituir por completo la PLP facetada; solo el origen del conjunto candidato en `/search` cambia.
