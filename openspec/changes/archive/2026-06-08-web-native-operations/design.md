## Context

Jeyjo se construyó con un modelo **ERP-first**: campos comerciales en Payload protegidos por `erpReadOnlyFieldAccess` y hooks (`erpProductBeforeChange`, `guardStockProductFields`), sincronización vía `ErpCatalogSyncOrchestrator` y `StockSyncOrchestrator`, documentos B2B vía `ErpDocumentsReader` stub, y tarifas en intranet leídas del stub aunque el carrito ya usa Supabase `special_prices` / `group_offers`.

El cambio #36 (API Avansuite) sigue pendiente. El negocio necesita operar en staging/producción sin ERP ni feeds de mayoristas: catálogo, stock, documentos y tarifas gestionados por staff desde Payload.

Restricciones: conservar contratos `@jeyjo/erp-ports` y `@jeyjo/stock-ports` para fase futura; no romper storefront B2C/B2B existente; cumplir RF-030 (roles staff).

## Goals / Non-Goals

**Goals:**

- Payload CMS + Supabase como fuente de verdad operativa.
- Staff edita catálogo comercial, stock, tarifas B2B y documentos cliente desde admin.
- Excel import/export de catálogo como herramienta de carga masiva web.
- Intranet Contabilidad y Precios leen datos CMS/Supabase, no stub ERP.
- Modo `webNativeMode` desactiva sync y export ERP en runtime.

**Non-Goals:**

- Implementar adaptador API Avansuite (#36).
- Sync FTP Distrisantiago o web Arnoia.
- Escritura hacia ERP.
- Área documental B2C.
- Eliminar paquetes `erp-ports` / `stock-ports`.

## Decisions

### D1 — Flag operativo `webNativeMode` en `systemSettings`

**Decisión:** Añadir boolean `webNativeMode` (default `true` en nuevos despliegues) en global `systemSettings`, con fallback env `WEB_NATIVE_MODE=true`.

**Rationale:** Un solo switch documenta el modo operativo, permite tests con ERP stub en dev, y evita borrar código de integración.

**Alternativa descartada:** Eliminar adaptadores ERP — rompe tests y fase #36.

### D2 — Reutilizar campos existentes; renombrar solo en UI

**Decisión:** Mantener nombres de campo (`skuErp`, `p1Price`, `erpStock`, etc.) en DB; renombrar pestañas/labels a "Datos comerciales" y "Stock disponible".

**Rationale:** Minimiza migración y mantiene motor de precios, Excel format y seeds.

**Alternativa descartada:** Renombrar columnas DB — migración costosa sin beneficio inmediato.

### D3 — Stock manual en `erpStock` + semáforo recalculado

**Decisión:** Staff edita `erpStock` (label "Stock disponible"); al `afterChange` recalcular `stockIndicator` con `resolveStockIndicator` usando solo cantidad manual (sin Distrisantiago/Arnoia). Ocultar o congelar campos `distrisantiagoStock` / `arnoiaStock` en admin cuando `webNativeMode` está activo.

**Rationale:** Reutiliza semáforo RF-005 y storefront stock read sin nuevo campo.

### D4 — Documentos: colección Payload `customerDocuments`

**Decisión:** Nueva colección con: `customerId` (UUID Supabase), `documentType` (enum), `documentNumber`, `issuedAt`, `grossAmount`, `netAmount`, `dueDate`, `outstandingAmount`, `status`, `pdf` (upload → Supabase Storage `private-documents/{customerId}/{id}.pdf`). Hooks `afterChange` emiten evento `invoice_new` para facturas nuevas.

**Rationale:** Metadatos queryables en Payload; PDF en bucket existente (#37); storefront APIs cambian fuente, no rutas.

**Alternativa descartada:** Solo Supabase table sin Payload — pierde UX admin y audit hooks.

### D5 — Tarifas: colecciones Payload con mirror Supabase

**Decisión:** Colecciones `specialPrices` y `groupOffers` en Payload; hooks `afterChange`/`afterDelete` hacen upsert/delete en tablas Supabase existentes. Storefront `custom-tariffs` lee Supabase directamente (igual que pricing engine).

**Rationale:** Alinea vista intranet con carrito; tablas ya existen desde #6/#25.

**Alternativa descartada:** Solo Payload sin Supabase — rompe `PricingRepository` del carrito.

### D6 — Excel catálogo: escritura directa sin adaptador ERP reader

**Decisión:** `catalog-import apply` escribe campos comerciales vía Payload API normal (sin `erpSync` context) cuando `webNativeMode` está activo. Export sin cambios.

**Rationale:** Excel es herramienta web, no integración ERP.

### D7 — Desactivación sync/export con HTTP 410

**Decisión:** Endpoints cron sync catálogo/stock y `POST /export-avansuite` responden `410 Gone` con mensaje cuando `webNativeMode` está activo; botones ocultos en admin.

**Rationale:** Fail explicit; evita operadores creyendo que sync funciona.

## Architecture (web-native)

```
Staff (Payload Admin)
  ├── Productos (comercial + stock manual)
  ├── Proveedores (editable)
  ├── Documentos cliente (PDF upload)
  ├── Precios especiales / Ofertas grupo
  └── Excel import/export catálogo
           │
           ▼
    Payload + Supabase
           │
           ▼
    Storefront (B2C + B2B intranet)
    
    [INACTIVO] ErpCatalogSync, StockSync, ErpDocumentsReader, ErpPricingReader
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Divergencia futura CMS vs ERP al activar #36 | Documentar campos "re-sincronizables" en design #36; `webNativeMode=false` reactiva sync |
| Staff edita precio incorrecto | Audit log existente; roles RF-030; validación rangos |
| PDFs grandes en Storage | Límite upload 12MB (alineado Media); validar MIME PDF |
| Tarifas Payload/Supabase desincronizadas | Upsert en hook; test integración mirror |
| Notificaciones `invoice_new` duplicadas | Idempotencia por `documentNumber` + `customerId` |
| Datos stub desaparecen en intranet | Seed opcional CMS; checklist migración manual |

## Migration Plan

1. Añadir `webNativeMode` a `systemSettings` (default true).
2. Desplegar colecciones nuevas (documentos, tarifas) y relajar guards catálogo/stock.
3. Migrar datos stub opcionales a registros CMS (script one-off o manual).
4. Reapuntar storefront documents + custom-tariffs services.
5. Deshabilitar crons sync en Vercel cuando flag activo.
6. Verificar Excel import en staging con producto nuevo.
7. Rollback: `webNativeMode=false` restaura sync endpoints (datos CMS editados no se pisan automáticamente sin sync manual).

## Open Questions

- ¿Ocultar pestaña "Stock multisource" completamente o mostrar campos legacy read-only con valor 0?
- ¿Rol mínimo para documentos cliente: `administracion` o también `catalogo`?
- ¿Seed automático de documentos/tarifas demo en `pnpm seed` cuando `webNativeMode=true`?
