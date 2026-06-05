## Why

El portal B2B (#22) expone `/intranet/rma` como scaffold vacío; sin **RF-021** y **US-13**, los administradores de empresa no pueden solicitar devoluciones con trazabilidad ni consultar el estado de sus incidencias — un proceso que hoy depende de email o teléfono y contradice la política de que ninguna devolución se acepta sin autorización previa de Jeyjo. El OMS web (#20) y la bandeja operativa en Payload ya demuestran el patrón de documentos con ciclo de vida y email transaccional (#19); este cambio (#27 del ROADMAP) conecta el formulario B2B, la persistencia en backoffice y la confirmación por email, sustituyendo el placeholder por una sección operativa en staging.

## What Changes

- **Sección “RMA e incidencias”** en `/intranet/rma`: aviso normativo de autorización previa (**US-13 CA4**), formulario de solicitud con referencia de artículo, número de albarán, motivo (lista cerrada + observaciones libres) y envío (**US-13 CA1**).
- **Persistencia Payload:** nueva colección `rma-incidents` con número único `RMA-{YYYY}-{seq}`, campos de solicitud, `customerRef`, estado inicial **Solicitada** y ciclo **Solicitada → En revisión → Autorizada/Rechazada** (**RF-021**).
- **Listado cliente:** tabla paginada de incidencias abiertas y cerradas con número RMA, fecha, referencia, albarán, motivo, estado y observaciones truncadas (**US-13 CA3**).
- **API storefront:** `GET /api/intranet/rma-incidents` (listado filtrable por estado abierto/cerrado) y `POST /api/intranet/rma-incidents` (creación con validación B2B).
- **Email confirmación:** al crear incidencia, envío transaccional con número RMA al email de la cuenta (**US-13 CA2**, **CA-B2B-005**, **RI-009**); fallo de email no revierte la incidencia.
- **Bandeja backoffice:** vista dedicada en Payload para staff `administracion`/`superadmin` con columnas operativas, filtros y transiciones de estado con audit log (**RF-021** criterio < 1 min).
- **UI intranet:** reemplazar `IntranetScaffoldPage` en RMA por página con formulario + listado, badges de estado, estados vacío/error.
- **Tests:** unit (generador número, validación motivo), integración API (auth B2B, creación + listado), escenario **CA-B2B-005** documentado.

## Capabilities

### New Capabilities

- `storefront-b2b-rma-incidents`: UI y APIs del portal B2B en `/intranet/rma` — formulario, listado, aviso normativo y guardas de sesión (**RF-021**, **US-13**).
- `payload-rma-collection`: Colección Payload `rma-incidents` con numeración, campos de solicitud, ciclo de estados y acceso staff-only.
- `backoffice-rma-inbox`: Bandeja operativa en Payload para listar, filtrar y transicionar incidencias RMA.
- `rma-request-confirmation-email`: Email transaccional de confirmación al enviar solicitud RMA (**US-13 CA2**, **RI-009**).

### Modified Capabilities

- `storefront-b2b-portal-shell`: Sustituir escenario de scaffold en `/intranet/rma` por vista de producción; mantener navegación US-07.

## Impact

- `apps/storefront`: `app/(b2b)/intranet/rma/**`, componentes `RmaIncidents*`, `lib/intranet/rma/**`, rutas API bajo `app/api/intranet/rma-incidents/`.
- `apps/cms`: colección `RmaIncidents`, hook numeración, endpoint o vista inbox, transiciones de estado, plantilla email.
- Tests en `apps/storefront/tests/` y `apps/cms/tests/`.
- Cumple **RF-021**, **US-13**, **CA-B2B-005**; depende de ROADMAP #20, #22 (completados).
- Complementa histórico (#23) y desbloquea #28 (notificaciones de cambio de estado) y #32 (EVA con contexto de incidencias).

## Non-Goals

- Validación ERP en tiempo real del número de albarán contra documentos Avansuite (**#37** área documental); v1 acepta texto libre con formato sugerido.
- Adjuntar fotos o PDF en la solicitud (Storage + UI upload — fase posterior).
- Notificaciones in-app en cabecera del portal por cambio de estado (**#28** `notifications-center-email`); v1 solo email en creación.
- Email al cliente cuando staff autoriza/rechaza (**#28**); staff actúa desde bandeja sin aviso automático al cliente en v1.
- Escritura o sincronización bidireccional RMA hacia Avansuite (**#36**); Payload es fuente de verdad web v1.
- Permisos RF-003 por subusuario (#26): todos los B2B validados ven y crean incidencias de la empresa v1.
- Flujo B2C `/cuenta` para RMA (US-13 es rol Admin Empresa B2B).
- Generación de etiqueta de devolución o logística inversa automatizada.

## Assumptions

- Sesión B2B validada aporta `customerRef` (uuid Supabase) y email de cuenta para confirmación.
- Número de albarán es campo texto obligatorio; no se bloquea el envío si el albarán no existe aún en ERP stub.
- Motivos cerrados: `wrong_item`, `defective`, `wrong_qty`, `other`; cuando `other`, las observaciones son obligatorias (mín. 10 caracteres).
- Estados internos en inglés (`requested`, `in_review`, `authorized`, `rejected`); etiquetas UI en español.
- Incidencias **abiertas** = `requested` | `in_review`; **cerradas** = `authorized` | `rejected`.
- Seed incluye al menos una incidencia de ejemplo para `empresa@test.com` y escenario **CA-B2B-005** con REF-011 / ALB-2026-001.
