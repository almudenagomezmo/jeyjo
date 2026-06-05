## Context

- **Estado actual:** `#16` creó auth con roles `b2b_superadmin` / `b2b_subuser` en enum y columna `permissions jsonb` en `web_profiles`, pero sin UI ni enforcement. `#22` expone menú US-07 completo a todo B2B validado; `/intranet/mi-cuenta` es scaffold apuntando a #26. `#23–#25` documentaron que todos los B2B ven histórico, pedido rápido y tarifas sin filtro. `getCustomerContext()` no expone `permissions` ni `is_active`. Guards (`requireB2bApiSession`) solo comprueban B2B validado.
- **Requisito crítico:** **RF-003** — subusuario sin permiso financiero no accede a facturas por URL directa. **US-12** — CRUD subusuarios, flags por sección y aprobación opcional de pedidos.
- **Dependencias completadas:** #16 auth, #22 portal, #17 checkout, #20 OMS (estados pedido).

## Goals / Non-Goals

**Goals:**

- Modelo de permisos tipado y centralizado reutilizable en páginas, layout y APIs intranet.
- UI superadmin en `/intranet/mi-cuenta` para alta/edición/desactivación de subusuarios.
- Enforcement server-side (no solo ocultar menú) en rutas Contabilidad, pedidos, mi-cuenta y APIs asociadas.
- Flujo `pending_company_approval` para subusuarios con `ordersRequireApproval`.
- RLS: superadmin lista subordinados; subusuario no escala privilegios.

**Non-Goals:**

