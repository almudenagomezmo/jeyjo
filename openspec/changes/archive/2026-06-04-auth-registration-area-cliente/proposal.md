## Why

El storefront (#9–#11) ya expone `/cuenta` como placeholder, precios B2B vía toggle manual en cabecera y carrito local sin sesión (#12). El ROADMAP marca #16 como prerequisito de checkout (#17), portal B2B (#22), precios por sesión real y sincronización de carrito autenticado. Sin **RF-001** (login y detección de grupo), **RF-004** (registro con validación) y un área cliente B2C mínima, no se cumplen **CA-AUTH-001–003** ni se desbloquea **US-07** (redirección intranet) ni el checkout registrado (**US-04**).

## What Changes

- **Supabase Auth en storefront:** cliente SSR (`@supabase/ssr`), rutas `/login`, `/registro`, callback y middleware que refresca sesión; helpers `getSession` / `requireAuth` en Server Components y Route Handlers.
- **Login RF-001:** formulario email/contraseña; tras éxito, lectura de `customers.customer_group` vía `web_profiles`; redirección B2C → `/cuenta` (dashboard), B2B (grupos 02–04) → `/intranet` (shell placeholder alineado a US-07 CA1); bloqueo de B2C en rutas `/intranet/*` (CA-AUTH-003).
- **Registro RF-004:** formulario con nombre/razón social, email, CIF/NIF (obligatorio si empresa), dirección, teléfono; creación `auth.users` + `customers` (`customer_group=1`, `validated_at` NULL) + `web_profiles` (`role=pending`); email de confirmación Supabase; mensaje “pendiente de validación” en área cliente.
- **Bandeja validación (mínima v1):** vista/listado en Payload o endpoint interno para staff: clientes con `validated_at` IS NULL; acción validar asigna `customer_group`, `validated_at`, actualiza `web_profiles.role` (`b2c` o `b2b_superadmin`) y audit_log.
- **Área cliente B2C:** sustituir placeholder `/cuenta` por layout con navegación lateral (perfil, pedidos placeholder, direcciones placeholder); cabecera muestra nombre comercial tras login (CA-AUTH-001).
- **Seguridad RNF-011:** bloqueo tras 5 intentos fallidos durante 15 minutos (CA-AUTH-004) — tabla o campos en `web_profiles` / Supabase Auth hooks según diseño.
- **Precios por sesión:** `PriceModeToggle` y APIs `/api/pricing/*` derivan segmento de sesión autenticada (B2B validado) en lugar de solo cookie manual; visitante anónimo y `pending` mantienen B2C.
- **MFA B2B opcional (RF-002):** banner de recomendación en perfil si `mfa_enabled=false`; flujo TOTP de activación para superadmin B2B sin bloquear login (CA-AUTH-005 escenario cliente). MFA backoffice Payload ya cubierto en #5.

## Capabilities

### New Capabilities

- `storefront-customer-auth`: Login, logout, registro, sesión Supabase SSR, bloqueo por intentos, redirección por `customer_group`, guards de ruta.
- `storefront-customer-account`: Área cliente B2C (`/cuenta` y subrutas) con layout, perfil resumen y estados pendiente/validado.
- `storefront-b2b-intranet-guard`: Shell `/intranet` placeholder, menú esqueleto US-07, protección de rutas y redirección post-login B2B.
- `cms-customer-validation-queue`: Bandeja staff para validar registros pendientes (RF-004) con audit_log.

### Modified Capabilities

- `storefront-shell-navigation`: Enlace cuenta según sesión (login vs nombre); integración sesión con badge y rutas protegidas.
- `storefront-price-resolution`: Resolución de precios y etiqueta cabecera basadas en sesión autenticada además del toggle manual para anónimos.
- `core-tenant-tables`: Requisitos de columnas/dirección de registro y políticas RLS para insert propio en registro (si aplica delta).

## Impact

- `apps/storefront`: middleware, `lib/supabase/`, rutas `(account)/login`, `registro`, `cuenta/**`, `(b2b)/intranet/**`, componentes auth, actualización `Header`, pricing session.
- `apps/cms`: colección o vista `customers` / custom endpoint validación; hooks audit_log.
- `supabase`: posible migración (login attempts, dirección en `customers` o tabla `customer_addresses`); RLS policies registro; seed auth users documentado.
- Paquetes: `@supabase/ssr`, `@supabase/supabase-js`; variables en `.env.example`.
- Desbloquea ROADMAP #17, #22, #26, #35; depende de #2 y #3 (completados).

## Non-Goals

- Checkout completo, Redsys, cupones (#17–#18).
- Portal B2B funcional (histórico, pedido rápido, tarifas, RMA) — solo shell + guards (#22).
- Subusuarios y permisos granulares RF-003 (#26).
- Sincronización alta/baja de clientes con Avansuite (RI-001, #36); `erp_code` nullable en registro.
- Carrito servidor / merge al login (#12 extensión en tarea separada o follow-up explícito en tasks).
- MFA obligatorio superadmin B2B (solo recomendación + activación opcional en este cambio).
- OAuth social, recuperación contraseña custom más allá del flujo email Supabase estándar.
- Área documental financiera (#37).
