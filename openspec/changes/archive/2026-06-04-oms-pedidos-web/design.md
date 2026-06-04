## Context

- **Estado actual:** La colección `orders` en Payload (#3, #17, #18) persiste `orderNumber`, `origin` (b2c/b2b/eva), `jeyjoStatus`, `customerRef`, `validatedEva`, snapshots de líneas, pago y entrega. El admin muestra el listado por defecto del plugin ecommerce con columnas básicas; roles `administracion`/`superadmin` tienen acceso vía `staffRoles` (#5). No hay vistas OMS, export Excel ni cola EVA.
- **Arquitectura:** Payload es OMS v1; Avansuite recibe pedidos vía Excel (**RI-002**) hasta API write (#36). EVA (#32) enviará pedidos con `origin=eva`; este cambio prepara validación humana sin integración SKAI.
- **Referencias:** `PimHealthView` + endpoint `/api/pim-health` como patrón de custom admin + API staff.

## Goals / Non-Goals

**Goals:**

- Bandeja OMS y bandeja EVA como custom views en `/admin` con filtros y acciones US-17.
- Paquete `@jeyjo/order-export` (o módulo en `packages/`) con mapper pedido → filas Excel y validación de esquema.
- Endpoints CMS autenticados (staff `orders` write/read) para export, validar/rechazar EVA.
- Campos `stockValidationPending`, `exportedToErpAt` en orders; badge en UI.
- Seed pedido EVA de prueba; tests unitarios del mapper Excel.

**Non-Goals:**

- API Avansuite write, webhooks EVA, emails, dashboard KPIs, storefront histórico (ver proposal).

## Decisions

### 1. Custom views Payload en lugar de solo default list

**Decisión:** Registrar `OmsInboxView` en `components.views` (ruta `/admin/oms`) y `EvaOrdersQueueView` (`/admin/oms/eva`) además del listado nativo `orders` (enlace desde sidebar grupo Pedidos).

**Rationale:** Filtros compuestos, acciones masivas y columnas derivadas (nombre cliente) no encajan bien en `admin.listSearchableFields` del plugin.

**Alternativa descartada:** Solo hooks + `admin.defaultColumns` — insuficiente para bandeja EVA separada y export masivo.

### 2. Datos de bandeja vía REST Payload + Supabase lookup

**Decisión:** Las vistas llaman `GET /api/orders` con query Payload (`where`, `sort`, `depth=0`) y un endpoint auxiliar `GET /api/orders/inbox-summary` que enriquece hasta 100 filas con `customerLabel` desde Supabase `customers` por `customerRef`.

**Rationale:** Reutiliza access control existente; evita SQL directo en cliente.

**Alternativa descartada:** Vista RSC server-only sin fetch — Payload 3 admin es mayormente client components en patrones existentes (`PimHealthView`).

### 3. Paquete `@jeyjo/order-export`

**Decisión:** Nuevo paquete `packages/order-export/` con:

- `buildAvansuiteOrderRows(order: OrderExportInput): AvansuiteRow[]`
- `validateAvansuiteWorkbook(rows): ValidationResult`
- `serializeAvansuiteXlsx(rows): Buffer` usando `exceljs` (ya usado o añadir dependencia workspace).

Columnas stub documentadas en `docs/avansuite-order-import.md` (referencia, cantidad, precio unitario, descuento línea, código cliente ERP, número pedido web, fecha) — ajustables cuando Jeyjo confirme plantilla real.

**Rationale:** RI-002 y CA-BACKEND-004 exigen formato estable y testeable; desacopla de Payload para reutilizar en #29 excel exporter.

**Alternativa descartada:** CSV — Avansuite import histórico es Excel según specs.

### 4. Export endpoint

**Decisión:** `POST /api/orders/export-avansuite` body `{ orderIds: string[] }` (max 50), staff `administracion|superadmin`, solo pedidos con `jeyjoStatus` ∈ `confirmed|preparing|shipped|delivered` y EVA con `validatedEva=true`. Respuesta: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` o ZIP si múltiples libros. Tras export exitoso, set `exportedToErpAt` (no bloquea re-export).

**Rationale:** RI-002 bajo demanda; idempotencia operativa (re-export permitido).

### 5. Flujo EVA

**Decisión:**

- Bandeja lista `origin=eva` AND `validatedEva=false` AND `jeyjoStatus` ≠ `cancelled`.
- **Validar:** PATCH `validatedEva=true`, `jeyjoStatus=confirmed` (si estaba `pending_confirmation`), audit log vía hooks existentes.
- **Rechazar:** PATCH `jeyjoStatus=cancelled`, `validatedEva=false`; campo opcional `evaRejectionReason`; sin llamada SKAI (#32).

**Rationale:** CA-BACKEND-003; separación bandeja hasta validación humana.

### 6. Stock validation flag

**Decisión:** Campo boolean `stockValidationPending` en order; endpoint `POST /api/orders/recheck-stock` (staff) o cálculo en `inbox-summary` que compara cantidades de `orderLineSnapshots` / items con stock ERP vía adapter lectura (#8) por SKU. Si alguna línea `qty > available`, flag true y badge en fila.

**Rationale:** US-17 CA5 sin bloquear export; aviso visual.

**Alternativa descartada:** Bloquear export si stock bajo — negocio permite pedido pendiente validación.

### 7. Transiciones de estado staff

**Decisión:** Matriz permitida en endpoint `PATCH /api/orders/:id/status` o validación `beforeChange` hook:

| Desde | Hacia permitido (staff) |
|-------|-------------------------|
| `pending_payment` | `confirmed`, `cancelled` (transferencia manual) |
| `pending_confirmation` | `confirmed`, `cancelled` |
| `confirmed` | `preparing`, `cancelled` |
| `preparing` | `shipped`, `cancelled` |
| `shipped` | `delivered` |

Storefront API key no puede usar estas transiciones OMS.

**Rationale:** Evita saltos inválidos; alinea almacén con estados Jeyjo.

### 8. Acceso OMS routes

**Decisión:** Middleware en endpoints y `admin.components` `access` callback: `hasStaffRole(['superadmin','administracion'])`. Intentos de rol `catalogo` → 403 + `logAccessDenied` (#5).

**Rationale:** CA-BACKEND-006 extiende a `/admin/oms*`.

## Risks / Trade-offs

- **[Plantilla Excel incorrecta]** → Documentar columnas stub; test fixture con hoja mínima; checklist manual CA-BACKEND-004 en staging Avansuite.
- **[Lookup cliente lento]** → Limitar enriquecimiento a página actual (50–100); cache en memoria por request.
- **[EVA sin integración real]** → Seed + doc para #32; bandeja usable con pedidos creados manualmente `origin=eva`.
- **[Doble fuente líneas items vs orderLineSnapshots]** → Export prefiere `orderLineSnapshots` si existe, else plugin `items`.

## Migration Plan

1. Añadir campos Payload (no destructivos, defaults).
2. Desplegar paquete `order-export` y endpoints.
3. Registrar vistas admin; enlazar desde grupo Pedidos.
4. Seed pedido EVA en `endpoints/seed` opcional.
5. Rollback: ocultar vistas admin; campos nuevos ignorados.

## Open Questions

- Confirmar con Jeyjo nombre exacto del fichero/plantilla Excel Avansuite para albaranes (sustituir stub en `docs/avansuite-order-import.md`).
- ¿Un libro Excel por pedido o un libro con múltiples hojas en export masivo? (propuesta: un libro, una hoja por pedido, max 50).
