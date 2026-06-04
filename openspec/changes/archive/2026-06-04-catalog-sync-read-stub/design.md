## Context

- **Estado actual:** `#4` entregó `@jeyjo/erp-ports`, `ErpCatalogSyncService`, guards ERP, registry y ruta dev `POST /next/sync-from-stub` (solo admin, deshabilitada en producción). `#6` entregó `@jeyjo/pricing`, tablas `special_prices` / `group_offers`, `ErpPricingReader` stub y resolución de precios en storefront sobre **datos mock** (`product-catalog.ts` con REF-001..004 hardcodeados). El seed `jeyjo-catalog.ts` crea 2 productos (`ERP-GRF-001`, `ERP-PVC-032`) alineados al stub mínimo.
- **Brecha:** no hay job programado, no se sincronizan precios ERP→Supabase, `applyProduct` solo actualiza productos existentes (no crea), el stub no incluye comodín ni fixtures CA, y el storefront no lee Payload tras sync.
- **Arquitectura:** MOD-05 Sync Engine — en #7 solo **rama lectura stub** hacia Payload + Supabase; escritura y API real en #36.
- **Requisitos:** RF-005 (stock ERP en catálogo), RF-006 (comodín), RF-023 (lectura), RNF-007 (degradación), CA-ERP-002 (parcial stub), CA-PRECIOS-001..004 (datos vía sync).

## Goals / Non-Goals

**Goals:**

- Orquestador único `runCatalogSyncRead()` invocable desde cron y trigger manual autenticado.
- Sync catálogo: proveedores (upsert), productos (update + create borrador), campos ERP incl. `erpStock`, `isWildcard`, `syncErpAt`.
- Sync precios: upsert idempotente en `special_prices` y `group_offers` desde `ErpPricingReader`.
- Exclusión comodín en capa de lectura storefront (filtro `isWildcard !== true` + `_status: published`).
- Storefront `getProductPriceBase(sku)` lee P1/P2/vat desde Payload Local API o REST interna CMS.
- Registro `audit_log` por ejecución (éxito/error) y tabla `erp_sync_runs` con timestamp último éxito.
- Tests integración: sync stub → Payload actualizado; comodín ausente en query pública; pricing fixtures en Supabase.

**Non-Goals:**

