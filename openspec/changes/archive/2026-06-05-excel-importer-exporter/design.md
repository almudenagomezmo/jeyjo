## Context

- **Estado actual:** `#4` definió puertos `@jeyjo/erp-ports` y registry con `ERP_ADAPTER=stub|excel|api`; `excel` y `api` lanzan `ERP_NOT_IMPLEMENTED`. `#7` sincroniza catálogo vía `ErpCatalogSyncOrchestrator` + `ErpCatalogSyncService.syncAllFromReader()`. `#5` entrega MFA, roles staff y `audit_log`. `#24` (storefront) parsea Excel de pedido rápido con `xlsx` en ruta API — patrón reutilizable. `#20` exporta pedidos con `@jeyjo/order-export` + `exceljs`. No existe vista PIM de importación ni parser de `ImportaciónArticulos.xlsx`.
- **Brecha:** **US-15** y **CA-BACKEND-002** requieren flujo admin con pre-validación, apply masivo y trazabilidad; operadores no pueden usar Excel como respaldo de **RF-023** hasta este cambio.
- **Arquitectura:** MOD-05 — Excel es adaptador más UI de aplicación; sync sigue pasando por `ErpCatalogSyncService`, no escritura directa en Payload desde el parser.

## Goals / Non-Goals

**Goals:**

- Parser/serializer Avansuite `ImportaciónArticulos.xlsx` → `ErpProductDto` / `ErpSupplierDto` con errores por fila.
- Adaptador `ErpCatalogReader` / `ErpCatalogWriter` para `ERP_ADAPTER=excel`.
- Vista admin `/admin/catalog-import` (roles `superadmin` | `catalogo`): upload, dry-run, confirmación, apply, export.
- Comodín configurable (`ERP_WILDCARD_SKUS`, default `9000000001`) en import.
- `audit_log` + `erp_sync_runs` con `source=excel_import` o `excel_export`.
- Tests con fixture `ImportaciónArticulos_test.xlsx` (CA-BACKEND-002).

**Non-Goals:**

