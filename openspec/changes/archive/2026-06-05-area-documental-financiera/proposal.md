## Why

El portal B2B (#22) expone la sección **Contabilidad** con cinco rutas scaffold (`/intranet/contabilidad/*`) y guards de permiso financiero (#26), pero **no hay listados ni descarga de PDF** desde Avansuite. Los clientes empresa siguen llamando o escribiendo a Jeyjo para facturas, albaranes, cifra 347, presupuestos ERP y saldo de vencimientos — incumpliendo **RF-016**, **RF-017**, **US-08**, **US-09** y los criterios **CA-B2B-001..003**. El cambio **#28** ya sincroniza ids de factura stub para notificaciones `invoice_new`; falta la UI documental y la entrega de PDF en `private-documents` (#2). Es el cambio **#37** del ROADMAP (fase final); dependencias **#4** (puertos ERP), **#22** (portal) y **#28** (notificaciones) están completadas.

## What Changes

- **Extensión `ErpDocumentsReader`:** DTOs completos para facturas (solo "Factura a cliente actualizada", 5 años), albaranes (emitido/preparado), vencimientos con saldo pendiente, cifra 347 anual y presupuestos ERP (vigente/caducado); método `getDocumentPdf(documentType, documentId)` devolviendo bytes originales Avansuite.
- **Adaptador stub documental:** datos deterministas para `empresa@test.com` / `B2B-EMPRESA1` alineados a **CA-B2B-001..003**; implementación de albaranes, vencimientos, 347 y presupuestos ERP (hoy `listDeliveryNotes` lanza `ERP_NOT_IMPLEMENTED`).
- **Cache PDF Supabase:** almacenamiento en bucket `private-documents` con prefijo `{customer_id}/`; URLs firmadas de corta duración generadas server-side (**RNF-009**, **RNF-010**).
- **APIs intranet `/api/intranet/documents/*`:** listados paginados/filtrados y descarga PDF; todas exigen sesión B2B validada + permiso `finance` (#26).
- **Sustituir scaffolds** en las cinco páginas Contabilidad por vistas operativas con filtros (facturas: año, mes, número, importe — **US-08 CA2**), semáforo de vencimientos y total acumulado (**RF-017**), descarga PDF en cada fila.
- **Quitar copy "fase documental"** de `navigation.ts` y metadatos scaffold.
- **Tests:** unit (stub, filtros, cálculo saldo, aislamiento por `customerErpCode`), integración (403 sin permiso finance, CA-B2B-002), checklist manual CA-B2B-001..003.

## Capabilities

### New Capabilities

- `erp-documents-read-adapter`: Puertos ampliados, DTOs documentales, stub completo y contrato PDF; preparación para adaptador API Avansuite (#36 no bloqueante).
- `erp-document-pdf-cache`: Fetch/cache de PDFs ERP en `private-documents` y emisión de signed URLs server-side.
- `storefront-b2b-contabilidad`: UI y APIs intranet para facturas, albaranes, vencimientos, cifra 347 y presupuestos ERP; guards `finance` y aislamiento por cliente.

### Modified Capabilities

- `erp-integration-ports`: Ampliar `ErpDocumentsReader` y tipos asociados más allá del subset de notificaciones (#28).
- `erp-stub-adapter`: Stub documental completo (albaranes, vencimientos, 347, presupuestos, PDF fixture).
- `storage-buckets-core`: Implementar acceso por signed URL a objetos en `private-documents` (antes solo bucket vacío).
- `storefront-b2b-permissions`: Requisito explícito de `section: finance` en rutas `/api/intranet/documents/*`.

## Impact

- `packages/erp-ports`: `documents-reader.ts`, DTOs, stub `documents-reader.ts`, fixtures CA-B2B.
- `apps/cms`: servicio opcional de sync/cache PDF si la lectura ERP vive en CMS; reutiliza `getErpAdapters().documentsReader`.
- `apps/storefront`: páginas `intranet/contabilidad/*`, `lib/intranet/documents/**`, APIs `/api/intranet/documents/**`, componentes tabla/filtros compartidos.
- `supabase`: políticas/paths en `private-documents` (sin nueva tabla obligatoria; metadatos en ERP/stub v1).
- Cumple **RF-016**, **RF-017**, **US-08**, **US-09**, **CA-B2B-001..003**, **RI-001** (documentos bajo demanda); activa plenamente notificaciones `invoice_new` (#28) con enlace a factura descargable.
- Dependencias satisfechas: **#4** puertos, **#22** portal, **#26** permisos finance, **#28** invoice sync watermark.

## Non-Goals

- **Adaptador API Avansuite real** para documentos (queda en **#36** `erp-api-write-implementation` / fase API); v1 opera con stub + contrato listo para swap.
- **Presupuestos web Payload** (#19) en Contabilidad; esta sección lista presupuestos **ERP**, no la colección `quotes` del checkout.
- **Escritura** de facturas, albaranes o vencimientos desde la web (**RI-001** solo lectura).
- **Pago online de facturas** o domiciliación desde vencimientos.
- **Backoffice staff** para gestionar documentos de clientes (#30 dashboard sin bandeja documental).
- **Validación RMA en tiempo real** contra albaranes ERP (#27 sigue con texto libre).
- **Sincronización batch nocturna** de todos los PDFs; cache **on-demand** al primer download.
- **Área documental B2C** en `/cuenta`; solo intranet B2B validada.
- **Multi-tenant export masivo** (ZIP de todas las facturas); descarga unitaria por fila.

## Assumptions

- `web_profiles.erp_customer_code` (o equivalente en sesión B2B) identifica al cliente en Avansuite/stub.
- Estados ERP factura: solo listar equivalente a "Factura a cliente actualizada"; borradores excluidos (**US-08 CA5**).
- Ventana legal: `issuedAt >= today - 5 years` en servidor (**US-08 CA6**).
- PDF: bytes idénticos al ERP; si el stub no tiene binario, generar PDF mínimo de prueba marcado `[STUB]` en staging.
- Idioma UI: español; importes con formato `es-ES` y moneda EUR.
- Vencimiento "vencido" cuando `dueDate < startOfToday` en timezone `Europe/Madrid`.
