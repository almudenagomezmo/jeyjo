## Context

- **Estado actual:** `#7` sincroniza catálogo ERP stub → Payload incluyendo `erpStock` numérico interno. No hay puertos ni adaptadores para Distrisantiago (RI-003, FTP diario) ni Arnoia (RI-004, web link). El template Payload ecommerce expone `inventory` numérico en UI legacy; jeyjo-next define `StockBadge` con cantidades — **RF-005 prohíbe cantidades exactas** en la tienda pública y exige semáforo agregado verde/azul/rojo.
- **Arquitectura:** MOD-05 Sync Engine ya contempla FTP Distrisantiago y Arnoia como entradas; `#8` implementa la rama **lectura stock mayorista + resolución semáforo**, dejando UI en `#10–11`.
- **Requisitos:** RF-005, RI-003, RI-004, RNF-004 (≤15 min batch), RNF-007 (mantener último dato + aviso), CA-ERP-001 (indicador azul tras bajada ERP), US-03 CA4 (`allowOrderWithoutStock` ya en Payload).

## Goals / Non-Goals

**Goals:**

- Paquete `@jeyjo/stock-ports` con `StockSourceReader`, `StockSnapshotDto`, errores tipados y registry por fuente (`distrisantiago`, `arnoia`).
- Adaptadores stub deterministas mapeando por `mainWholesaleRef` (Distrisantiago) y referencia Arnoia.
- Orquestador `runStockSync()` en CMS: pull mayoristas → persistir cantidades internas → recalcular `stockIndicator` por producto.
- Servicio puro `resolveStockIndicator({ erpStock, distrisantiagoStock, arnoiaStock, threshold })` implementando RF-005.
- API storefront server-only `getStockIndicator(sku)` retornando `{ level, label, isStale }` sin cantidades.
- Cron + manual trigger; tabla `stock_sync_runs`; audit log; degradación RNF-007 por fuente.
- Encadenar recálculo semáforo al final de `runCatalogSyncRead()` cuando cambie `erpStock`.

**Non-Goals:**

