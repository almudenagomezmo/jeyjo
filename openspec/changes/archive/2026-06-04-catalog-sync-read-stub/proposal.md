## Why

Tras `erp-port-adapters-contracts` (#4) y `price-engine-core` (#6), existen puertos ERP, `ErpCatalogSyncService` y datos stub, pero **no hay un flujo operativo de sincronización de lectura**: la tienda sigue con bases de precio hardcodeadas (`REF-001..004`), el adaptador stub no incluye fixtures CA ni referencias comodín, y no se persisten en Supabase los precios especiales/ofertas del `ErpPricingReader`. Sin este cambio (#7 del ROADMAP) no se puede validar **RF-023** (lectura ERP), **RF-006** (exclusión comodín) ni la base de **RF-005** (stock ERP en Payload antes del multisource #8), ni desbloquear PLP/storefront (#9–10).

## What Changes

- **Sync Engine de lectura (stub):** orquestador que invoca `ErpCatalogReader` + `ErpPricingReader`, aplica DTOs a Payload y tablas Supabase, registra resultado en `audit_log` y expone trigger manual + cron protegido.
- **Upsert de catálogo:** ampliar `ErpCatalogSyncService` para crear productos inexistentes (estado borrador) y actualizar proveedores; ampliar stub con SKUs `REF-001..004`, productos demo y referencia comodín `9000000001` (**CA-PRECIOS**, **CA-BACKEND-002**).
- **Sync de precios:** servicio que persiste `special_prices` y `group_offers` desde stub hacia Supabase (idempotente por claves naturales).
- **Exclusión comodín (RF-006):** productos con `isWildcard=true` excluidos de APIs/consultas públicas del storefront; visibles en backoffice.
- **Lectura storefront:** sustituir stub en `product-catalog.ts` por lectura server-side de Payload (o mirror Supabase) para `getProductPriceBase`.
- **Resiliencia (RNF-007, alcance lectura):** fallo del adaptador no borra datos Payload/Supabase; último sync conservado; error registrado en `audit_log` con código `error_erp`.
- **Metadatos de sync:** tabla o registro de última ejecución exitosa (`sync_runs` o equivalente) para staleness futuro.
- **No incluye:** semáforo multisource Distrisantiago/Arnoia (#8), UI PLP/PDP (#10–11), importador Excel (#29), escritura Avansuite (#36), worker Qdrant (#13), bandeja alertas dashboard (#30).

## Capabilities

### New Capabilities

- `erp-catalog-sync-engine`: Orquestación de sync lectura stub→Payload, cron/trigger manual, métricas de run, audit log y manejo de errores RNF-007.
- `erp-pricing-sync`: Persistencia idempotente de precios especiales y ofertas de grupo desde `ErpPricingReader` hacia Supabase.
- `catalog-wildcard-exclusion`: Reglas RF-006 para excluir referencias comodín del catálogo público y futuros índices de búsqueda.
- `storefront-catalog-read`: Resolución server-side de bases de precio/catálogo desde datos sincronizados (reemplaza stub local).

### Modified Capabilities

- `erp-stub-adapter`: Dataset ampliado alineado a seed Jeyjo + fixtures CA-PRECIOS + SKU comodín 9000000001.
- `payload-catalog-collections`: Sync ERP puede crear productos nuevos en borrador además de actualizar existentes por `skuErp`.

## Impact

- `apps/cms`: módulo `src/erp/` (orquestador, pricing sync, route cron, ampliación `ErpCatalogSyncService`); posible migración `sync_runs`.
- `packages/erp-ports`: ampliación `sample-data.ts` y stub reader pricing.
- `supabase/migrations`: tabla metadatos sync (si no existe); posible índice en productos comodín.
- `apps/storefront`: `lib/pricing/product-catalog.ts`, posible cliente Payload server-side.
- Desbloquea ROADMAP #8 (`stock-multisource-adapters`), #9 (`storefront-shell-navigation`), #10 (`plp-faceted-listing`), #13 (`search-events-qdrant-worker`).
- Depende de #4 y #6 (completados). Cumple **RF-005** (stock ERP en Payload), **RF-006**, **RF-023** (solo lectura), **RNF-007** (degradación lectura); **US-03** (stock base), **US-15** (comodín en import/sync).

## Non-Goals

- Adaptador Excel o API Avansuite real (#29, #36).
- Escritura de artículos hacia ERP (**CA-BACKEND-001** completo queda #36).
- Indicadores semáforo multisource y umbrales "últimas unidades" en UI (#8).
- Consumidor Qdrant / procesamiento `search_events` (#13).
- Alertas visuales en dashboard backoffice (#30).
- Creación automática de categorías desde ERP (enriquecimiento PIM manual en #21).
