## Why

El cambio #3 (`payload-collections-bootstrap`) dejó hooks de auditoría solo en catálogo y pedidos, roles Payload reducidos a `admin`/`customer`, y sin MFA en el login del backoffice. El roadmap #5 debe cerrar **RF-002**, **RF-029** y **RF-030** antes de importadores Excel (#29), KPIs (#30) y PIM avanzado (#21), porque esas funciones asumen trazabilidad completa y principio de mínimo privilegio sobre datos de clientes y precios.

## What Changes

- **MFA TOTP obligatorio** para todo usuario staff de Payload: sin segundo factor configurado no hay sesión en `/admin`; flujo de enrolamiento (QR) en primer acceso; superadmin puede resetear MFA de otro trabajador (RF-002, RNF-011, CA-AUTH-005).
- **Roles funcionales del equipo Jeyjo** sustituyen el binomio `admin`/`customer` en staff: `superadmin`, `administracion`, `catalogo`, `personalizacion`, `mantenimiento`; access control por colección y por grupo de navegación admin (RF-030, CA-BACKEND-006).
- **Cobertura de audit trail ampliada**: hooks globales o por colección para todas las entidades de negocio y staff (`users`, `media`, futuras config); captura de `previous_value` en updates, `source_ip` desde request, y eventos de seguridad (login fallido, acceso denegado 403, cambio de rol/MFA).
- **Consola de auditoría** en Payload: colección virtual o custom view de solo lectura sobre `audit_log` en Supabase con filtros por operador, entidad, acción y rango de fechas (RF-029, CA-BACKEND-005).
- Separación explícita: cuentas **cliente** del template e-commerce no usan MFA ni roles de staff; solo usuarios con al menos un rol staff acceden al panel admin.
- Documentación y variables de entorno para política de contraseñas staff (12+ caracteres) alineada a RNF-011.

## Capabilities

### New Capabilities

- `backoffice-mfa-totp`: Enrolamiento, verificación y reset de TOTP obligatorio en Payload Auth para staff; bloqueo de admin sin MFA activo.
- `backoffice-staff-roles`: Modelo de roles por área funcional, JWT `saveToJWT`, matrices de access por colección y ocultación de grupos admin.
- `backoffice-audit-console`: UI de consulta inmutable del log con filtros y exportación CSV opcional para auditorías.
- `backoffice-security-events`: Registro en `audit_log` de accesos denegados, cambios de permisos/MFA y operaciones sensibles en `users`.

### Modified Capabilities

- `payload-backoffice-hooks`: Ampliar requisitos de auditoría (diff `previous_value`, `source_ip`, todas las colecciones staff-relevantes, acciones de seguridad).
- `cms-app-bootstrap`: Documentar que `users` Payload es exclusivo staff; política MFA y roles en arranque local/CI.

## Impact

- `apps/cms/src/collections/Users/`, access helpers en `apps/cms/src/access/`, `payload.config.ts`, posibles plugins Payload MFA/TOTP o hooks de auth.
- `apps/cms/src/hooks/auditLogHooks.ts`, `apps/cms/src/lib/supabase-server.ts` (IP, diffs).
- Nueva colección o componente admin para `audit_log`; posible endpoint Payload con service role.
- `packages/database-types` — sin cambio de esquema salvo índices opcionales en `audit_log` para filtros.
- Desbloquea ROADMAP #29 (`excel-importer-exporter`), #30 (`dashboard-kpis-alerts`), #42 (`system-config-backoffice`).
- Cumple **RF-002**, **RF-029**, **RF-030**; prepara **US-19**, **US-20**; criterios **CA-AUTH-005**, **CA-BACKEND-005**, **CA-BACKEND-006**.

## Non-Goals

- MFA en área de cliente B2B/B2C (Supabase Auth) — cambio #16 `auth-registration-area-cliente`.
- Importador/exportador Excel y jobs ERP — cambios #4, #29.
- Dashboard KPIs y alertas — cambio #30.
- Subusuarios B2B con permisos granulares — cambio #26.
- Pentest operativo o WAF — fuera de alcance de implementación en este cambio.
- Retención/archivado cold storage de `audit_log` más allá de documentar RD-002 (2 años).