- MFA subusuarios, invitación email, permisos por sub-sección Contabilidad, gestión desde Payload, notificaciones (#28).

## Decisions

### 1. Esquema `permissions` en `web_profiles`

**Decisión:** JSON tipado en TypeScript (`B2bPermissions`):

```ts
{
  finance: boolean      // /intranet/contabilidad/*
  orders: boolean       // /intranet/pedidos, /intranet/pedido-rapido, checkout B2B
  account: boolean      // /intranet/mi-cuenta (datos empresa; subusuarios solo lectura parcial)
  ordersRequireApproval: boolean  // solo meaningful para b2b_subuser
}
```

Defaults subusuario nuevo: `{ finance: false, orders: true, account: false, ordersRequireApproval: false }`.

`b2b_superadmin`: permisos implícitos full; `permissions` ignorado en runtime.

**Alternativa descartada:** Tabla `subuser_permissions` normalizada — overkill para 4 flags.

### 2. Identidad tenant subusuario

**Decisión:** Subusuario comparte `customer_id` de la empresa (mismo pricing/histórico). `parent_customer_id` = `customer_id` (redundante pero alinea spec #2). Distinción por `web_profiles.id` en `submittedByUserId` del pedido. Campo nuevo `display_name` en profile para US-12 CA1.

**Alternativa descartada:** Fila `customers` hija por subusuario — complica pricing y validación CIF.

### 3. Migración Supabase

**Decisión:** Nueva migración:

- `web_profiles.display_name text`
- `web_profiles.is_active boolean NOT NULL DEFAULT true`
- Índice parcial `web_profiles_company_subusers_idx ON (customer_id) WHERE role = 'b2b_subuser'`
- RLS: policy `web_profiles_select_company_subusers` — superadmin (`role = b2b_superadmin` AND same `customer_id`) puede `SELECT` filas `b2b_subuser` de su empresa
- RPC `create_b2b_subuser` (security definer) invocada solo vía service role desde API storefront — evita insert directo desde JWT

**Alternativa descartada:** Client-side Supabase signUp sin RPC — expone service patterns.

### 4. Módulo `lib/b2b/permissions.ts`

**Decisión:** Funciones puras:

| Función | Uso |
|---------|-----|
| `resolveEffectivePermissions(ctx)` | Superadmin → all true; subuser → parse JSON + defaults |
| `canAccessSection(ctx, 'finance' \| 'orders' \| 'account')` | Guards |
| `filterIntranetNav(items, perms)` | Sidebar |
| `requireB2bSection(ctx, section)` | Server pages — redirect `/intranet?forbidden=<section>` |

Mapeo ruta → sección:

| Prefijo | Sección |
|---------|---------|
| `/intranet/contabilidad` | `finance` |
| `/intranet/pedidos`, `/intranet/pedido-rapido` | `orders` |
| `/intranet/mi-cuenta` | `account` (superadmin: gestión; subuser con flag: vista limitada) |
| `/intranet/precios`, `/intranet/rma`, `/intranet/stock`, `/intranet/descargas`, `/intranet/contacto` | `orders` (operaciones comerciales v1) |

**Alternativa descartada:** Middleware único con regex largo — layout intranet ya tiene `getCustomerContext`.

### 5. Extender `CustomerContext` y guards API

**Decisión:** Añadir a `CustomerContext`: `displayName`, `permissions`, `isActive`, `parentCustomerId`. `requireB2bApiSession({ section?: 'finance'|'orders'|'account' })` valida permiso tras B2B check. Actualizar APIs existentes: `purchase-history`, `quick-order/*`, `custom-tariffs/*` con `section: 'orders'` o `'finance'` según corresponda.

### 6. APIs subusuarios

**Decisión:**

- `GET /api/intranet/subusers` — superadmin only; lista subusers de `customer_id` con permisos y `is_active`
- `POST /api/intranet/subusers` — body `{ displayName, email, password, permissions }`; Supabase Admin `createUser` + insert profile vía RPC
- `PATCH /api/intranet/subusers/:id` — permisos, `is_active`, reset password opcional; no permitir target superadmin
- `requireB2bSuperadmin()` guard compartido

### 7. UI `/intranet/mi-cuenta`

**Decisión:** Dos modos:

1. **Superadmin:** tabs "Datos empresa" (readonly fiscal) + "Usuarios" (tabla subusers, modal create/edit con toggles CA2 + checkbox aprobación CA3).
2. **Subuser con `account`:** vista readonly empresa (nombre, CIF) sin pestaña usuarios.

Patrones UI: formularios jeyjo-next, tokens `globals.css`, componentes `IntranetPageHeader`.

### 8. Estado pedido `pending_company_approval`

**Decisión:** Nuevo `jeyjoStatus` en Payload Orders. Campos opcionales: `submittedByUserId` (uuid), `submittedByEmail` (denormalized).

Transiciones:

| From | To | Actor |
|------|-----|-------|
| (create) | `pending_company_approval` | Subuser checkout cuando `ordersRequireApproval` |
| (create) | `pending_confirmation` | Superadmin/subuser sin approval (actual B2B) |
| `pending_company_approval` | `pending_confirmation` | Superadmin approve API |
| `pending_company_approval` | `cancelled` | Superadmin reject API |

Staff OMS no ve pedido hasta `pending_confirmation` (filtro inbox default). Superadmin ve cola en `/intranet/mi-cuenta` o widget dashboard "Pedidos por aprobar (N)".

**Alternativa descartada:** Flag booleano sin nuevo status — OMS no distinguiría pedidos no enviados a Jeyjo.

### 9. APIs aprobación

**Decisión:**

- `GET /api/intranet/order-approvals` — superadmin; pedidos `pending_company_approval` para `customerRef`
- `POST /api/intranet/order-approvals/:orderId/approve` → PATCH Payload `jeyjoStatus=pending_confirmation`
- `POST /api/intranet/order-approvals/:orderId/reject` → `cancelled` + optional reason

Storefront API key allowed for PATCH con nuevo transition en `STOREFRONT_STATUS_TRANSITIONS` solo para esas rutas.

### 10. Login desactivados

**Decisión:** Tras `signInWithPassword` exitoso, `getCustomerContext` comprueba `is_active`; si false → signOut + mensaje "Cuenta desactivada". Lockout existente no aplica a desactivación administrativa.

## Risks / Trade-offs

- **[Menú oculto pero URL directa]** Mitigation: guard en layout `(b2b)/intranet` hijos + API 403; test RF-003 facturas.
- **[Superadmin borra último superadmin]** Mitigation: no permitir auto-desactivación ni promoción vía API v1.
- **[Pedidos atascados en pending_company_approval]** Mitigation: listado superadmin + badge dashboard; staff OMS ignoran hasta approve.
- **[RLS compleja]** Mitigation: lectura subusers solo superadmin; mutaciones vía service role API.
- **[Precios/tarifas sin permiso orders]** v1 agrupa precios con orders — coherente con RF-003 "sección pedidos".

## Migration Plan

1. Migración Supabase + regenerar `database-types`.
2. Implementar `lib/b2b/permissions.ts` y extender `CustomerContext`.
3. CMS: enum status + transitions + campo `submittedByUserId`.
4. APIs subusers + order-approvals; actualizar guards APIs intranet.
5. UI mi-cuenta + nav filter + layout guards.
6. Checkout branch approval; tests.
7. Rollback: feature flag `B2B_PERMISSIONS_ENABLED=false` bypass guards (env); restaurar scaffold mi-cuenta.

## Open Questions

- ¿Subuser con `account` puede editar su propio `display_name`? **Default: sí, en perfil mínimo post-v1; v1 solo superadmin edita.**
- ¿Precios especiales requieren permiso `orders` o propio? **Default: `orders` (comercial).**
- ¿RMA/stock en v1? **Default: gated by `orders` hasta specs #27/#28.**