- Tarifas, clientes, CDB, documentos Excel (alcance §1.29 parcial).
- API Avansuite (#36), cron SFTP, auto-publish PIM.
- Sustituir export pedidos OMS existente.

## Decisions

### 1. Paquete `@jeyjo/erp-excel` separado de `erp-ports`

**Decisión:** Nuevo paquete workspace con `parseImportacionArticulos(buffer)`, `serializeImportacionArticulos(dtos)`, tipos de fila/error. `erp-ports` no depende de `exceljs`.

**Alternativa descartada:** Parser dentro de `apps/cms` — duplicación si storefront u otros consumidores lo necesitan; rompe regla registry (sync no importa SheetJS en CMS).

**Rationale:** Misma separación que `@jeyjo/order-export`; registry importa adaptador que usa `@jeyjo/erp-excel` internamente.

### 2. Librería `exceljs` (no `xlsx`)

**Decisión:** `exceljs` en `@jeyjo/erp-excel`, alineado a `@jeyjo/order-export` (streaming, estilos mínimos, `.xlsx`).

**Alternativa:** `xlsx` del quick-order storefront — más ligero pero API distinta; unificar en exceljs para backoffice.

### 3. Flujo import: dry-run → apply vía sync service

**Decisión:**

1. `POST /api/erp/catalog-import/parse` — sube fichero, persiste en Supabase Storage `erp-imports/{uuid}.xlsx` (TTL 7 días), devuelve `{ importId, rows, errors, wildcards, summary }` sin mutar Payload.
2. `POST /api/erp/catalog-import/apply` — carga buffer por `importId`, construye `InMemoryExcelCatalogReader` sobre DTOs parseados, ejecuta `ErpCatalogSyncService.syncAllFromReader()` + recálculo stock indicator para SKUs tocados (reutiliza hook post-sync de `#7`).
3. UI muestra tabla de errores bloqueantes vs advertencias; apply deshabilitado si hay errores bloqueantes en filas obligatorias.

**Alternativa descartada:** Apply directo fila a fila sin reader — rompe contrato registry y tests de adaptador.

### 4. Adaptador Excel para `ERP_ADAPTER=excel`

**Decisión:** `ExcelCatalogAdapter` implementa reader/writer:

- **Reader:** lee `ERP_EXCEL_CATALOG_PATH` (fichero en disco o URL firmada Storage) para cron/manual sin UI; paginación en memoria.
- **Writer:** `upsertProduct` acumula DTOs en buffer; `flush()` genera workbook (export masivo admin o operador).

Registry case `excel` devuelve bundle con este adaptador + documents `notImplemented`.

**Config:**

```env
ERP_ADAPTER=excel
ERP_EXCEL_CATALOG_PATH=          # opcional: path/URL último catálogo para cron
ERP_WILDCARD_SKUS=9000000001     # lista separada por comas
```

### 5. Mapping columnas Avansuite (stub documentado)

**Decisión v1:** Mapping en `docs/avansuite-catalog-import.md` con columnas mínimas verificables en tests:

| Columna Excel (stub) | DTO |
|---------------------|-----|
| Referencia | `skuErp` |
| Descripcion | `shortDescription` |
| PrecioP1 | `p1Price` |
| PrecioP2 | `p2Price` |
| IVA | `vatRate` |
| UnidadesEnvase | `packUnit` |
| CodigoEAN | `ean` |
| RefMayorista | `mainWholesaleRef` |
| RefOEM | `oemRef` |
| CodigoProveedor | `supplierErpCode` |
| Stock | `erpStock` |

Detección cabecera: primera fila con celda que matchee `(?i)referencia`. Categorías: columna `Categoria` opcional → resolución slug contra `categories` (warn si no existe, no bloquea).

**Alternativa:** Esperar plantilla oficial Jeyjo — bloquea #29; stub permite iterar con checklist manual.

### 6. Vista admin Payload

**Decisión:** `CatalogImportView` en `payload.config.ts` → `/admin/catalog-import`, patrón `BulkSeoTemplateView` / `PimHealthView`. Acceso `staffRoles` `superadmin` | `catalogo`. MFA gate heredado (#5).

Secciones UI: upload + drag-drop, resumen contadores, tabla errores (paginada), botón **Aplicar importación**, enlace **Descargar plantilla**, botón **Exportar catálogo a Excel**.

### 7. Export catálogo

**Decisión:** `GET /api/erp/catalog-export` genera `ImportaciónArticulos_export_{YYYYMMDD}.xlsx` desde Payload products con `skuErp` (published + draft), merge campos ERP + columnas enriquecidas PIM (`metaDescription`, `slug`) en columnas extra documentadas (RD-004). No invoca writer ERP hacia Avansuite remoto — solo descarga local.

### 8. Auditoría

**Decisión:** Tras apply/export exitoso, insert `audit_log`:

- `action`: `IMPORT_CATALOG_EXCEL` | `EXPORT_CATALOG_EXCEL`
- `entity_type`: `catalog_import`
- `new_value`: `{ importId, processed, errors, wildcards, durationMs }`

Fila en `erp_sync_runs` con `adapter=excel`, `status=success|partial|failed`, `source=manual_import`.

## Risks / Trade-offs

- **[Plantilla Avansuite distinta al stub]** → Documentar en `docs/`; tests usan fixture acordado con Jeyjo; mapping centralizado en `@jeyjo/erp-excel` para un solo punto de cambio.
- **[Ficheros grandes >10k filas]** → Límite upload 15 MB / 20k filas; parse en worker síncrono con timeout 120s en route; considerar cola en #30 si timeout en prod.
- **[Categorías no resueltas]** → Warning no bloqueante; producto sync sin categoría hasta asignación manual PIM.
- **[Storage imports sensibles]** → Bucket privado `erp-imports`, solo service role + admin API; lifecycle 7 días.
- **[Doble fuente verdad stub vs excel]** → En prod con `ERP_ADAPTER=excel`, cron lee último fichero aplicado o path explícito; operadores documentados en README.

## Migration Plan

1. Desplegar paquete `@jeyjo/erp-excel` y dependencia en CMS.
2. Crear bucket Storage `erp-imports` (migración Supabase o script).
3. Desplegar CMS con vista admin (feature visible solo tras deploy).
4. Staging: `ERP_ADAPTER=excel`, importar `ImportaciónArticulos_test.xlsx`, verificar CA-BACKEND-002.
5. Rollback: revertir deploy; `ERP_ADAPTER=stub` restaura comportamiento previo; imports en Storage no afectan catálogo hasta apply.

## Open Questions

1. ¿Nombre exacto y orden de columnas del fichero real `ImportaciónArticulos.xlsx` de Avansuite? (sustituir stub en docs + tests)
2. ¿Importación debe disparar reindex Qdrant inmediato o basta cola `search_events` existente? **Propuesta v1:** encolar `search_events` por SKU actualizado (mismo patrón post-sync #7).
3. ¿Export debe excluir borradores? **Propuesta v1:** incluir con columna `EstadoPublicacion` para operadores.
