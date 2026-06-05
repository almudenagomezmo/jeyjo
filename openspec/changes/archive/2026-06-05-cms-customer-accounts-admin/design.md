## Context

- **Estado actual:** Change #16 entregó registro storefront (`customers` + `web_profiles` en Supabase), vista custom `/admin/pending-customers`, endpoint `GET /api/pending-customers`, y `POST /next/customers/:id/validate` con MFA staff, grupos 1–4 en API, y `audit_log`. La UI solo expone botones B2C (1) y B2B (2). No hay email al aprobar; Supabase Auth envía confirmación de dirección al registrarse.
- **Arquitectura:** `public.customers` y `web_profiles` viven en Supabase (mismo Postgres que Payload). Pedidos/presupuestos Payload usan `customerRef` (UUID). Plugin ecommerce mapea `customers.slug = users` (staff/guest checkout) — distinto de clientes tienda.
- **Decisión exploración:** Opción D (híbrido): vista staff + endpoints Supabase; **no** colección Payload sobre `public.customers` (precedente newsletter-subscription, `core-tenant-tables`).
- **Taxonomía grupos (Dirección Jeyjo):** 1 B2C; 2 B2B empresa; 3 colegios/institutos (catálogo escolar temporal); 4 concursos públicos (revistas/flyers temporales). Grupos 2–4 comparten intranet `/intranet` y rol `b2b_superadmin`; la diferencia es comercial/pricing/catálogo.

## Goals / Non-Goals

**Goals:**

- Vista admin **Clientes** en `/admin/customers` con listado completo Supabase, filtro default pendientes, filtros estado/grupo/búsqueda.
- Ficha solo lectura: datos `customers` + `web_profiles` (role, is_active, last_login_at, email confirmado).
- Validar con selector 01–04 y etiquetas de negocio; bloquear si email Auth no confirmado.
- Email transaccional obligatorio al validar (Payload `sendEmail`, Resend/Mailpit).
- Reutilizar validate route + audit; acceso `superadmin`/`administracion` + MFA.
- Redirect legacy `/admin/pending-customers`.

**Non-Goals:**

- Colección Payload CRUD sobre `public.customers` o tabla espejo.
- Edición de CIF, dirección, `erp_code` u otros campos (solo validar en v1).
- Validar sin email Supabase confirmado.
- Cambio de `customer_group` post-validación (follow-up `cms-customer-group-reassignment`).
- Caducidad automática grupos 3–4 al fin de campaña.
- Sync/vinculación ERP por CIF (RI-001, TBD).
- Baja masiva o desactivación de cuentas.

## Decisions

### 1. Patrón admin: vista custom + endpoints (no colección Payload)

**Decisión:** Evolucionar `PendingCustomersView` → `CustomersAdminView`; generalizar `pending-customers` endpoint a `customers-admin` con `GET` listado y `GET /:id` detalle. Patrón idéntico a `NewsletterSubscribersView` + `newsletter.ts`.

**Alternativa descartada:** Colección Payload mapeada a `customers` — riesgo `postgresAdapter` push, columnas Payload, conflicto con RLS/triggers (`apps/cms/docs/supabase.md`).

### 2. Fuente de datos y perfiles

**Decisión:** Lecturas vía `getSupabaseServerClient()` (`service_role`). Detalle hace `select` en `customers` + join `web_profiles` por `customer_id`. Estado email confirmado: `admin.auth.admin.getUserById(web_profiles.id)` o consulta `auth.users` vía admin API.

**Alternativa descartada:** Duplicar campos de `web_profiles` en UI Payload fields.

### 3. Validación: reutilizar route existente

**Decisión:** Mantener `POST /next/customers/:id/validate` como acción canónica. Extraer lógica a `lib/customers/validate-customer.ts` para testear. Añadir:

1. Comprobar `email_confirmed_at` (o equivalente) antes de actualizar.
2. Tras éxito, llamar `sendCustomerApprovalEmail()`.

