# Verificación manual — area-documental-financiera (#37)

## Pre-requisitos

- Usuario B2B `empresa@test.com` validado (`erp_code = B2B-EMPRESA1`)
- Subusuario sin permiso `finance` para pruebas RF-003
- `ERP_ADAPTER=stub` (por defecto en desarrollo)

## CA-B2B-001 — Facturas propias y PDF

- [ ] Login como `empresa@test.com` → **Contabilidad > Facturas emitidas**
- [ ] Listado muestra al menos 3 facturas con número, fecha, importe sin IVA y con IVA
- [ ] No aparecen borradores ni facturas de hace más de 5 años
- [ ] Filtro por año 2026 reduce el listado
- [ ] Descarga PDF de `FAC-2026-0001` en menos de 5 s; archivo abre como PDF válido

## CA-B2B-002 — Aislamiento entre clientes

- [ ] Con sesión `empresa@test.com`, abrir `/api/intranet/documents/invoices/INV-2026-0100/pdf` → 404
- [ ] Subusuario con `finance: false` recibe 403 en `/api/intranet/documents/invoices`

## CA-B2B-003 — Vencimientos

- [ ] **Contabilidad > Vencimientos** muestra `FAC-2024-001` resaltada (vencida) y `FAC-2026-050` pendiente
- [ ] Total saldo pendiente: **450,00 €**

## US-08 / US-09

- [ ] Filtros facturas: año, mes, número parcial, rango importe
- [ ] Albaranes: estados **Emitido** y **En preparación** con PDF
- [ ] Cifra 347: selector de ejercicio y descarga PDF
- [ ] Presupuestos ERP: badges **Vigente** / **Caducado** con PDF

## Regresión #28

- [ ] Cron `GET /api/cron/invoice-sync` con `CRON_SECRET` completa sin error
- [ ] Notificación `invoice_new` enlaza a `/intranet/contabilidad/facturas?highlight={id}`
