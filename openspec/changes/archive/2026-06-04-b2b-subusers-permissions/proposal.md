## Why

Los cambios #16 (auth) y #22 (portal B2B) entregaron login B2B y un menú intranet completo, pero **todos los usuarios validados ven todas las secciones** — histórico (#23), pedido rápido (#24) y tarifas (#25) documentaron explícitamente que RF-003 llegaría en #26. Sin **RF-003** y **US-12**, el administrador de empresa no puede delegar acceso por departamento ni restringir finanzas o pedidos; incumple el criterio de verificación de RF-003 (subusuario sin permiso financiero no puede abrir facturas aunque conozca la URL) y bloquea adopción real del portal en empresas con varios compradores.

## What Changes

- **Modelo de permisos B2B:** esquema tipado en `web_profiles.permissions` con flags por sección (`finance`, `orders`, `account`) y `ordersRequireApproval` por subusuario; helpers compartidos `resolveB2bPermissions`, `requireSectionPermission`.
- **Gestión de subusuarios (US-12 CA1–CA4):** vista de producción en `/intranet/mi-cuenta` para `b2b_superadmin` — listado, alta (nombre, email, contraseña inicial), edición de permisos, desactivación sin borrar historial (`is_active`).
- **APIs server-side:** CRUD subusuarios bajo guard superadmin (`POST/GET/PATCH /api/intranet/subusers`) con Supabase Admin (auth + `web_profiles`); subusuarios comparten `customer_id` de la empresa y `parent_customer_id` para tenant.
- **Enforcement en portal:** filtrado de menú lateral/submenú Contabilidad por permisos; guards en páginas `/intranet/*` y APIs intranet existentes (histórico, pedido rápido, tarifas) — 403 o redirect con mensaje si falta permiso (**RF-003** criterio de verificación).
- **Flujo aprobación pedidos (US-12 CA3):** subusuarios con `ordersRequireApproval=true` crean pedidos en estado `pending_company_approval`; superadmin aprueba/rechaza desde intranet → transición a `pending_confirmation` o `cancelled`.
- **Login subusuario:** mismo flujo que B2B; rol `b2b_subuser` redirige a `/intranet` con menú filtrado; desactivados no pueden autenticarse.
- **RLS ampliada:** superadmin puede listar perfiles subordinados de su empresa; subusuario no puede mutar permisos propios ni ajenos.
- **Tests:** unit (permisos, transiciones), API (CRUD, guards, checkout approval), escenario RF-003 URL directa a facturas.

## Capabilities

### New Capabilities

- `storefront-b2b-subusers`: UI y APIs de gestión de subusuarios por superadmin en `/intranet/mi-cuenta` (**US-12** CA1, CA2, CA4).
- `storefront-b2b-permissions`: Modelo de permisos, enforcement en rutas/APIs intranet y filtrado de navegación (**RF-003**).
- `storefront-b2b-order-approval`: Cola de pedidos pendientes de aprobación empresa y acciones superadmin (**US-12** CA3).

### Modified Capabilities

- `storefront-b2b-intranet-guard`: Guards por sección y rol (`b2b_subuser` vs `b2b_superadmin`); acceso condicionado a `permissions`.
- `storefront-b2b-portal-shell`: Sustituir scaffold `/intranet/mi-cuenta`; menú dinámico según permisos; badge/enlace aprobaciones pendientes para superadmin.
- `storefront-customer-auth`: Login/redirect subusuario; bloqueo `is_active=false`.
- `storefront-checkout-shipping`: Place-order bifurcado para subusuarios con aprobación requerida.
- `payload-order-collection`: Nuevo estado `pending_company_approval` y transiciones superadmin → `pending_confirmation`.
- `row-level-security`: Políticas lectura subusuarios de la misma empresa para superadmin.
- `core-tenant-tables`: Campos `display_name`, `is_active` en `web_profiles`.

## Impact

- `supabase/migrations/`: `web_profiles.display_name`, `is_active`; RLS superadmin list subusers; opcional índice `parent_customer_id`.
- `packages/database-types`: regenerar tipos; nuevo paquete o módulo `@jeyjo/b2b-permissions` en monorepo (opcional, puede vivir en storefront).
- `apps/storefront`: `lib/b2b/permissions.ts`, `app/(b2b)/intranet/mi-cuenta/**`, `app/api/intranet/subusers/**`, `app/api/intranet/order-approvals/**`, guards en rutas/APIs intranet, checkout `place-order`, login lockout desactivados.
- `apps/cms`: extender enum/validación `jeyjoStatus` con `pending_company_approval`; transiciones en `status-transitions.ts`.
- Depende de ROADMAP #16, #22 (completados); retroactivamente aplica gates a #23–#25 cuando estén implementados.
- Cumple **RF-003**, **US-12**; desbloquea uso seguro antes de #27 (RMA) y #37 (documental financiera).

## Non-Goals

- MFA obligatorio para subusuarios (RF-002: no MFA subusuarios v1).
- Permisos granulares por sub-sección de Contabilidad (facturas vs albaranes vs vencimientos) — un solo flag `finance` cubre todo el árbol Contabilidad hasta #37.
- Invitación por email / reset password automático — superadmin fija contraseña inicial v1; cambio de contraseña en perfil subusuario opcional post-v1.
- Creación de subusuarios desde Payload backoffice (solo superadmin intranet).
- Permisos en área B2C `/cuenta` (solo portal B2B).
- Notificaciones email al superadmin por pedido pendiente (#28).
- Área documental con PDFs (#37): guards financieros aplican a scaffolds Contabilidad ya existentes.

## Assumptions

- Un subusuario comparte el `customer_id` de la empresa para pricing, histórico y pedidos; se distingue por `web_profiles.id` en auditoría y aprobaciones.
- Superadmin (`b2b_superadmin`) tiene acceso total implícito; no gestiona sus propios permisos vía JSON.
- Desactivar subusuario (`is_active=false`) invalida sesiones en siguiente request; no borra `auth.users`.
- Pedidos históricos del subusuario desactivado permanecen visibles para superadmin y en agregación empresa.
