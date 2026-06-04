## Context

- **Estado actual:** Tras #3, `apps/cms` tiene hooks `auditLogHooks` en `products`, `categories`, `suppliers`, `orders` que escriben en Supabase `audit_log` sin `previous_value` ni `source_ip`. La colección `users` usa roles `admin` | `customer` del template e-commerce; `admin` tiene acceso total. No hay MFA en Payload Auth. La tabla `audit_log` y RLS append-only existen desde #2 (`audit-log-immutable`).
- **Arquitectura:** Payload Auth para staff; clientes web en Supabase `web_profiles` (#16). Audit trail centralizado en Postgres Supabase, no en tablas Payload.
- **Dependencias:** #1 monorepo, #2 esquema Supabase, #3 colecciones y hooks base.
- **Requisitos:** RF-002, RF-029, RF-030; CA-AUTH-005, CA-BACKEND-005, CA-BACKEND-006; RNF-011.

## Goals / Non-Goals

**Goals:**

- MFA TOTP obligatorio para cualquier sesión admin de staff (sin excepción, incluido superadmin).
- Roles funcionales Jeyjo con access control por colección y visibilidad de grupos admin.
- Audit trail alineado a RF-029: diff en updates, IP, cobertura ampliada y eventos de seguridad.
- Consola de lectura del log en Payload con filtros operativos.
- Tests automatizables para CA-AUTH-005, CA-BACKEND-005, CA-BACKEND-006 en staging.

**Non-Goals:**

- MFA Supabase para clientes B2B/B2C (#16).
- Excel import/export audit (#29).
- KPI dashboard (#30).
- Subusuarios B2B (#26).
- Eliminación de rol `customer` en `users` (mantener para compatibilidad template; staff no debe depender de él).

## Decisions

### 1. MFA vía Payload Auth `twoFactor` (TOTP nativo)

**Decisión:** Habilitar `auth: { twoFactor: { enabled: true } }` (o equivalente Payload 3.85) en la colección `users` para cuentas staff. Middleware/hook post-login rechaza acceso a `/admin` si `twoFactorEnabled` es false.

**Alternativa descartada:** MFA solo en Supabase Auth — el backoffice no usa Supabase Auth para staff.

**Alternativa descartada:** Proveedor externo (Auth0) — fuera de stack acordado.

**Enrolamiento:** Tras primer login con credenciales válidas, redirigir a flujo de configuración TOTP (QR) antes de mostrar admin. Superadmin con rol `superadmin` puede invocar acción «Reset MFA» que invalida secreto y fuerza re-enrolamiento.

### 2. Separar staff de clientes en `users`

**Decisión:** Campo `staffRoles` (select hasMany) con valores `superadmin`, `administracion`, `catalogo`, `personalizacion`, `mantenimiento`. Un usuario es **staff** si `staffRoles` tiene al menos un valor. Access a `/admin` exige staff + MFA. Rol legacy `customer` permanece para datos template pero `access.admin` y create público se restringen.

**Alternativa descartada:** Colección `staff-users` separada — duplica auth y rompe joins existentes.

### 3. Matriz de permisos por área (RF-030)

**Decisión:** Helper `hasStaffRole(user, roles[])` + mapa `COLLECTION_ACCESS` por slug:

| Área | Colecciones / grupos admin |
|------|---------------------------|
| superadmin | Todo |
| administracion | `orders`, vistas pedidos/clientes (futuro `customers` Payload si existe), sin catálogo write |
| catalogo | `products`, `categories`, `suppliers`, `media` (catálogo) |
| personalizacion | `pages`, `forms`, banners futuros, blog (#33) |
| mantenimiento | `users` (lectura limitada), audit console, globals/config futuros (#42) |

**403:** `access.read/update/delete` devuelve false; hook global `afterError` o middleware registra `ACCESS_DENIED` en audit_log (CA-BACKEND-006).

**Alternativa descartada:** Permisos por campo en v1 — demasiado granular; posponer a #42.

### 4. Auditoría: factory central + diff

**Decisión:** Refactor `auditLogHooks.ts` → `createAuditHooks({ collection, entityType, pickFields })` registrado en todas las colecciones staff-relevantes. En `update`, serializar subset de campos sensibles a `previous_value` (doc antes del cambio) y `new_value` (doc después). Pasar `source_ip` desde `req.headers.get('x-forwarded-for')` o `req.ip`.

**Colecciones v1:** products, categories, suppliers, orders, users, media, pages (si staff-editable).

**Alternativa descartada:** Trigger Postgres en tablas Payload — no captura IP ni contexto Payload fácilmente.

### 5. Consola audit: custom Payload view + endpoint

**Decisión:** Componente admin `AuditLogView` que consulta Supabase vía endpoint interno `GET /api/audit-log` (solo `superadmin` y `mantenimiento`) con query params: `actor`, `entityType`, `action`, `from`, `to`, paginación. Sin colección Payload duplicada.

**Alternativa descartada:** Colección `audit-log` en Payload con sync — viola inmutabilidad y duplica datos.

### 6. Eventos de seguridad

**Decisión:** Función `writeSecurityAudit({ action, actor, metadata, req })` para: `MFA_ENROLLED`, `MFA_RESET`, `LOGIN_FAILED`, `ACCESS_DENIED`, `ROLE_CHANGED`, `PASSWORD_CHANGED`. Misma tabla `audit_log` con `entity_type` = `security`.

### 7. Contraseñas staff (RNF-011)

**Decisión:** Validación `beforeValidate` en users para staff: min 12 chars, mayúscula, minúscula, número, especial. Rate limit login: delegar a Payload lockout / configuración auth max login attempts (5 → 15 min).

### 8. Índices Supabase opcionales

**Decisión:** Migración incremental `audit_log_actor_created_at_idx`, `audit_log_entity_type_created_at_idx` para filtros de consola. No cambia contrato append-only.

## Risks / Trade-offs

| Riesgo | Mitigación |
|--------|------------|
| Payload `twoFactor` API cambia entre minor versions | Fijar versión 3.85; test e2e CA-AUTH-005; documentar en README |
| Hooks con diff aumentan payload JSON | `pickFields` limita a precios, slugs, roles, MFA flags |
| IP incorrecta detrás de Vercel | Preferir `x-forwarded-for` primero hop; documentar en ops |
| Staff bloqueado sin MFA en despliegue | Script migración: flag `requireMfaFrom` en env; grace period 7 días solo en dev |
| Rol `customer` confunde operadores | Ocultar usuarios solo-customer del listado admin staff |
| Audit console expone datos sensibles | Solo roles `superadmin` y `mantenimiento`; sin export masivo sin permiso |

## Migration Plan

1. Añadir migración índices `audit_log` (opcional).
2. Extender `Users` con `staffRoles`, auth twoFactor, validación password staff.
3. Refactor access helpers y aplicar a colecciones.
4. Ampliar audit hooks + `writeSecurityAudit`.
5. Implementar `AuditLogView` + API route.
6. Actualizar seed: usuario staff por rol + superadmin con MFA en test.
7. Tests e2e: login sin MFA bloqueado; rol catálogo 403 en orders; precio auditado.
8. **Rollback:** desactivar `twoFactor` en config y revertir access a admin-only; datos `audit_log` permanecen (append-only).

## Open Questions

1. ¿Grace period MFA en staging producción? (**Recomendación:** no en prod; sí variable `MFA_GRACE_DAYS=0` por defecto.)
2. ¿`personalizacion` edita `products` SEO en v1? (**Recomendación:** solo pages/media; SEO producto queda en `catalogo` hasta #21.)
3. ¿Export CSV audit en este cambio? (**Recomendación:** sí, solo superadmin, límite 10k filas.)
