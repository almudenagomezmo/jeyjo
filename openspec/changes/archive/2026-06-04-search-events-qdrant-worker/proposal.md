## Why

Tras el esquema Supabase (#2), los hooks Payload (#3) y la sync de catálogo (#7), la tabla `search_events` recibe filas `pending` en cada cambio de producto o categoría, pero **no existe ningún consumidor** que actualice el índice Qdrant. Sin este worker (cambio #13 del ROADMAP) no se cumple **RF-009** (indexación asíncrona en &lt;60 s), el criterio de verificación de cola sin `error` acumulados, ni se desbloquea la UI de búsqueda predictiva (#14, **US-01**).

## What Changes

- **Worker de indexación:** proceso server-side en `apps/cms` que hace poll de `search_events` (`pending` → `processing` → `done` | `error`), con reintentos acotados y `error_message` persistente.
- **Proyección a Qdrant:** upsert/delete en la colección `products` (y preparación para `categories` si aplica) usando el cliente existente (`src/lib/qdrant.ts`), respetando `vectorSize: 384` de `qdrant-collections.ts`.
- **Generación de embeddings:** servicio de embedding local (sin dependencia obligatoria de API externa en dev) que concatena campos indexables (nombre, referencias mayorista/OEM, EAN, categoría, keywords) según **RF-009**.
- **Enriquecimiento desde Payload:** para eventos `upsert`, cargar el documento actual desde Payload cuando el `payload` de la cola sea insuficiente (p. ej. tras sync ERP).
- **Exclusión comodín (RF-006):** productos con `isWildcard=true` no se indexan en Qdrant (o se eliminan del índice si ya existían).
- **Triggers operativos:** ruta cron protegida con `CRON_SECRET` (patrón de `erp-catalog-sync` / `stock-sync`) y endpoint manual en no-producción para drenar la cola en local.
- **Observabilidad mínima:** logs estructurados por batch; contadores en respuesta del cron.
- **No incluye:** barra de búsqueda predictiva en storefront (#14), búsqueda por voz EVA, consultas de lectura desde Next.js a Qdrant, hosting/decisión Qdrant Cloud (ya documentada), colección `pages` de Qdrant salvo stub, dashboard de alertas (#30), reindex masivo histórico fuera de la cola (script opcional fuera de scope).

## Capabilities

### New Capabilities

- `qdrant-search-indexer`: Worker, embedding, mapeo entidad→colección Qdrant, upsert/delete, exclusión wildcard y cron de procesamiento.

### Modified Capabilities

- `search-events-queue`: Comportamiento del worker (claim atómico, reintentos, batch, idempotencia por `entity_type`+`entity_id`) alineado a escenarios ya descritos pero sin implementación.

## Impact

- `apps/cms`: nuevo módulo `src/search-indexer/` (o equivalente), servicio de embeddings, handler por `entity_type`, rutas `app/api/cron/search-indexer` y manual dev; posible ampliación de `buildSearchPayload` en hooks para más campos ERP.
- `apps/cms/src/lib/qdrant.ts`, `qdrant-collections.ts`: uso activo de `products`; posible colección `categories` en el mismo cambio si el worker la procesa.
- `vercel.json`: entrada cron para el worker.
- `packages/database-types`: sin cambio de esquema salvo tipos generados ya existentes.
- `supabase/migrations`: sin nuevas tablas (cola ya definida en #2).
- Desbloquea ROADMAP #14 (`predictive-search-ui`). Depende de #2 y #7 (completados). Cumple **RF-009** (indexación), prepara **US-01**; no implementa latencia &lt;150 ms en UI (eso es #14).

## Non-Goals

- UI de búsqueda, autocompletado visual, tolerancia tipográfica en frontend (#14).
- Búsqueda por voz / EVA (fase posterior, gap consciente en ROADMAP).
- Indexación de proveedores como entidad separada (solo producto/categoría en esta fase).
- Migración de modelo de embedding o cambio de `vectorSize` sin migración de colección Qdrant.
- Alertas en dashboard backoffice para filas `error` (#30).
