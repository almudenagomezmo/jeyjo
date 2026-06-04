## Context

- **Estado actual:** `#2` entregó `customers`, `web_profiles`, RLS y `current_customer_id()`. `#5` cubre MFA staff Payload. El storefront tiene route group `(account)` con `/cuenta` placeholder, `Header` enlaza a `/cuenta` sin sesión, `PriceModeToggle` usa cookie/UI manual, y pricing APIs aceptan `customerId` opcional pero no hay cliente Supabase Auth ni middleware. Seed documenta creación manual de `auth.users` + `web_profiles`.
- **Alcance:** **RF-001**, **RF-004**, **US-07** (CA1, CA3–CA5 parcial), **CA-AUTH-001–004**, banner MFA opcional B2B (CA-AUTH-005 escenario cliente). Criterios de aceptación usan rutas `/mi-cuenta` e `/intranet/dashboard` — se mapean a `/cuenta` y `/intranet` en implementación v1 salvo decisión explícita de alias.
- **Dependencias:** `#2` (schema), `#3` (Payload bootstrap). Bloquea `#17`, `#22`, `#26`.

## Goals / Non-Goals

**Goals:**

- Sesión Supabase Auth en Next.js 15 App Router con `@supabase/ssr` (cookies, middleware refresh).
- Flujos login/registro/logout con escritura transaccional `customers` + `web_profiles` vía Route Handler con `service_role` tras `signUp` (RLS no permite insert cruzado desde anon).
- Redirección post-login por `customer_group` (1 → B2C, 2–4 → B2B) y guards en middleware para `/cuenta` (auth required) y `/intranet` (solo B2B validado).
- Área cliente B2C con layout lateral y estados `pending` / validado.
- Shell `/intranet` placeholder con menú US-07 y cabecera empresa (nombre + CIF).
- Bandeja Payload “Clientes pendientes” + acción validar con audit_log.
- Bloqueo 5 intentos / 15 min (CA-AUTH-004).
- Pricing y cabecera leen segmento desde sesión (`getCustomerContext()`).

**Non-Goals:**

