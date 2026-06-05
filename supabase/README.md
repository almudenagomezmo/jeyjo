# Supabase — esquema núcleo Jeyjo

Migraciones SQL versionadas para tablas transversales (`customers`, `web_profiles`, `search_events`, `audit_log`) y buckets Storage. Conviven en el **mismo Postgres** que Payload CMS (`DATABASE_URL`).

Requisitos cubiertos: **RNF-009** (RLS multi-tenant), **RD-001** (índices para cola de búsqueda).

## Requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Supabase CLI: `npx supabase` (o `npm i -g supabase`)

## Comandos (desde la raíz del monorepo)

### Supabase Cloud (tu caso habitual)

`DATABASE_URL` en `apps/cms/.env` debe apuntar al pooler del proyecto cloud. **No hace falta** `supabase start`.

```bash
pnpm db:push         # migraciones pendientes → proyecto enlazado (supabase link)
pnpm db:seed         # seed.sql (clientes, precios) vía DATABASE_URL
pnpm seed:catalog    # catálogo jeyjo.es → tablas Payload en el mismo Postgres
pnpm db:bootstrap    # db:seed + seed:catalog (arranque cloud)
```

Primera vez en un proyecto cloud vacío:

```bash
npx supabase login
npx supabase link --project-ref <tu-project-ref>
pnpm db:push         # crea tablas customers, search_events, etc.
pnpm db:bootstrap    # datos demo + catálogo
```

### Supabase local (Docker + CLI)

```bash
pnpm db:start           # supabase start (primera vez descarga imágenes)
pnpm db:reset           # migraciones + seed.sql en local
pnpm db:bootstrap:local # db:reset + seed:catalog
```

```bash
pnpm db:types      # regenerar packages/database-types/src/database.types.ts
```

## Enlazar proyecto remoto

```bash
npx supabase login
npx supabase link --project-ref <tu-project-ref>
pnpm db:push   # aplica migraciones de supabase/migrations/ al cloud
```

Variables típicas (ver `.env.example` de cada app):

| Variable | Uso |
|----------|-----|
| `DATABASE_URL` | Payload + pooler Supabase (session mode) |
| `NEXT_PUBLIC_SUPABASE_URL` | Storefront Auth / client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente público |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo servidor (workers, hooks); nunca en el navegador |

Local tras `supabase start`: API `http://127.0.0.1:54321`, Postgres `postgresql://postgres:postgres@127.0.0.1:54322/postgres`.

## Auth: emails de confirmación (Resend SMTP)

El registro en el storefront (`/registro`) llama a `signUp()` de Supabase Auth, que envía el correo de confirmación **desde el dashboard de Supabase**, no desde el CMS.

En **Supabase Dashboard → Authentication → SMTP Settings**:

| Campo | Valor |
|-------|-------|
| Enable custom SMTP | Sí |
| Host | `smtp.resend.com` |
| Port | `587` (TLS) o `465` (SSL) |
| Username | `resend` |
| Password | API key de Resend (`re_…`) |
| Sender email | Dirección de un **dominio verificado** en Resend |

El remitente debe usar un dominio verificado en [Resend → Domains](https://resend.com/domains). Si `noreply@jeyjo.com` falla con *"Error sending confirmation email"*, Resend está rechazando el envío porque `jeyjo.com` aún no está verificado (añade los registros DNS que indica Resend).

**Desarrollo rápido (sin SMTP):** Authentication → Providers → Email → desactivar **Confirm email**. Los usuarios podrán iniciar sesión sin abrir el enlace del correo.

**Site URL / Redirect URLs:** `http://localhost:3000` (y la URL de producción cuando exista).

## Migraciones

| Archivo | Contenido |
|---------|-----------|
| `20250604120000_extensions_enums.sql` | `pgcrypto`, enums |
| `20250604120001_core_tenant_tables.sql` | `customers`, `web_profiles` |
| `20250604120002_search_events_audit_log.sql` | Cola RF-009, audit log |
| `20250604120003_row_level_security.sql` | RLS + `current_customer_id()` |
| `20250604120004_storage_buckets.sql` | `catalog-media`, `private-documents` |
| `20250604140000_b2b_subusers_permissions.sql` | `display_name`, `is_active`, RLS subusers, `create_b2b_subuser` RPC |

Nueva migración: `npx supabase migration new <nombre>`.

## Subusuarios B2B (RF-003, cambio #26)

Tras migrar, el superadmin B2B gestiona subusuarios en `/intranet/mi-cuenta`. Para prueba local:

1. Autenticarse como `b2b-demo@jeyjo.local` (superadmin, ver seed).
2. En **Mi cuenta → Nuevo subusuario**, crear p. ej. `compras@empresa.local` con permisos solo **Pedidos** (sin finanzas).
3. Cerrar sesión e iniciar con el subusuario: el menú **Contabilidad** no aparece y `/intranet/contabilidad/facturas` redirige al dashboard con aviso.
4. Opcional: marcar **Pedidos requieren aprobación** y completar checkout B2B → el pedido queda en `pending_company_approval` hasta que el superadmin lo apruebe en Mi cuenta.

Variable opcional en storefront: `B2B_PERMISSIONS_ENABLED=false` desactiva guards de permisos (rollback).

## Seed y prueba manual de RLS

`seed.sql` inserta dos empresas con UUID fijos:

- B2B: `a0000001-0000-4000-8000-000000000001` — `b2b-demo@jeyjo.local`
- B2C: `a0000002-0000-4000-8000-000000000002` — `b2c-demo@jeyjo.local`

**Probar aislamiento (RNF-009):**

1. En Supabase Studio → Authentication, crea dos usuarios con esos emails.
2. Inserta `web_profiles` enlazando cada `auth.users.id` a su `customer_id` (ver comentarios en `seed.sql`).
3. Con el cliente JS o SQL como `authenticated` (JWT de usuario A), ejecuta:
   ```sql
   SELECT * FROM public.customers;
   ```
4. **Resultado esperado:** solo la fila de la empresa de A; nunca la de B.

## Coexistencia con Payload

Payload crea sus propias tablas (`users`, `pages`, `products`, …) en el **mismo Postgres** (`DATABASE_URL`). Este esquema **no** usa esos nombres. Aplicar migraciones Jeyjo **antes** de `payload migrate` / arranque en un entorno nuevo.

### Catálogo en Supabase

| Dato | Tablas | Cómo se siembra |
|------|--------|-----------------|
| Clientes, precios especiales | `customers`, `special_prices`, `group_offers` | `seed.sql` (automático en `db:reset`) |
| Productos, categorías, proveedores | `products`, `categories`, `suppliers` (Payload) | `pnpm seed:catalog` |

El storefront lee el catálogo vía API Payload (`GET /api/products`, `GET /api/categories`), que consulta esas tablas en Supabase Postgres.

**Flujo cloud recomendado:**

```bash
pnpm db:bootstrap   # seed.sql + catálogo jeyjo.es (usa DATABASE_URL de apps/cms/.env)
pnpm dev:cms        # admin en :3001
pnpm dev:storefront # tienda en :3000
```

**Flujo local** (con `supabase start`): `pnpm db:bootstrap:local` en lugar de `db:bootstrap`.

## Buckets Storage

- `catalog-media` — lectura pública; subidas vía CMS con `SUPABASE_BUCKET=catalog-media`
- `private-documents` — solo `service_role`; PDFs de facturas/albaranes/347/presupuestos ERP cacheados on-demand en `{customer_id}/{document_type}/{document_id}.pdf` (cambio #37). El storefront sube vía service role y sirve descargas autenticadas B2B con permiso `finance`.
