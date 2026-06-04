## Context

- **Estado actual:** `apps/cms` define campos ERP en `erpFields.ts` (solo lectura vía `erpReadOnlyFieldAccess`) y colección `suppliers` con `erpCode`, pero no hay paquete de integración ni interfaces. La arquitectura (`04-arquitectura-jeyjo.md`) exige **Adapter Pattern** para ERP/FTP/EVA; `openspec/config.yaml` nombra puertos `ErpCatalogReader` / `ErpCatalogWriter` / `ErpDocumentsReader`.
- **Dependencias:** cambio #3 aplicado (`payload-catalog-collections`, hooks `audit_log` / `search_events`).
- **Requisitos:** RF-023 (sync bidireccional — contratos ahora, API en #36), RI-001 (lectura/escritura Avansuite), US-15 (Excel vía adaptador en #29), RNF-007 (degradación ante caída ERP — contrato de error en #4, comportamiento operativo en #7).

## Goals / Non-Goals

**Goals:**

- Paquete workspace `@jeyjo/erp-ports` con interfaces, DTOs y errores compartidos (CMS hoy; storefront/workers en cambios futuros si consumen lectura ERP).
- Adaptador **stub** registrable por `ERP_ADAPTER=stub` (default en dev).
- Servicio de aplicación en CMS (`ErpSyncService` o equivalente) que traduce DTO → campos Payload y marca `syncErpAt`, invocable desde hooks/endpoints futuros (#7) sin acoplar a Avansuite.
- Tests Vitest de stub y registry; documentación de extension points para `excel` y `api`.

**Non-Goals:**

- Jobs cron, cola de reintentos con backoff (RI-001 — #7/#36).
- Parseo Excel SheetJS (#29).
- HTTP client Avansuite (#36).
- Puertos de clientes, tarifas, precios especiales completos (solo tipos placeholder o métodos que lanzan `ErpCapabilityNotImplemented`).
- Documentos factura/albarán más allá de interfaz `ErpDocumentsReader` vacía con JSDoc de fase #37.

## Decisions

### 1. Paquete `packages/erp-ports` sin dependencia de Payload

**Decisión:** Puertos y DTOs viven en `packages/erp-ports`; `apps/cms` depende del paquete e implementa mapeo Payload.

**Alternativa descartada:** Interfaces solo en `apps/cms/src/erp` — duplicación cuando #7 añada worker o #29 comparta DTOs.

**Rationale:** Monorepo pnpm ya tiene `packages/database-types`; mismo patrón para contratos de dominio integración.

### 2. Tres puertos principales + tipos de soporte

**Decisión:**

| Puerto | Responsabilidad | Fase |
|--------|-----------------|------|
| `ErpCatalogReader` | `listProducts`, `getProductBySku`, `listSuppliers` (paginado/cursor) | Stub + #7 |
| `ErpCatalogWriter` | `upsertProduct`, `upsertSupplier` (idempotente por `skuErp` / `erpCode`) | Stub firma + #36 |
| `ErpDocumentsReader` | `listInvoices`, `listDeliveryNotes` — **not implemented** en #4 | #37 |

**Alternativa:** Un solo `ErpGateway` — mezcla lectura documental con catálogo y dificulta permisos RI-001 (stock/docs solo lectura).

### 3. DTOs normalizados (`ErpProductDto`, `ErpSupplierDto`)

**Decisión:** Campos alineados a `erpFields.ts` y ERD: `skuErp`, `mainWholesaleRef`, `oemRef`, `ean`, `shortDescription`, `p1Price`, `p2Price`, `vatRate`, `packUnit`, `isWildcard`, `allowOrderWithoutStock`, `erpStock` (referencia), `supplierErpCode?`, `syncedAt` opcional en respuesta.

**Mapeo Payload:** función pura `mapErpProductDtoToPayload(data)` en `apps/cms/src/erp/mappers/product.ts`.

### 4. Registry por variable de entorno

**Decisión:** `getErpAdapters(): { catalogReader, catalogWriter, documentsReader }` lee `process.env.ERP_ADAPTER` (`stub` | `excel` | `api`). Valores no implementados lanzan error claro en boot o primera resolución.

**Default:** `stub` si unset en `NODE_ENV=development`; en producción sin adapter configurado → log warning y stub deshabilitado solo si se exige explícitamente (documentar en `.env.example`).

**Alternativa:** Inyección DI container (tsyringe) — overkill para dos consumidores iniciales.

### 5. Errores y degradación (RNF-007)

**Decisión:** Jerarquía `ErpIntegrationError` con `code`: `ERP_UNAVAILABLE`, `ERP_TIMEOUT`, `ERP_VALIDATION`, `ERP_NOT_IMPLEMENTED`. Los adaptadores stub pueden simular `ERP_UNAVAILABLE` vía flag de test.

**Sync service:** En fallo de lectura, no borrar datos Payload; conservar último snapshot y propagar error al caller (hook #7 registrará en `audit_log` con `error_erp`).

### 6. Actualización de campos ERP solo vía `ErpCatalogSyncService`

**Decisión:** Nuevo módulo CMS que recibe DTOs del reader y hace `payload.update` con `overrideAccess: true` y contexto `erpSync: true`. Los hooks `beforeChange` en productos rechazan mutación de campos ERP si `req.context?.erpSync !== true`.

**Alternativa:** Solo `access.update` — insuficiente para API interna con override.

### 7. Idempotencia y claves naturales

**Decisión:** Writer y sync usan `skuErp` (producto) y `erpCode` (proveedor) como claves naturales; operaciones repetidas producen el mismo estado (CA-BACKEND / idempotency pattern arquitectura).

### 8. Tests en `packages/erp-ports` y `apps/cms`

**Decisión:** Vitest en paquete (stub reader/writer) e integración ligera en CMS (registry + mapper) sin base de datos si es posible con mocks de Payload.

## Risks / Trade-offs

| Riesgo | Mitigación |
|--------|------------|
| Divergencia DTO ↔ Payload tras cambios en `erpFields` | Mapper único + test de snapshot de campos; comentario en `erpFields.ts` referenciando DTO |
| Stub en producción por error de config | Validación en boot: si `ERP_ADAPTER=stub` y `NODE_ENV=production`, warn/error según política |
| Scope creep hacia Excel/API en este cambio | Puertos definidos; adaptadores `excel`/`api` registran `ErpCapabilityNotImplemented` hasta #29/#36 |
| Duplicación con MOD-05 Sync Engine futuro | `ErpCatalogSyncService` es capa delgada; #7 orquestará scheduling sin redefinir puertos |

## Migration Plan

1. Añadir `packages/erp-ports` y referencia en `apps/cms/package.json`.
2. Implementar stub + registry; `.env.example` con `ERP_ADAPTER=stub`.
3. Añadir `ErpCatalogSyncService` y hook `beforeChange` en Products/Suppliers (sin job automático).
4. Ejecutar tests; documentar en `apps/cms/README.md` sección ERP ports.
5. Rollback: eliminar dependencia y revertir hooks; campos ERP en Payload permanecen (sin sync).

## Open Questions

- ¿`erpStock` en Payload se alimenta solo del ERP en #7 o también de mayoristas (#8)? — Mantener como referencia ERP en DTO; multisource en #8.
- ¿Ubicación futura del worker de sync (#7): Edge Function vs cron Vercel? — No bloquea #4; puertos son agnósticos al runtime.
