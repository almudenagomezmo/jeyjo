## Context

- **Estado actual:** Supabase expone `public.search_events` con índices y RLS service-role (#2). Payload hooks en `products` y `categories` insertan filas `pending` vía `enqueueSearchEvent()` (`src/lib/supabase-server.ts`, `src/hooks/searchEventHooks.ts`). Qdrant tiene cliente REST (`src/lib/qdrant.ts`), colecciones declaradas en `qdrant-collections.ts` (`products`, `pages`, `vectorSize: 384`) y `ensureCollection` en `onInit` de Payload. **No hay worker** ni servicio de embeddings. Cron existentes: `erp-catalog-sync`, `stock-sync` (patrón `CRON_SECRET` + `vercel.json`).
- **Brecha:** La cola crece sin consumo; RF-009 exige índice actualizado en &lt;60 s y sin `error` acumulados; #14 necesita vectores listos en `products`.
- **Arquitectura:** MOD-07 / MOD-09 en `04-arquitectura-jeyjo.md` — Event Indexer Worker entre `search_events` y Qdrant.
- **Requisitos:** RF-009 (campos indexables, consistencia eventual), RF-006 (comodín fuera del índice público), RNF-002 (latencia de búsqueda — preparación, no UI).

## Goals / Non-Goals

**Goals:**

- Drenar la cola `search_events` en batches con claim atómico y estados `processing` / `done` / `error`.
- Indexar productos publicables en colección Qdrant `products` con payload de búsqueda (título, refs, EAN, slug, categoría, precio base si disponible).
- Eliminar puntos Qdrant en eventos `delete` y al detectar `isWildcard`.
- Embedding reproducible en dev sin API key obligatoria; dimensión 384 alineada a `qdrant-collections.ts`.
- Cron Vercel cada **1 minuto** (objetivo &lt;60 s desde enqueue) + ruta manual dev.
- Tests de integración: enqueue → worker → punto en Qdrant; delete; wildcard skip; error Qdrant down.

**Non-Goals:**

- Storefront predictivo (#14), voz EVA, lectura Qdrant desde Next.js.
- Colección `pages` (sin hooks de cola hoy).
- Reindex histórico masivo de todo el catálogo (script one-off opcional, no bloqueante).
- Cambio de proveedor embedding en producción sin runbook de recreación de colección.

## Decisions

### 1. Ubicación del worker: `apps/cms`

**Decisión:** Módulo `apps/cms/src/search-indexer/` con `runSearchIndexerBatch()` invocado desde cron y ruta manual.

**Alternativa descartada:** Edge Function Supabase — no accede a Payload Local API ni al runtime de embeddings sin cold start pesado.

**Rationale:** Misma app que encola eventos y ya inicializa Qdrant; patrón idéntico a sync ERP/stock.

### 2. Scheduling: Vercel Cron → `GET /api/cron/search-indexer`

**Decisión:** Ruta en `src/app/(app)/api/cron/search-indexer/route.ts`, `maxDuration` 60–120 s, `Authorization: Bearer ${CRON_SECRET}`. Entrada en `vercel.json` con schedule `* * * * *` (cada minuto) para cumplir ventana RF-009.

**Alternativa:** Solo poll en `onInit` — no corre en serverless entre requests.

**Dev:** `POST /next/process-search-events` (admin, no-producción) o `curl` al cron local con `CRON_SECRET`.

### 3. Claim de eventos: UPDATE … RETURNING con filtro `pending`

**Decisión:** Por batch (default 50), `UPDATE search_events SET status='processing' WHERE id IN (SELECT id FROM search_events WHERE status='pending' ORDER BY created_at LIMIT $n FOR UPDATE SKIP LOCKED) RETURNING *` vía Supabase RPC o query equivalente con service role. Evita doble procesamiento en ejecuciones cron concurrentes.

**Alternativa:** SELECT then UPDATE sin lock — race en Vercel.

### 4. Resolución de documento: payload de cola + fallback Payload

**Decisión:** Para `entity_type=producto` y `action=upsert`, construir texto de embedding desde `event.payload` (hooks ya envían title, slug, SEO). Si faltan `skuErp` / `ean` / `oemRef`, cargar producto con `payload.findByID` usando el id original revertido desde `entity_id` (mapa inverso: guardar `payloadEntityId` numérico en json del evento en ampliación de hook, o buscar por UUID determinístico vía lista acotada — **preferido:** ampliar `buildSearchPayload` para incluir refs ERP en el mismo cambio).

**Rationale:** Sync ERP (#7) puede encolar con payload mínimo; el worker no debe depender solo del snapshot incompleto.

### 5. Modelo de embedding: `@xenova/transformers` + `Xenova/multilingual-e5-small`

**Decisión:** Dependencia en `@jeyjo/cms`, pipeline `feature-extraction`, pooling mean, dimensión **384**, texto prefijado `query: ` para consultas futuras y sin prefijo para documentos (convención e5). Singleton lazy-loaded en el proceso para amortizar cold start.

**Alternativas descartadas:** OpenAI `text-embedding-3-small` — coste y API key en dev; hash bag-of-words — no cumple búsqueda semántica RF-009.

**Nota:** Primera ejecución descarga modelo (~100MB); documentar en `docs/qdrant.md`.

### 6. Mapeo entidad → Qdrant

| `entity_type` | Colección Qdrant | Point ID | Acción delete |
|---------------|------------------|----------|---------------|
| `producto`    | `products`       | `entity_id` (uuid) | `deletePoints` |
| `categoria`   | `categories` (nueva en `qdrant-collections.ts`, vectorSize 384) | `entity_id` | `deletePoints` |

**Decisión:** Añadir entrada `categories` en `qdrant-collections.ts` y procesar categorías en el mismo worker (título, slug, meta).

**Payload Qdrant (products):** `{ entityType, payloadId, skuErp, title, slug, ean, oemRef, mainWholesaleRef, categorySlug?, isPublished, thumbnailUrl? }` — sin datos de precio por cliente (eso es #6 en runtime de búsqueda UI).

### 7. Wildcard y borrador (RF-006)

**Decisión:** Si producto tiene `isWildcard === true` o `_status !== 'published'`, **no** upsert; si existía punto, `deletePoints`. Alineado a `catalog-wildcard-exclusion`.

### 8. Errores y reintentos

**Decisión:** Máximo **3** intentos por evento (contador en memoria del batch o campo derivado de re-encolado manual). Tras agotar: `status='error'`, `error_message` truncado a 500 chars, `processed_at=now()`. Fallo Qdrant transitorio: no marcar `done`; reintento en siguiente cron si se implementa reset `processing`→`pending` tras timeout (heartbeat: eventos `processing` &gt; 10 min vuelven a `pending`).

**Alternativa:** Borrar eventos error — viola spec `search-events-queue`.

### 9. Idempotencia

**Decisión:** Múltiples `upsert` para el mismo `entity_id` sobrescriben el mismo point id en Qdrant. Opcional: al encolar, no deduplicar en SQL (simplicidad); el worker ordena por `created_at`.

### 10. Observabilidad

**Decisión:** Respuesta JSON del cron: `{ processed, succeeded, failed, skippedWildcard, durationMs }`. Logs `payload.logger` por error con `searchEventId`.

## Risks / Trade-offs

| Riesgo | Mitigación |
|--------|------------|
| Cold start + carga del modelo en Vercel | `maxDuration` 120; batch pequeño; considerar warm cron; documentar dev local |
| Memoria en serverless con Transformers.js | Limitar batch a 20–50; no paralelizar embeddings masivo |
| Eventos `processing` huérfanos tras timeout Vercel | Job de recuperación: reset `processing` &gt; 10 min → `pending` |
| Dimensión embedding distinta de colección | Test que falla CI si `vectorSize !== embedding.length` |
| Payload hook sin refs ERP | Ampliar `buildSearchPayload` en mismo PR |

## Migration Plan

1. Desplegar código con cron **desactivado** en preview; verificar Qdrant reachable y colecciones creadas.
2. Ejecutar manualmente worker en staging con cola de prueba (`seed.sql` ya inserta eventos).
3. Habilitar cron `* * * * *` en producción.
4. **Rollback:** desactivar cron en `vercel.json`; índice Qdrant queda stale pero catálogo Payload intacto; eventos permanecen `pending`/`error` para reprocess.

## Open Questions

- ¿Indexar precio P1 en payload Qdrant para sugerencias #14 o solo en UI vía Payload? **Propuesta:** incluir `priceHint` numérico opcional si está en documento, sin motor de precios por cliente.
- ¿Hosting Qdrant Cloud definitivo vs Docker local? Fuera de scope; usar env existentes.
