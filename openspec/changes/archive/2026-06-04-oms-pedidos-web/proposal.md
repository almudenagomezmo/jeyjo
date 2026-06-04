## Why

Checkout (#17) y pagos (#18) ya crean pedidos en Payload con origen, estados (`pending_payment`, `pending_confirmation`, `confirmed`) y metadatos de pago, pero el equipo de Jeyjo solo dispone del listado genérico de la colección `orders` sin bandeja operativa, validación EVA ni exportación a Avansuite. Sin **RF-025** y **US-17**, almacén y administración no pueden preparar albaranes desde la venta web; el ROADMAP bloquea presupuestos (#19), RMA (#27), notificaciones (#28), KPIs (#30), marketing post-pago (#31) y EVA (#32). Es el cambio #20 recomendado tras pagos.

## What Changes

- **Bandeja OMS principal** en Payload: vista dedicada con columnas US-17 (número, fecha, cliente, importe, estado, origen B2C/B2B/EVA) y filtros por fecha, estado, cliente y origen.
- **Bandeja EVA separada** "Pedidos IA — pendientes de validación": pedidos con `origin=eva` y `validatedEva=false`; acciones **Revisar y Validar** y **Rechazar** con transición de estado y auditoría (**CA-BACKEND-003**).
- **Flujo staff de estados**: transiciones permitidas desde bandeja/ficha (`pending_confirmation` → `confirmed` → `preparing` → `shipped` → `delivered`; cancelación); confirmación manual de transferencias B2C en `pending_payment`.
- **Exportación Excel Avansuite** por pedido y exportación masiva de selección (**RI-002**, **CA-BACKEND-004**): archivo compatible con plantilla de importación de albaranes; validación de columnas antes de descarga.
- **Aviso stock pendiente**: campo y badge visual cuando una línea tiene stock insuficiente y el pedido lleva flag de validación de stock (**US-17 CA5**).
- **Enriquecimiento de pedido en admin**: resolución de nombre/email cliente desde `customerRef` (Supabase) en listado y detalle; snapshot de líneas legible.
- **Acceso por rol**: solo roles `superadmin` y `administracion` ven bandejas y endpoints OMS (**RF-030**, **CA-BACKEND-006**).
- **Seed / fixture EVA** para pruebas de bandeja IA en staging.
- **Tests**: unit (mapeo Excel, filtros EVA), integración endpoint export; checklist manual CA-BACKEND-003/004.

## Capabilities

### New Capabilities

- `backoffice-oms-inbox`: Bandeja principal de pedidos web con filtros, columnas US-17, transiciones staff y confirmación transferencia.
- `backoffice-eva-orders-queue`: Bandeja separada EVA, validar/rechazar, estados y auditoría.
- `backoffice-order-avansuite-export`: Generación y validación de Excel RI-002 para uno o varios pedidos confirmados.

### Modified Capabilities

- `payload-order-collection`: Campos `stockValidationPending`, `exportedToErpAt`, reglas de exportación y transiciones de estado documentadas para OMS.
- `backoffice-staff-roles`: Ruta admin `/admin/oms` (o equivalente) restringida a administración; 403 y evento de seguridad si rol catálogo intenta acceder.

## Impact

- `apps/cms`: componentes admin (`OmsInboxView`, `EvaOrdersQueueView`), endpoints (`/api/orders/export-avansuite`, `/api/orders/eva/validate`, `/api/orders/eva/reject`), utilidades Excel en `packages/` o `apps/cms/src/lib/orders/`, ampliación `Orders` collection.
- `packages/erp-ports` o nuevo `packages/order-export`: contrato y mapper DTO → filas Excel (stub documentado hasta API Avansuite #36).
- `apps/cms/src/access/staffRoles.ts`, `payload.config.ts` (rutas custom admin).
- Tests en `apps/cms/tests/` (export, EVA queue, access).
- Desbloquea ROADMAP #19, #27, #28, #30, #31, #32; depende de #3, #17 (completados) y #18 (pagos).
- Cumple **RF-025**, **US-17**; criterios **CA-BACKEND-003**, **CA-BACKEND-004**, **CA-BACKEND-006** (acceso).

## Non-Goals

- Escritura automática de pedidos a Avansuite vía API (**#36** `erp-api-write-implementation`); solo Excel bajo demanda en este cambio.
- Dashboard KPIs y alertas globales (**#30**).
- Emails transaccionales de confirmación o rechazo EVA hacia cliente (**#28**); rechazo EVA persiste estado y deja hook para notificación futura.
- Ingesta real de pedidos desde widget EVA/SKAI (**#32**); se simula con `origin=eva` y endpoint/seed de prueba.
- Histórico de compras en storefront/intranet (**#23**).
- Presupuestos (**#19**), cupones (**#31**), RMA (**#27**).
- Sync bidireccional de estado pedido con ERP en tiempo real.
- Importación masiva de pedidos históricos desde Avansuite.

## Assumptions

- Plantilla Excel de albaranes Avansuite se documenta con columnas acordadas con Jeyjo (referencia ERP, cantidad, precio, cliente CIF/código); hasta confirmación se usa plantilla stub alineada a `RI-002` en specs de dominio.
- Pedidos exportables: `jeyjoStatus` en `confirmed`, `preparing` o posterior; EVA solo exportable tras `validatedEva=true`.
- Cliente en bandeja: `guestEmail` o lookup `customerRef` → `customers` Supabase (nombre comercial, CIF).
- Stock warning: comparación con stock ERP cacheado (#8) en servidor al abrir bandeja o en hook `beforeChange` opcional ligero.
