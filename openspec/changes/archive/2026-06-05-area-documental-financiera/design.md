## Context

- **Estado actual:** Portal B2B (#22) renderiza cinco páginas Contabilidad con `IntranetScaffoldPage`. Permisos `#26` ocultan Contabilidad si `finance: false` y bloquean URLs server-side. `@jeyjo/erp-ports` define `ErpDocumentsReader` con `listInvoicesByCustomer` operativo en stub (#28) pero `listDeliveryNotes` lanza `ERP_NOT_IMPLEMENTED`; DTO mínimo (`id`, `issuedAt`, `totalAmount`). Bucket `private-documents` existe (#2) sin upload ni signed URLs. Cron `#28` (`/api/cron/invoice-sync`) detecta nuevas facturas stub vía watermark `erp_invoice_sync_state`.
- **Requisitos:** **RF-016**, **RF-017**, **US-08**, **US-09**, **CA-B2B-001..003**, **RI-001** (documentos bajo demanda), **RNF-009**, **RNF-010**.
- **Dependencias:** #4 puertos, #22 portal, #26 permisos, #28 notificaciones.

## Goals / Non-Goals

**Goals:**

- Puertos ERP documentales completos + stub determinista CA-B2B.
- APIs intranet `/api/intranet/documents/*` con guard `finance`.
- Cache PDF on-demand en `private-documents` + descarga segura.
- Cinco páginas Contabilidad operativas con filtros y semáforo vencimientos.
- Aislamiento estricto por `customer_id` / `erp_customer_code`.

**Non-Goals:**

- Adaptador Avansuite API real (#36); presupuestos web Payload (#19); pago de facturas; sync batch nocturno de PDFs; área B2C.

## Decisions

### 1. Ampliación `ErpDocumentsReader` (packages/erp-ports)

**Decisión:** Extender el puerto existente en lugar de crear `ErpFinancialReader` separado.

```ts
type ErpDocumentType = 'invoice' | 'delivery_note' | 'form_347' | 'erp_quote'

interface ErpDocumentsReader {
  listInvoicesByCustomer(code, opts?): ErpInvoiceListItem[]
  listDeliveryNotesByCustomer(code, opts?): ErpDeliveryNoteListItem[]
  listDuePaymentsByCustomer(code, opts?): ErpDuePaymentListItem[]
  getForm347Summary(code, fiscalYear): ErpForm347Summary
  listErpQuotesByCustomer(code, opts?): ErpErpQuoteListItem[]
  getDocumentPdf(input): ErpDocumentPdfResult
  // retain listInvoices / listDeliveryNotes for admin if needed
}
```

Ampliar `ErpInvoiceListItem` con `invoiceNumber`, `netAmount`, `grossAmount`, `status`; mantener `totalAmount` = `grossAmount` para compatibilidad cron #28.

**Alternativa descartada:** Puertos por tipo de documento — duplica wiring en registry y storefront.

### 2. Resolución ERP desde storefront vía CMS proxy o paquete compartido

**Decisión:** Implementar `apps/storefront/src/lib/erp/documents-service.ts` que importa `getErpAdapters()` desde un módulo compartido `@jeyjo/erp-registry` re-exportado desde `apps/cms/src/erp/registry.ts` (patrón ya usado en pricing sync desde storefront workers) **o** duplicar registry read-only en storefront importando `@jeyjo/erp-ports` stub directamente en v1.

Para v1: **storefront importa `createStubDocumentsReader` vía env `ERP_ADAPTER=stub`** alineado a CMS; evita HTTP round-trip CMS↔storefront en cada listado.

**Alternativa descartada:** Solo CMS expone REST — latencia extra y duplicación auth B2B.

### 3. Capa PDF cache (`erp-document-pdf-cache`)

**Decisión:** Servicio `resolveDocumentPdf({ customerId, customerErpCode, type, documentId })`:

1. Verificar ownership vía list method o índice stub.
2. Comprobar objeto `private-documents/{customerId}/{type}/{documentId}.pdf` (HEAD).
3. Si miss: `getDocumentPdf` ERP → upload service_role → optional metadata sidecar JSON en path `.meta.json` con `erpUpdatedAt`.
4. Respuesta API: stream `application/pdf` con `Content-Disposition: attachment` **o** redirect 302 a signed URL 120s (prefer **stream directo** en v1 para simplificar; signed URL si objeto ya cacheado y tamaño > umbral).

Path storage incluye `customer_id` Supabase uuid, no ERP code (**RNF-009**).

**Alternativa descartada:** Tabla `document_cache` — overkill v1; path convención suficiente.

### 4. APIs intranet unificadas

**Decisión:** Router Next `apps/storefront/src/app/api/intranet/documents/[...path]/route.ts` o rutas explícitas por recurso. Query params facturas:

| Param | Tipo |
|-------|------|
| `year` | number |
| `month` | 1-12 |
| `q` | invoice number substring |
| `amountMin`, `amountMax` | number |
| `cursor`, `limit` | pagination |

Filtro 5 años: `issuedAt >= subYears(now, 5)` en servidor antes de paginar.

Vencimientos: calcular `totalOutstandingAmount` en servidor; UI semáforo con token `--destructive` / clase `text-destructive` para `isOverdue`.

**Alternativa descartada:** GraphQL — no hay precedente en proyecto.

### 5. UI Contabilidad compartida

**Decisión:** Componentes en `apps/storefront/src/components/intranet/contabilidad/`:

- `DocumentTable` — columnas configurables, skeleton, empty state.
- `DocumentFilters` — facturas filtros US-08.
- `DuePaymentsSummary` — total destacado.
- `YearSelect` — 347.

Páginas server components fetch inicial + client islands para filtros (patrón purchase-history #23).

Quitar `scaffold` de `CONTABILIDAD_SUBNAV` en `navigation.ts`.

**Alternativa descartada:** Una sola página tabs — menú US-07 ya define subrutas.

### 6. Seguridad CA-B2B-002

**Decisión:** Doble validación: (1) session `customer_id`, (2) document id pertenece a `erp_customer_code` de sesión vía re-fetch list o map stub. PDF path prefix = session `customer_id`. Nunca aceptar `customerErpCode` del cliente en query string.

**Alternativa descartada:** Confiar solo en id opaco — riesgo enumeración si ids predecibles.

### 7. Integración notificaciones #28

**Decisión:** Payload notificación `invoice_new` incluye `href: /intranet/contabilidad/facturas?highlight={invoiceId}`; no cambiar cron watermark. Opcional: enlace directo download en email si plantilla #28 se amplía (non-goal v1).

## Risks / Trade-offs

- **[Stub PDF ≠ Avansuite real]** → Marca `[STUB]` en dev; CA-B2B-001 verificado en staging con checklist manual hasta API #36.
- **[Ids ERP predecibles]** → Mitigación: ownership check + 404 homogéneo (no revelar existencia cross-tenant).
- **[PDF grandes / timeout Vercel]** → Stream response; límite 10 MB v1; log error si ERP excede.
- **[Cache stale tras rectificativa]** → `.meta.json` con `erpUpdatedAt`; re-fetch si ERP reporta versión mayor (stub: `updatedAt` fijo).
- **[Duplicar registry en storefront]** → Extraer `packages/erp-registry` en refactor posterior (#36).

## Migration Plan

1. Desplegar cambios `@jeyjo/erp-ports` (backward compatible: campos nuevos opcionales en stub).
2. Desplegar storefront APIs + páginas; scaffolds desaparecen automáticamente.
3. Verificar cron #28 sigue operativo (mismos ids stub).
4. Smoke test CA-B2B-001..003 en staging con `empresa@test.com`.
5. Rollback: revert deploy; scaffolds no vuelven solos — mantener feature flag `CONTABILIDAD_ENABLED=false` opcional en env si se requiere kill-switch (documentar en `.env.example`).

## Open Questions

- ¿Avansuite expone `documentVersion` en API real? → Confirmar con soporte antes de #36; stub usa `updatedAt` opcional.
- ¿347 se entrega solo PDF o también JSON desglosado? → v1: total + PDF; desglose líneas si ERP lo expone en fase API.
- ¿Presupuestos ERP comparten numeración con Payload `quotes`? → Tratar como namespaces distintos en UI (etiqueta "Presupuesto ERP").