**Alternativa descartada:** Hook `afterChange` Payload — no hay colección.

### 4. Mapeo grupo → rol (sin cambio)

| `customer_group` | `web_profiles.role` | Portal post-login |
|------------------|---------------------|-------------------|
| 1 | `b2c` | `/cuenta` |
| 2–4 | `b2b_superadmin` | `/intranet` |

Etiquetas UI admin:

| Grupo | Etiqueta |
|-------|----------|
| 1 | B2C — Particular |
| 2 | B2B — Empresa |
| 3 | B2B — Colegio / instituto |
| 4 | B2B — Concurso público |

### 5. Emails: dos momentos distintos

**Decisión:**

| Momento | Sistema | Propósito |
|---------|---------|-----------|
| Registro | Supabase Auth | Verificar dirección de email |
| Aprobación staff | CMS `payload.sendEmail` | Cuenta validada por Jeyjo |

Plantillas en `apps/cms/src/lib/customers/emails/approval.ts`:

- **B2C (grupo 1):** asunto tipo «Tu cuenta Jeyjo ha sido validada»; enlace `/cuenta`; CIF si `is_company`.
- **B2B (grupos 2–4):** asunto similar; enlace `/intranet`; CIF; texto según grupo (empresa / centro educativo / concurso público).

Fallo de email **no revierte** validación (patrón `b2b-proactive-notification-emails`); log error.

### 6. Acceso y navegación

**Decisión:** Roles `superadmin` y `administracion` vía `canValidateCustomers`; MFA obligatorio en endpoints y validate route. Vista registrada en `payload.config.ts` como `customersAdmin` path `/customers`. Alerta dashboard → `/admin/customers?status=pending`. Redirect 308 `/admin/pending-customers` → nueva ruta.

**Alternativa descartada:** Entrada en sidebar de colecciones Payload — las custom views no son colecciones; enlace desde alerta + hub administración si se añade card en futuro.

### 7. API contrato

```
GET  /api/customers-admin?status=pending|validated|all&group=1..4&search=&page=&limit=
GET  /api/customers-admin/:id
POST /next/customers/:id/validate  { customerGroup: 1..4 }
```

`status=pending` → `validated_at IS NULL`; `validated` → NOT NULL; default query sin param = pending.

## Risks / Trade-offs

- **[Risk] Staff valida sin verificar email** → Mitigation: API 409/422 + UI deshabilita botón con tooltip.
- **[Risk] Email aprobación falla tras validar** → Mitigation: log + staff ve estado validado; reenvío manual fuera de v1.
- **[Risk] Confusión `users` Payload vs clientes tienda** → Mitigation: título UI «Clientes tienda» / «Cuentas storefront».
- **[Risk] Grupos 3–4 asignados incorrectamente** → Mitigation: etiquetas + hint en modal; sin auto-caducidad en v1.
- **[Trade-off] Sin edición post-validación** → Administración debe usar follow-up para reclasificar grupo.
- **[Trade-off] Listado sin FK Payload** → `customerRef` en pedidos sigue siendo UUID string hasta enlace formal.

## Migration Plan

1. Desplegar endpoints + vista nueva en CMS.
2. Añadir redirect `/admin/pending-customers`.
3. Actualizar alerta dashboard href.
4. Smoke: registro → confirm email → validar cada grupo → comprobar email Mailpit → login redirect correcto.

**Rollback:** Restaurar vista pendientes anterior; validate route sin email gate opcional vía flag env si necesario.

## Open Questions

- **Ciclo de vida grupos 3–4:** ¿Reclasificar, desactivar o mantener grupo al fin de campaña? → follow-up de negocio.
- **Vinculación ERP CIF existente (RI-001):** pendiente Dirección.
- **Reenvío manual email aprobación:** ¿necesario en v1.1 si falla SMTP?