- UI React StockBadge/PLP/PDP (#10–11).
- FTP/HTTP producción real (stubs + env hooks para futuro wiring).
- Alertas dashboard "FTP no recibido" (#30).
- Wishlist notifications (#35).
- Reserva de stock en checkout (#17).
- Exponer cantidades en Merchant Center feed (#34).

## Decisions

### 1. Paquete separado `@jeyjo/stock-ports` (no extender `@jeyjo/erp-ports`)

**Decisión:** Nuevo package en `packages/stock-ports` con puertos mayoristas independientes del catálogo ERP.

**Alternativa descartada:** Añadir `ErpStockReader` a erp-ports — mezcla responsabilidades Avansuite vs mayoristas con ciclos y credenciales distintos.

**Rationale:** RI-003/004 son integraciones distintas de RI-001; registry y cron separados permiten fallar/degradar por fuente.

### 2. Modelo de datos: campos Payload + mirror opcional Supabase

**Decisión:** Ampliar producto Payload (tab ERP/stock):

| Campo | Tipo | Visibilidad |
|-------|------|-------------|
| `distrisantiagoStock` | number \| null | admin read-only, sync context |
| `arnoiaStock` | number \| null | admin read-only, sync context |
| `stockIndicator` | enum `available` \| `low` \| `limited` | admin read-only, calculado |
| `syncDistrisantiagoAt` | date | admin read-only |
| `syncArnoiaAt` | date | admin read-only |

`erpStock` existente permanece fuente ERP; **ningún campo numérico se expone en API pública storefront**.

**Alternativa:** Tabla Supabase `product_stock_snapshots` normalizada — pospuesta; Payload suficiente para volumen y coherencia con catálogo enriquecido.

### 3. Mapeo de referencias mayoristas

**Decisión:** Stub y sync emparejan snapshots por `mainWholesaleRef` del producto; fallback a `skuErp` si wholesale ref vacía. Productos sin match conservan último valor mayorista (RNF-007).

### 4. Reglas semáforo RF-005 (`stock-semaphore-resolver`)

**Decisión:** Función pura en `@jeyjo/stock-ports` (o `packages/stock-core` subpath):

```
effectiveQty = max(erpStock ?? 0, distrisantiagoStock ?? 0, arnoiaStock ?? 0)
hasAnySource = any source !== null && source !== undefined (dato explícito, no solo cero)

if !hasAnySource → limited ("Disponibilidad limitada según fabricante")
else if effectiveQty === 0 → limited
else if erpStock !== null && erpStock <= threshold → low ("Últimas unidades")  // CA-ERP-001: ERP bajo
else if effectiveQty > 0 → available ("Disponible")
```

Umbral `STOCK_LOW_THRESHOLD` default **5** (CA-ERP-001). Prioridad azul cuando **solo ERP** está bajo aunque mayorista tenga stock — alineado a "stock propio bajo" del criterio de aceptación.

**Alternativa:** Azul si cualquier fuente baja — descartada; CA-ERP-001 habla de bajada en Avansuite.

### 5. Registry de adaptadores stock

**Decisión:** `apps/cms/src/stock/registry.ts`:

- `STOCK_DISTRI_ADAPTER=stub|ftp` (ftp → `STOCK_NOT_IMPLEMENTED` hasta credenciales)
- `STOCK_ARNOIA_ADAPTER=stub|web`
- Factory `getStockSourceReaders(): { distrisantiago, arnoia }`

Patrón idéntico a `apps/cms/src/erp/registry.ts`.

### 6. Orquestador `StockSyncOrchestrator`

**Decisión:** Secuencia:

1. Pull Distrisantiago snapshot (paginado si aplica)
2. Pull Arnoia snapshot
3. Para cada producto publicado/borrador con `skuErp`: match refs, update campos mayoristas con `req.context.stockSync = true`
4. Recalcular `stockIndicator` para todos los productos tocados + los con `erpStock` reciente
5. Persistir `stock_sync_runs`; `audit_log` action `SYNC_STOCK_READ`

Errores por fuente: si Distrisantiago falla, conservar `distrisantiagoStock` anterior, marcar run `partial`, flag `isStale` en storefront para esa fuente.

**Cron:** `GET /api/cron/stock-sync` cada **15 min** (RNF-004 batch max) en `vercel.json`; puede encadenarse tras catalog cron o independiente.

### 7. Encadenamiento post catalog sync

**Decisión:** Al final de `runCatalogSyncRead()`, invocar `recalculateStockIndicatorsForUpdatedSkus(skus)` sin re-pull mayoristas (ERP cambió). Sync mayorista completo en cron stock separado.

**Rationale:** ERP puede cambiar entre ciclos FTP; recálculo ligero evita latencia extra en catalog sync.

### 8. Storefront `getStockIndicator`

**Decisión:** `apps/storefront/src/lib/stock/get-stock-indicator.ts`:

- Lee producto vía mismo helper CMS que `#7` (`fetchProductBySkuFromCms`)
- Retorna `{ level, label, isStale, allowOrderWithoutStock }`
- `unstable_cache` 60s por SKU
- Endpoint opcional `GET /api/stock/[sku]` para client components futuros (#11)
- Excluye wildcard/no publicado (retorna `null`)

Labels fijos en español según RF-005; colores/token mapping documentado para #11 en `globals.css` (`--stock-available`, `--stock-low`, `--stock-limited`).

### 9. Stub fixtures

**Decisión:** Dataset en `packages/stock-ports/src/adapters/stub/`:

- REF-001: ERP 100, Distri 0, Arnoia 50 → `available`
- REF-002: ERP 2, Distri 100, Arnoia 0 → `low` (CA-ERP-001)
- REF-003: ERP 0, Distri 0, Arnoia 0 → `limited`
- REF-004: sin snapshot mayorista → `available` si ERP > 0
- Simulación outage: `setStubStockSimulateUnavailable('distrisantiago')`

### 10. Guards Payload

**Decisión:** Extender `erpProductBeforeChange` o hook paralelo `stockSyncBeforeChange` que solo permite mutar campos stock mayorista/indicator con `req.context.stockSync === true`.

## Risks / Trade-offs

| Riesgo | Mitigación |
|--------|------------|
| Cantidades filtradas por error a API pública | Tests contractuales storefront; tipos sin campos numéricos en DTO público |
| Desfase ERP vs FTP diario | `isStale` por fuente; aviso no bloqueante RNF-007 en #11 |
| Productos sin `mainWholesaleRef` | Fallback `skuErp`; log warning en sync |
| Doble cron catalog+stock | Idempotente; indicador recalculado es barato |
| Scope creep UI | Non-goals explícitos; solo lib + API en #8 |

## Migration Plan

1. Crear `packages/stock-ports` + workspace dependency en cms/storefront.
2. Migración Supabase `stock_sync_runs` (espejo metadatos; campos producto viven en Payload).
3. Ampliar `erpFields.ts` / guards / mappers.
4. Implementar registry, stubs, orchestrator, semaphore.
5. Cron route + `.env.example` vars.
6. Encadenar recálculo en `ErpCatalogSyncOrchestrator`.
7. Storefront lib + tests Vitest (cms int + storefront unit).
8. Rollback: desactivar cron stock; campos nuevos ignorados; `erpStock` sigue operativo.

## Open Questions

- ¿Umbral azul solo ERP o también mayorista? — **Decidido:** solo ERP ≤ threshold (CA-ERP-001).
- ¿Publicar tokens semáforo en `globals.css` en #8 o #11? — **Propuesta:** definir variables CSS en #8, consumir componentes en #11.
- ¿Intervalo FTP Distri distinto de 15 min? — **Propuesta:** cron stock 15 min; stub ignora horario; env `STOCK_DISTRI_EXPECTED_HOUR` para alertas futuras #30.