- Checkout, carrito servidor, portal B2B funcional (#17, #22, #26).
- Sync ERP clientes (RI-001).
- MFA TOTP obligatorio B2B; solo banner + hook futuro.
- Subusuarios RF-003.
- OAuth providers.

## Decisions

### 1. Supabase SSR y middleware

**Decisión:** `middleware.ts` en `apps/storefront` crea cliente Supabase, refresca sesión en cada request y aplica matchers: `/cuenta/:path*`, `/intranet/:path*`, `/login`, `/registro`. Helpers en `lib/supabase/server.ts` y `lib/supabase/client.ts`.

**Alternativa descartada:** Solo client-side auth — no protege RSC ni Route Handlers.

### 2. Registro: service role en servidor

**Decisión:** `POST /api/auth/register` valida body (zod), llama `supabase.auth.signUp` con anon key desde servidor, luego inserta `customers` + `web_profiles` con admin client (`SUPABASE_SERVICE_ROLE_KEY`) en la misma transacción lógica (rollback manual si falla profile).

**Alternativa:** RPC SECURITY DEFINER en Postgres — válida pero más difícil de auditar en v1; pospuesto.

**Campos:** migración añade `billing_address_line1`, `billing_city`, `billing_postal_code`, `billing_country` (default `ES`) en `customers` para RF-004.

### 3. Mapeo grupo y rol

**Decisión:**

| `customer_group` | Tras validación `web_profiles.role` | Redirect login |
|------------------|-------------------------------------|----------------|
| 1 | `b2c` | `/cuenta` |
| 2–4 | `b2b_superadmin` | `/intranet` |
| Cualquiera, `validated_at` NULL | `pending` | `/cuenta` (banner pendiente) |

B2B con `validated_at` NULL se trata como B2C en pricing (grupo forzado 1 en motor) hasta validación staff.

### 4. Rutas públicas vs protegidas

**Decisión:** `/login`, `/registro` públicos; redirect si ya autenticado. `/cuenta/**` requiere sesión. `/intranet/**` requiere sesión + `customer_group IN (2,3,4)` + `validated_at NOT NULL`; B2C recibe redirect `/cuenta?error=forbidden` (CA-AUTH-003).

**Alias:** redirect 308 `/mi-cuenta` → `/cuenta` para alinear CA-AUTH-001 sin duplicar árbol.

### 5. Bloqueo de intentos (CA-AUTH-004)

**Decisión:** columnas `failed_login_count`, `locked_until` en `web_profiles`; incremento en Route Handler `POST /api/auth/login` ante credenciales inválidas; reset en login exitoso. No depender de Supabase built-in rate limit solo (insuficiente para mensaje UX exacto).

**Alternativa:** Tabla `auth_login_attempts` — más normalizada; aceptable en v2 si crece complejidad.

### 6. Bandeja validación CMS

**Decisión:** Global Payload collection `customerAccounts` (read-only mirror de campos clave) **o** custom admin view sobre SQL — preferencia v1: **endpoint** `POST /api/cms/customers/validate` protegido por Payload staff session + list view hook filtrando `validated_at IS NULL` vía `payload.find` en tabla SQL con adapter postgres directo.

Pragmático v1: **Custom Payload collection** `pending-customers` no — usar **Global** no. Mejor: extender acceso staff a vista en Payload plugin que ejecuta query Supabase con `service_role` en hook server-only.

**Implementación elegida:** Ruta interna Next en `apps/cms` `POST /next/customers/:id/validate` (patrón sync #7) con guard admin + body `{ customerGroup }`; actualiza Supabase y escribe `audit_log`.

### 7. Pricing session

**Decisión:** `getCustomerContext()` en servidor lee sesión → `customer_id`, `customer_group`, `validated_at`, `role`. APIs pricing pasan `customerId` solo si `validated_at` y grupo B2B; si no, anónimo/P1. `PriceModeToggle` oculto o read-only para B2B autenticado; anónimos mantienen toggle manual.

### 8. UI y tokens

**Decisión:** Formularios auth con `Input`, `Button`, `Card` existentes; páginas en `(account)` sin nuevo hex. Layout cuenta: sidebar + `Container` según prototipo jeyjo-next sección cuenta.

### 9. Email y confirmación

**Decisión:** Supabase Auth email confirm habilitado en proyecto; redirect URL a `/login?confirmed=1`. Plantillas custom en cambio posterior (#28).

## Risks / Trade-offs

- **[Risk] Registro parcial (auth user sin profile)** → Mitigation: handler idempotente + job cleanup; log estructurado; test e2e registro feliz.
- **[Risk] Service role en Route Handler** → Mitigation: solo en server routes; nunca en bundle cliente; validar origen y rate limit registro.
- **[Risk] Desalineación rutas CA (`/mi-cuenta`)** → Mitigation: redirects documentados en tasks y specs.
- **[Risk] B2B validado manualmente tarde** → Mitigation: UX claro “compras como particular hasta validación”; pricing forzado P1.
- **[Trade-off] Intranet placeholder** → Menú visible pero enlaces “Próximamente” hasta #22; cumple US-07 CA2 esqueleto sin datos ERP.

## Migration Plan

1. Aplicar migración Supabase (dirección + login lock columns).
2. Desplegar CMS endpoint validación (staff only).
3. Desplegar storefront con env `NEXT_PUBLIC_SUPABASE_*` y `SUPABASE_SERVICE_ROLE_KEY` en Vercel server.
4. Crear usuarios seed en Supabase Studio; enlazar `web_profiles`.
5. Smoke: CA-AUTH-001–004 en staging.

**Rollback:** Desactivar middleware matcher auth; revertir a placeholder `/cuenta`; bandeja CMS inactiva sin afectar catálogo.

## Open Questions

- ¿Alias permanente `/mi-cuenta` además de redirect? (recomendado: sí, redirect).
- ¿Confirmación email obligatoria antes de primer login en staging? (config Supabase por entorno).
- Dirección de envío separada de facturación en registro — v1 solo billing en `customers`; shipping en #17.
