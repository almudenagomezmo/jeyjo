## Why

Tras `payload-collections-bootstrap` (#3), el catálogo Payload ya expone campos ERP de solo lectura (`skuErp`, precios P1/P2, `syncErpAt`, etc.) pero no existe una capa de integración desacoplada con Avansuite. Sin **puertos** (interfaces) y **adaptadores** intercambiables, los cambios #6 (motor de precios), #7 (sync lectura stub), #29 (Excel) y #36 (API escritura) acoplarían lógica de negocio al formato concreto del ERP o del importador. Este cambio (#4 del ROADMAP) define contratos y wiring mínimo ahora, con implementación stub, para cumplir **RF-023**, **RI-001** y preparar **US-15** sin esperar documentación API Avansuite.

## What Changes

- Paquete compartido `packages/erp-ports` con interfaces TypeScript (puertos): lectura/escritura de catálogo, lectura de documentos ERP, y tipos DTO normalizados al modelo interno Jeyjo.
- Registro/fábrica de adaptadores en `apps/cms` (`ERP_ADAPTER=stub|excel|api`) con implementación **stub** por defecto en desarrollo.
- Contrato de mapeo explícito entre DTOs ERP y campos Payload (`erpFields.ts`) y colección `suppliers`.
- Errores tipados (`ErpIntegrationError`, degradación según **RNF-007**) y convención de idempotencia para comandos de sync.
- Tests unitarios de contratos y del adaptador stub; sin llamadas reales a Avansuite.
- Documentación en código de extension points para adaptador Excel (#29) y API (#36).
- **No incluye:** sync programada ni jobs (#7), motor de precios (#6), importador Excel UI (#29), escritura API Avansuite (#36), stock multisource (#8), clientes/tarifas/facturas en portal (#37), bandeja de alertas ERP en dashboard (#30).

## Capabilities

### New Capabilities

- `erp-integration-ports`: Interfaces de puertos (`ErpCatalogReader`, `ErpCatalogWriter`, `ErpDocumentsReader`, tipos de resultado y errores) alineadas a RI-001 y entidad PRODUCTO del ERD.
- `erp-catalog-dtos`: DTOs normalizados (artículo, proveedor, delta de sync) independientes de Payload y de Avansuite.
- `erp-adapter-registry`: Resolución del adaptador activo por configuración; inyección en CMS sin importar implementaciones concretas en hooks futuros.
- `erp-stub-adapter`: Adaptador de desarrollo que devuelve datos deterministas y permite simular fallos ERP para tests.

### Modified Capabilities

- `payload-catalog-collections`: Los campos ERP de productos y proveedores solo se actualizan mediante operaciones de sync autorizadas (puerto + servicio de aplicación), no por edición manual ni hooks genéricos sin origen ERP.

## Impact

- Nuevo paquete `packages/erp-ports` (export en workspace pnpm).
- `apps/cms`: módulo `src/erp/` (registry, wiring en `payload.config` o provider), dependencia en `package.json`.
- Desbloquea ROADMAP #6, #7, #29, #36; depende de #3 (`payload-collections-bootstrap`).
- Cumple base de **RF-023** (contratos R+W), **RI-001** (lectura/escritura vía API futura), **US-15** (entrada Excel vía adaptador en #29); **RNF-007** (errores y último dato cacheado — diseño en stub, implementación completa en #7).
- Sin cambios en `apps/storefront` en este cambio.

## Non-Goals

- Implementación del adaptador Excel ni plantillas Avansuite (cambio #29).
- Cliente HTTP Avansuite ni OAuth/credenciales producción (cambio #36).
- Sincronización automática, cron o cola de reintentos (cambio #7).
- Entidades cliente, tarifa, precio especial, factura, albarán más allá de interfaces vacías o `notImplemented` documentadas.
- UI de backoffice para importar Excel o ver estado de sync (cambios #29, #30).
