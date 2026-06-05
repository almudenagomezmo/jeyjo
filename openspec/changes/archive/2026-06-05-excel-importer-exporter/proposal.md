## Why

Tras `erp-port-adapters-contracts` (#4) y `catalog-sync-read-stub` (#7), el catálogo Payload se sincroniza solo vía adaptador **stub** o cron; `ERP_ADAPTER=excel` sigue devolviendo `ERP_NOT_IMPLEMENTED` en el registry. El equipo Jeyjo necesita el flujo operativo de **US-15**: subir `ImportaciónArticulos.xlsx` de Avansuite para actualizar masivamente referencias, precios P1/P2, IVA, envases, EAN y categorías sin esperar la API (#36). Este cambio (#29 del ROADMAP) implementa el mecanismo de respaldo Excel de **RF-023** y desbloquea validación de **CA-BACKEND-002** (comodín) en importación real.

## What Changes

- **Paquete compartido** `@jeyjo/erp-excel` (o módulo en `erp-ports`): parser y serializador de `ImportaciónArticulos.xlsx` ↔ `ErpProductDto` / `ErpSupplierDto`, con validación de columnas obligatorias y errores por fila (**US-15 CA1–CA2**, **RD-004**).
- **Adaptador Excel** registrado en `apps/cms/src/erp/registry.ts` cuando `ERP_ADAPTER=excel`: lectura desde fichero configurado o desde el último upload persistido; escritura vía `ErpCatalogWriter` generando `.xlsx` compatible Avansuite.
- **Vista PIM en Payload** `/admin/catalog-import`: subida `.xlsx`, pre-validación, resumen (procesados / errores / comodines), confirmación y aplicación vía `ErpCatalogSyncService` existente (**US-15 CA3–CA5**).
- **Regla comodín en importación:** referencias configuradas (p. ej. `9000000001`) marcadas `isWildcard=true` y excluidas del catálogo público (**RF-006**, **CA-BACKEND-002**).
- **Auditoría:** cada importación y exportación masiva registra en `audit_log` actor, timestamp, contadores y resumen de errores (**US-15 CA5**, **RF-029**).
- **Exportación catálogo:** descarga Excel con columnas Avansuite + campos enriquecidos PIM documentados (**RD-004** exportación catálogo); alcance v1 = productos publicados y borradores con `skuErp`.
- **Tests:** fixtures `ImportaciónArticulos_test.xlsx`, unitarios de parser/mapper y integración import → Payload → exclusión comodín en lectura pública.
- **Documentación:** `apps/cms/docs/avansuite-catalog-import.md` con mapping columnas ↔ DTO (plantilla stub hasta confirmación Jeyjo).

## Capabilities

### New Capabilities

- `erp-excel-catalog-format`: Contrato de columnas, parser y generador de `ImportaciónArticulos.xlsx` normalizado a DTOs `@jeyjo/erp-ports`.
- `erp-excel-catalog-adapter`: Implementación `ErpCatalogReader` / `ErpCatalogWriter` basada en ficheros Excel para `ERP_ADAPTER=excel`.
- `backoffice-catalog-excel-import`: Vista admin PIM con upload, dry-run, apply y export masivo de catálogo.

### Modified Capabilities

- `erp-adapter-registry`: Registrar adaptador Excel en lugar de `ERP_NOT_IMPLEMENTED` cuando `ERP_ADAPTER=excel`.
- `catalog-wildcard-exclusion`: Escenario explícito de marcado comodín durante importación Excel (CA-BACKEND-002).
- `erp-catalog-sync-engine`: Metadatos de ejecución y audit para runs originados en importación manual (además de cron/stub).

## Impact

- Nuevo paquete `packages/erp-excel` (o subcarpeta en `erp-ports`) con dependencia `exceljs` (alineado a `@jeyjo/order-export`).
- `apps/cms`: registry, vista admin, rutas API upload/apply/export, persistencia temporal de ficheros (Supabase Storage o disco en dev).
- `packages/erp-ports`: sin cambios de contrato; posible ampliación opcional de campos DTO si el mapping Avansuite lo exige.
- Desbloquea ROADMAP #36 (`erp-api-write-implementation`) al tener respaldo Excel operativo; no modifica `apps/storefront`.
- Cumple **US-15**, **RF-023** (rama Excel), **RF-006**, **RD-004**, **CA-BACKEND-002**; **RF-029** vía audit log.

## Non-Goals

- Importación/exportación de `ImportacionTarifasClie.xlsx`, `ImportacionCDBarticulos.xlsx`, `ImportaciónContactosCRM.xlsx` (cambios futuros / #36).
- Escritura bidireccional vía API Avansuite (**#36**).
- Sincronización automática por carpeta SFTP o cron sin intervención humana (solo cron con fichero ya subido queda opcional vía `ERP_ADAPTER=excel` + path).
- Área documental, facturas, albaranes (**#37**).
- Reemplazar exportación de pedidos OMS (`@jeyjo/order-export`, ya en **#20**).
- Traducción de plantillas o columnas multi-idioma.
