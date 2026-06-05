## Context

- **Estado actual:** Cambio #13 entregó `search_events` hooks (products, categories), worker `runSearchIndexerBatch`, cron `/api/cron/search-indexer` cada minuto, retry x3, reset `processing` >10 min. Storefront #14 consume Qdrant vía `/api/search/suggest`. RF-009 exige índice actualizado en <60 s y cola sin `error` acumulados.
- **Brecha operativa:** El cron solo drena `pending`. No detecta entidades Payload sin evento `done` reciente, fallos de enqueue silenciosos, catálogo histórico sin indexar, puntos huérfanos en Qdrant, ni alerta staff cuando la cola degrada. En dev/prod reciente: auth Qdrant incorrecta → eventos `error`; colecciones vacías → suggest falla o vacío.
- **Arquitectura (MOD-07/09):** Payload → `search_events` → Event Indexer Worker → Qdrant. Este cambio añade capas de reconciliación y observabilidad sin sustituir la cola.
- **Restricciones:** Vercel cron + `CRON_SECRET`; embeddings `@xenova/transformers` 384d; catálogo 5k–30k productos; no bloquear save en admin.

## Goals / Non-Goals

**Goals:**

- Garantizar que todo producto/categoría publicable acabe indexado en Qdrant aunque falle un enqueue puntual.
- Recuperar automáticamente eventos `error` recientes tras incidentes Qdrant/Supabase.
- Eliminar vectores huérfanos en Qdrant (borrados, draft, wildcard) con job diario acotado.
- Exponer backfill one-shot para migraciones (Qdrant Cloud nuevo, recreación de colección).
- Visibilidad operativa: KPIs de cola + alerta dashboard cuando `error` > 0 o lag > umbral.
- Mantener ventana RF-009 (<60 s) vía cron indexer existente; reconciliación horaria como red de seguridad.

**Non-Goals:**

- Upsert síncrono en hooks Payload.
- Reindex completo cada minuto.
- Indexación de `pages` (sin hooks hoy).
- Cambio de modelo embedding o dimensión vectorial.
- Pentest Qdrant Cloud / rotación API keys (runbook ops, fuera de código).

## Decisions

### 1. Tres crons protegidos con `CRON_SECRET`

| Ruta | Schedule (Vercel) | Función |
|------|---------------------|---------|
| `/api/cron/search-indexer` | `* * * * *` (existente) | Drena `pending` → Qdrant |
| `/api/cron/search-reconcile` | `0 * * * *` (cada hora) | Detecta stale + reintenta `error` |
| `/api/cron/search-orphan-cleanup` | `0 4 * * *` (04:00 UTC diario) | Scroll Qdrant vs Payload |

**Alternativa descartada:** Un solo cron que hace todo — mezcla latencias críticas (indexer 1 min) con trabajo pesado (scroll 30k).

**Rationale:** Separación de concerns; indexer sigue cumpliendo RF-009; reconcile/cleanup no compiten por `maxDuration`.

### 2. Reconciliación por `updatedAt` + último evento `done`

**Decisión:** Módulo `src/search-indexer/reconcile.ts` con `runSearchReconcile()`:

1. **Stale products:** Payload query `products` where `_status=published`, `isWildcard!=true`, paginado (100/page). Para cada doc, consultar último `search_events` con `entity_id`, `status=done`. Si `product.updatedAt > done.processed_at + STALE_MARGIN` (default 2 h) **o** no existe evento `done`, `enqueueSearchEvent({ action: 'update', ... })`.
2. **Stale categories:** Misma lógica en `categories` publicadas.
3. **Error retry:** `search_events` where `status=error`, `processed_at > now()-24h`, payload `_reconcileAttempts < 3` → reset a `pending`, incrementar `_reconcileAttempts`.

**Alternativa descartada:** Scroll Qdrant cada hora — costoso; reservado al cleanup diario.

**Dedup:** Antes de enqueue, comprobar si ya existe `pending` o `processing` para mismo `entity_type` + `entity_id`; skip si sí.

**Config:** Umbrales en env (`SEARCH_RECONCILE_STALE_HOURS=2`, `SEARCH_RECONCILE_ERROR_WINDOW_HOURS=24`) con defaults documentados.