- FTP Distrisantiago, Arnoia, semáforo UI (#8).
- Worker Qdrant (#13), bandeja alertas (#30).
- Excel import (#29), API Avansuite (#36).
- Auto-publicación PIM de productos creados por sync (quedan `_status: draft`).
- Sincronización clientes, documentos, tarifas personalizadas (#37, #25).

## Decisions

### 1. Orquestador en CMS (`ErpCatalogSyncOrchestrator`)

**Decisión:** Clase/factory en `apps/cms/src/erp/` que secuencia: (1) suppliers, (2) products, (3) pricing tables; devuelve `ErpCatalogSyncResult` ampliado con contadores pricing y `syncRunId`.

**Alternativa descartada:** Edge Function Supabase — duplica acceso Payload Local API y secretos CMS.

**Rationale:** Payload es source of truth catálogo enriquecido; el orquestador ya vive junto a `ErpCatalogSyncService`.

### 2. Trigger programado: Vercel Cron → route protegida

**Decisión:** `GET /api/cron/erp-catalog-sync` (o bajo `(app)/next/`) validando header `Authorization: Bearer ${CRON_SECRET}`. Intervalo default **15 minutos** en `vercel.json` (alineado CA-ERP-001 ciclo máximo; stub no requiere Avansuite).

**Alternativa:** pg_cron en Supabase — no tiene acceso directo a Payload API.

**Dev:** mantener `POST /next/sync-from-stub` para admin manual; cron opcional en local vía script `pnpm --filter cms sync:stub`.

### 3. Upsert productos: update existente, create borrador si falta

**Decisión:** Si `find` por `skuErp` no encuentra fila, `payload.create` con:
- Campos ERP del DTO + `title` derivado de `shortDescription` o `skuErp`
- `slug` generado único (`skuErp` kebab)
- `_status: 'draft'` (staff publica tras enriquecimiento US-16)
- Sin categorías obligatorias (nullable)

**Alternativa:** Solo update — bloquea sync de artículos nuevos desde ERP.

### 4. Sync precios: `ErpPricingSyncService`

**Decisión:** Servicio CMS usando Supabase service role:
- `listGroupOffers()` → upsert `group_offers` por `(sku_erp, valid_from)` o clave documentada en migración #6
- `listSpecialPrices(customerErpCode)` iterando códigos fixture o `listAll` si el puerto lo expone
- Transacción por batch; conflict `ON CONFLICT DO UPDATE`

**Rationale:** Motor pricing (#6) ya lee Supabase; sync #7 alimenta tablas sin pasar por Payload.

### 5. Wildcard exclusion (RF-006)

**Decisión:** Capa `apps/storefront/src/lib/catalog/public-product-filter.ts`:
- Excluir `isWildcard === true`
- Exigir `_status === 'published'` para APIs públicas
- CMS admin sin filtro (comodín visible con badge)

**Stub:** producto `9000000001` con `isWildcard: true` en sample-data; test CA-BACKEND-002 parcial (sync marca comodín, storefront no lista).

**Alternativa:** Soft-delete — pierde trazabilidad ERP.

### 6. Storefront catalog read

**Decisión:** `getProductPriceBase(sku)` llama helper `fetchProductBySkuFromCms(sku)`:
- Server-only: Payload REST con `PAYLOAD_SECRET` / Local API vía HTTP interno `CMS_URL`
- Cache `unstable_cache` 60s por SKU (RNF-003)
- Retorna `null` si comodín, borrador o no encontrado

**Alternativa:** Mirror denormalizado en Supabase — pospuesto; Payload suficiente para volumen #7.

### 7. Resiliencia RNF-007

**Decisión:** Try/catch en orquestador:
- Error `ERP_UNAVAILABLE` / `ERP_TIMEOUT`: no mutar Payload; escribir `audit_log` `action=SYNC_ERP_READ`, `status=error_erp`; `erp_sync_runs` mantiene `last_success_at` anterior
- Errores parciales por ítem: acumular en `result.errors`, continuar batch (comportamiento actual)

### 8. Metadatos `erp_sync_runs`

**Decisión:** Migración Supabase:

```sql
erp_sync_runs (
  id uuid PK,
  adapter text,
  started_at timestamptz,
  finished_at timestamptz,
  status text, -- success | partial | failed
  products_updated int,
  suppliers_updated int,
  pricing_rows_upserted int,
  error_summary text
)
```

Índice en `started_at DESC` para dashboard futuro (#30).

### 9. Audit log en sync

**Decisión:** Tras cada run, `insertAuditLog` con `entityType=erp_sync`, resumen JSON, operador `system` o usuario si trigger manual.

**Hooks existentes:** updates Payload vía sync disparan `search_events`/`audit_log` de producto como cualquier `afterChange` — no duplicar.

### 10. Ampliación stub sample-data

**Decisión:** Añadir a `STUB_SAMPLE_PRODUCTS`:
- REF-001..004 (CA-PRECIOS) con P1/P2/vat coherentes
- SKU `9000000001` `isWildcard: true`
- Mantener ERP-GRF-001 / ERP-PVC-032 para seed existente

Actualizar seed Jeyjo para incluir REF-001..004 como borradores/publicados según fixtures.

## Risks / Trade-offs

| Riesgo | Mitigación |
|--------|------------|
| Productos draft no visibles en tienda tras sync | Documentar flujo PIM; tests usan productos publicados en seed |
| Cron en Vercel timeout (120s) | Paginación 100 ítems; stub pequeño; `maxDuration` ya en route dev |
| Storefront N+1 a CMS | Cache por SKU; batch endpoint en #10 |
| Divergencia stub ↔ seed | Comentario cruzado en sample-data y jeyjo-catalog; test snapshot SKUs |
| Scope creep hacia multisource stock | `erpStock` solo ERP; semáforo en #8 |

## Migration Plan

1. Migración `erp_sync_runs` (+ seed row opcional).
2. Ampliar stub + `ErpCatalogSyncService.applyProduct` create path.
3. Implementar `ErpPricingSyncService` + orquestador.
4. Route cron + `CRON_SECRET` en `.env.example`.
5. Storefront catalog read + filtro comodín.
6. Tests Vitest integración; verificar `pnpm test` cms + storefront pricing.
7. Rollback: desactivar cron; servicios previos (#4) siguen funcionando sin job.

## Open Questions

- ¿Publicar automáticamente REF-001..004 en seed para demos storefront? — **Propuesta:** sí en seed, no en sync create genérico.
- ¿Intervalo cron configurable vía env `ERP_SYNC_CRON_MINUTES`? — **Propuesta:** sí, default 15.
