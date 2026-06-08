## Why

La plataforma se diseñó con Avansuite ERP como fuente de verdad para catálogo, precios, stock y documentos, pero la integración API real (#36) sigue pendiente y el equipo necesita operar el negocio **100 % desde la web** antes de conectar el ERP. Hoy los campos comerciales y de stock en Payload son de solo lectura (solo mutables vía sync stub/Excel), los documentos B2B dependen del stub `ErpDocumentsReader`, y las tarifas B2B se leen del stub en intranet aunque el motor de precios ya usa Supabase. Este cambio invierte el modelo operativo: **Payload CMS + Supabase son la fuente de verdad**; ERP y feeds de mayoristas quedan congelados para una fase futura.

## What Changes

- **Catálogo comercial editable:** precios P1/P2, IVA, referencias, flags comerciales y proveedor editables por staff en CMS; pestaña renombrada de "Datos ERP" a "Datos comerciales"; hooks `erpProductBeforeChange` / `erpReadOnlyFieldAccess` relajados para edición staff (sin `erpSync` obligatorio).
- **Stock 100 % manual:** un campo de stock disponible editable en producto; semáforo recalculado al guardar según `systemSettings.stockLowThreshold`; sync Distrisantiago/Arnoia/ERP desactivado por defecto en modo web-native.
- **Documentos B2B gestionados por staff:** nueva colección CMS para documentos de cliente (factura, albarán, vencimiento, cifra 347, presupuesto ERP) con metadatos + upload PDF a `private-documents`; APIs intranet `/api/intranet/documents/*` leen CMS/Supabase en lugar del stub ERP.
- **Tarifas B2B editables en CMS:** colecciones Payload para precios especiales (`special_prices`) y ofertas de grupo (`group_offers`) con sincronización a Supabase; `/api/intranet/custom-tariffs` lee Supabase, no `ErpPricingReader`.
- **Excel catálogo:** mantener import y export masivo vía UI existente (`CatalogImportView`); import escribe campos comerciales editables directamente.
- **Desactivar puentes ERP:** ocultar o deshabilitar export pedidos Avansuite (`/export-avansuite`), crons de sync catálogo/stock ERP, alertas de staleness ERP en dashboard; congelar dependencia de cambio #36.
- **Modo operativo explícito:** flag `WEB_NATIVE_MODE=true` (o equivalente en `systemSettings`) documenta que la plataforma no debe invocar adaptadores ERP/mayoristas en runtime.
- **BREAKING:** en entornos con `WEB_NATIVE_MODE=true`, los endpoints de sync ERP/stock y export Avansuite responden 410 o están deshabilitados; la intranet deja de servir datos del stub ERP para documentos y tarifas.

## Capabilities

### New Capabilities

- `backoffice-web-native-catalog`: Edición staff de campos comerciales de producto y proveedor; renombrado UI; guards relajados; Excel import/export como herramienta de carga masiva sin sync ERP.
- `backoffice-manual-stock`: Stock disponible editable por producto; recálculo de semáforo al guardar; desactivación de sync multisource.
- `backoffice-customer-documents`: Colección CMS para documentos financieros B2B con upload PDF, metadatos, vigencia y asignación a cliente Supabase.
- `backoffice-b2b-pricing-admin`: Colecciones CMS para precios especiales y ofertas de grupo con mirror a tablas Supabase `special_prices` / `group_offers`.

### Modified Capabilities

- `payload-catalog-collections`: Requisitos de campos comerciales pasan de ERP read-only a staff-editable en modo web-native.
- `storefront-stock-read`: Fuente de stock es valor manual CMS, no sync multisource.
- `stock-sync-engine`: Sync programado y manual queda deshabilitado cuando `WEB_NATIVE_MODE` está activo.
- `erp-catalog-sync-engine`: Sync catálogo ERP queda deshabilitado cuando `WEB_NATIVE_MODE` está activo.
- `storefront-b2b-contabilidad`: Fuente de listados y PDF es CMS/`private-documents`, no `ErpDocumentsReader`.
- `erp-document-pdf-cache`: PDF proviene de upload staff; sin fetch desde ERP.
- `storefront-b2b-custom-tariffs`: API lee `special_prices` / `group_offers` en Supabase vía CMS, no stub ERP.
- `pricing-engine`: Precios especiales y ofertas de grupo se mantienen en Supabase pero se administran desde CMS (sin `ErpPricingSyncService` en modo web-native).
- `backoffice-system-settings`: Nuevo toggle/modo `webNativeMode` y precedencia sobre sync ERP/stock.
- `backoffice-order-avansuite-export`: Export Excel Avansuite deshabilitado en modo web-native.
- `backoffice-catalog-excel-import`: Import aplica a campos comerciales editables sin pasar por adaptador ERP de lectura.

## Impact

- `apps/cms`: colecciones Products/Suppliers (campos y hooks), nuevas colecciones documentos y tarifas, endpoints sync/export guardados, `systemSettings`, `CatalogImportView`.
- `apps/storefront`: `lib/intranet/documents-service.ts`, `lib/intranet/custom-tariffs/service.ts`, APIs contabilidad y precios.
- `packages/pricing`, `packages/stock-ports`, `packages/erp-ports`: sin eliminar contratos ERP; adaptadores quedan inactivos en runtime web-native.
- `supabase`: posible tabla `customer_documents` o mirror vía Payload; reutiliza `special_prices`, `group_offers`, bucket `private-documents`.
- **RF-005, RF-006, RF-007, RF-016, RF-017, RF-020, RF-023, RI-001, US-08, US-09, US-14, US-15:** cumplimiento operativo vía web; integración Avansuite diferida explícitamente (#36 congelado).
- **ROADMAP:** insertar como cambio transversal antes de #36; no bloquea #33, #38, #40, #43 pendientes.

## Non-Goals

- **Adaptador API Avansuite** (#36 `erp-api-write-implementation`): congelado; puertos `@jeyjo/erp-ports` se conservan para fase futura.
- **Sync Distrisantiago FTP y Arnoia web:** fuera de alcance; stock solo manual.
- **Escritura hacia ERP** (pedidos, clientes, artículos): ninguna en esta fase.
- **Área documental B2C** en `/cuenta`: solo intranet B2B con permiso `finance`.
- **Pago online de facturas** o domiciliación desde vencimientos.
- **Migración automática** de fixtures stub a producción: datos de demo opcionales; operación real la carga staff.
- **ZIP masivo** de documentos; descarga unitaria por fila se mantiene.
- **Presupuestos web Payload** (#19) en Contabilidad: la sección "presupuesto ERP" sigue siendo documento subido por staff, distinto de colección `quotes`.

## Assumptions

- `skuErp` permanece como identificador de referencia de producto (renombrado solo en UI a "Referencia/SKU"); obligatorio para catálogo y motor de precios.
- Staff con roles `catalogo` / `administracion` / `superadmin` (según RF-030) edita catálogo, stock y tarifas; documentos de cliente requieren al menos `administracion`.
- Documentos vencimiento incluyen metadatos manuales: importe pendiente, fecha vencimiento, estado (vigente/vencido) además del PDF.
- `WEB_NATIVE_MODE=true` es el default recomendado en staging y producción hasta activar #36.
- Notificaciones `invoice_new` (#28) se disparan al publicar documento tipo factura en CMS para el cliente afectado.
