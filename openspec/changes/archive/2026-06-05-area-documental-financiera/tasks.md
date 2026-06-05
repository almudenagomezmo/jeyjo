## 1. ERP ports y stub documental

- [x] 1.1 Extender `packages/erp-ports`: tipos `ErpDocumentType`, DTOs ampliados (`ErpInvoiceListItem`, albaranes, vencimientos, 347, presupuestos ERP), métodos `*ByCustomer` y `getDocumentPdf` en `documents-reader.ts`
- [x] 1.2 Actualizar exports en `packages/erp-ports/src/index.ts` y tests de contrato existentes
- [x] 1.3 Implementar fixtures CA-B2B en `adapters/stub/` (facturas 5 años, FAC-2024-001/FAC-2026-050, albaranes emitido/preparado, 347, presupuestos vigente/caducado, PDF stub `%PDF-`)
- [x] 1.4 Completar `createStubDocumentsReader`: eliminar `ERP_NOT_IMPLEMENTED` en albaranes; filtro 5 años; validación cross-customer en `getDocumentPdf`
- [x] 1.5 Ejecutar `pnpm --filter @jeyjo/erp-ports test` — verificar compatibilidad cron invoice sync (#28) con `totalAmount`/`id` existentes

## 2. Cache PDF Supabase

- [x] 2.1 Crear `apps/storefront/src/lib/documents/pdf-cache.ts` (o módulo compartido): upload service_role, HEAD cache, metadata `.meta.json`, path `{customerId}/{type}/{documentId}.pdf`
- [x] 2.2 Implementar helper signed URL (TTL ≤300s) con rechazo cross-customer prefix
- [x] 2.3 Documentar uso bucket `private-documents` en `supabase/README.md` si falta detalle upload
- [x] 2.4 Test unit: cache hit/miss, rechazo path ajeno, overwrite si `erpUpdatedAt` más reciente

## 3. Servicio documentos storefront

- [x] 3.1 Crear `apps/storefront/src/lib/intranet/documents-service.ts`: resuelve `erp_customer_code` desde sesión B2B, delega a stub/registry, aplica filtros facturas (año, mes, q, importe, ventana 5 años)
- [x] 3.2 Implementar agregación vencimientos: `totalOutstandingAmount`, `isOverdue` timezone `Europe/Madrid`
- [x] 3.3 Helper `assertDocumentOwnedByCustomer(type, id, session)` para CA-B2B-002

## 4. APIs intranet `/api/intranet/documents/*`

- [x] 4.1 Rutas listado: `invoices`, `delivery-notes`, `due-payments`, `form-347`, `erp-quotes` con `requireB2bApiSession({ section: 'finance' })`
- [x] 4.2 Rutas PDF: `.../{id}/pdf` streaming o signed URL vía pdf-cache
- [x] 4.3 Tests integración: 403 sin permiso finance; 404/403 acceso cruzado invoice id; 200 lista empresa@test.com
- [x] 4.4 Verificar CA-B2B-001: descarga PDF stub <5s en staging manual

## 5. UI Contabilidad (storefront)

- [x] 5.1 Revisar tokens en `globals.css` si hace falta clase semáforo vencimientos (`text-destructive` / badge vencida)
- [x] 5.2 Componentes compartidos: `DocumentTable`, `DocumentFilters`, `DuePaymentsSummary`, `YearSelect` en `components/intranet/contabilidad/`
- [x] 5.3 Sustituir scaffolds en las 5 páginas `intranet/contabilidad/*/page.tsx` con vistas operativas (server fetch + client filtros en facturas)
- [x] 5.4 Quitar `scaffold` y copy "fase documental" de `lib/intranet/navigation.ts`
- [x] 5.5 Checklist manual US-08 CA1–CA6 y US-09 CA1–CA4 con usuario empresa@test.com

## 6. Permisos y regresión

- [x] 6.1 Confirmar layout/guard server-side Contabilidad sigue redirigiendo subuser `finance: false` en URLs directas (#26)
- [x] 6.2 Regresión cron `/api/cron/invoice-sync` y notificación `invoice_new` (#28) tras ampliar DTO factura
- [x] 6.3 Actualizar copy notificación `invoice_new` con enlace a `/intranet/contabilidad/facturas` (opcional highlight id)

## 7. Verificación final

- [x] 7.1 Escenarios CA-B2B-001, CA-B2B-002, CA-B2B-003 en staging documentados
- [x] 7.2 `pnpm --filter storefront test` (o suite afectada) verde
- [x] 7.3 `openspec validate area-documental-financiera` sin errores
