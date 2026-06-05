## Why

Tras la validación inicial (#48 `cms-customer-accounts-admin`), el staff no puede corregir errores de clasificación: un cliente validado como B2C que debía ser B2B, un `web_profiles.role` desincronizado respecto a `customer_group`, o un cambio entre grupos B2B (empresa ↔ colegio ↔ concurso). Hoy solo existe la acción **Validar** en pendientes; el ROADMAP deja explícito el gap *cambio de grupo post-validación*. Sin reclasificación desde CMS, administración debe tocar Supabase a mano, lo que rompe auditoría y provoca clientes sin acceso a intranet o contabilidad.

## What Changes

- Nueva acción **Reclasificar** en la ficha de cliente de `/admin/customers` para clientes **ya validados** (`validated_at` NOT NULL).
- Staff con roles Payload `superadmin` o `administracion` y sesión MFA válida (mismos requisitos que validar) podrá:
  - Cambiar `customers.customer_group` (1–4).
  - Cambiar `web_profiles.role` por perfil vinculado (`b2c`, `b2b_superadmin`, `b2b_subuser`, `pending`).
- Nuevo endpoint staff `PATCH /next/customers/:id/reclassify` con validación server-side de combinaciones grupo/rol y auditoría en `audit_log`.
- UI: modal de confirmación con impacto (intranet, precios, documentos) antes de guardar.
- La acción **Validar** en pendientes permanece sin cambios (sigue siendo el único camino para fijar `validated_at` inicial).
- **Non-goals v1:** editar `permissions.finance` de subusuarios; crear/eliminar subusuarios; sync ERP / `erp_code`; email automático al reclasificar (silencioso, como corrección administrativa); caducidad automática grupos 3–4.

## Capabilities

### New Capabilities

- (ninguna — el comportamiento extiende la capacidad CMS existente)

### Modified Capabilities

- `cms-customer-validation-queue`: ampliar con requisito de reclasificación post-validación (grupo + rol), acceso staff idéntico a validar, auditoría y restricción a clientes ya validados.

## Impact

- **CMS:** `CustomersAdminView/Client.tsx`, nuevo servicio `reclassify-customer.ts`, ruta `next/customers/[id]/reclassify`, reutilización/ampliación de `canValidateCustomers` → `canManageCustomers`.
- **Supabase:** updates en `customers.customer_group` y `web_profiles.role` (sin tocar `validated_at` salvo que no exista — solo vía Validar).
- **Storefront:** sin cambios de código; efecto indirecto en `isB2bValidated()`, redirect post-login e intranet guards al corregir grupo/rol.
- **Specs:** delta en `cms-customer-validation-queue`; referencia RF-004 (gestión cuentas cliente) y gap ROADMAP post-#48.