### 3. Orphan cleanup via scroll + Payload existence check

**Decisión:** `runSearchOrphanCleanup()`:

- Scroll Qdrant `products` y `categories` (batch 256, `with_payload=false`, solo ids).
- Para cada id, `payload.findByID` (o batch `where id in [...]`). Si doc ausente, draft, wildcard (products) → `deletePoints`.
- Límite por ejecución: `ORPHAN_CLEANUP_MAX_DELETES=500` para acotar tiempo cron.

**Alternativa descartada:** Full diff bidireccional Payload→Qdrant en cleanup — redundante con reconcile horario.

### 4. Backfill endpoint (admin + dev)

**Decisión:** `POST /next/search-backfill` (mismo patrón auth que `process-search-events`):

- Query all published non-wildcard products + published categories (paginado).
- Enqueue `update` por entidad (respect dedup pending).
- Return `{ enqueuedProducts, enqueuedCategories, skippedDuplicate }`.
- No ejecuta embeddings inline; delega al indexer cron.

**Alternativa descartada:** CLI script solo — admin UI route más usable en dev/staging.

### 5. Dev-only post-save trigger (opcional)

**Decisión:** Si `SEARCH_INDEX_ON_SAVE=true` y `NODE_ENV !== 'production'`, tras enqueue exitoso en hook, `void runSearchIndexerBatch({ batchSize: 5 })` fire-and-forget (catch log, no throw).

**Alternativa descartada:** Siempre en prod — riesgo cold start embedding en request path.

### 6. Observabilidad

**Decisión:**

- Función `getSearchQueueStats()` → `{ pending, processing, error, oldestPendingAgeSec }` vía Supabase count queries.
- KPI cards en dashboard (`beforeDashboard`): pending / error / lag.
- System alert tray: warning si `error > 0` o `oldestPendingAgeSec > 300`; error si `error >= 10` o lag > 900 s.
- Opcional ratio: `qdrantProductCount / publishedProductCount` (cached 5 min, Qdrant `count` API) — sanity card, no bloqueante.

**Integración:** Extender componentes existentes de #30, no nueva página.

### 7. Reuse worker primitives

**Decisión:** Reconcile y cleanup no duplican embedding logic; solo enqueue o delete. Indexer cron existente procesa nuevos pending.

**Shared:** `enqueueSearchEvent`, `deletePoints`, `buildSearchPayload`, claim/retry helpers en `searchEvents.ts`.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Reconcile horario genera ráfaga de pending | Dedup + batch indexer 50/min; paginación; margin 2 h evita re-enqueue en cada save |
| Scroll cleanup lento en 30k puntos | Schedule diario 04:00 UTC; max deletes cap; `maxDuration` 120 s |
| Doble indexación mismo producto | Claim atómico + dedup pending; idempotente upsert Qdrant |
| `_reconcileAttempts` en payload JSON | Campo interno; no expuesto a cliente |
| Qdrant count API falla | KPI ratio muestra "—"; alertas basadas en cola Supabase siguen activas |
| Backfill masivo tras migración | Documentar: ejecutar backfill + monitor pending hasta 0; primera corrida embedding lenta |

## Migration Plan

1. **Deploy código** con crons registrados pero reconcile/cleanup idempotentes.
2. **Configurar** `CRON_SECRET`, `QDRANT_URL`, `QDRANT_API_KEY` en Vercel CMS + local `.env`.
3. **Verificar colecciones** Qdrant (`products`, `categories`) — `onInit` Payload o manual.
4. **Backfill:** `POST /next/search-backfill` (admin) en staging/prod post-deploy.
5. **Monitor:** pending → 0 en < N horas según catálogo; error count = 0.
6. **Rollback:** Desactivar entradas reconcile/cleanup en `vercel.json`; indexer sigue operando; no destructivo salvo cleanup (pausable).

## Open Questions

- ¿Exponer toggles reconcile/cleanup en `systemSettings.search` (#42) o solo env? **Propuesta v1:** env + documentación; toggle en change futuro si ops lo pide.
- ¿Umbral alerta configurable en systemSettings? **Propuesta v1:** constantes con env override.
- ¿Incluir `pages` en backfill/reconcile en v1? **No** — non-goal; change separado si CMS indexa pages.
