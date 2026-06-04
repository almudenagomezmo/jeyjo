# Supabase — esquema núcleo Jeyjo

Migraciones SQL versionadas para tablas transversales (`customers`, `web_profiles`, `search_events`, `audit_log`) y buckets Storage. Conviven en el **mismo Postgres** que Payload CMS (`DATABASE_URL`).

Requisitos cubiertos: **RNF-009** (RLS multi-tenant), **RD-001** (índices para cola de búsqueda).

## Requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Supabase CLI: `npx supabase` (o `npm i -g supabase`)

## Comandos (desde la raíz del monorepo)

```bash
pnpm db:start      # supabase start (primera vez descarga imágenes)
pnpm db:reset      # aplicar migraciones + seed.sql
pnpm db:types      # regenerar packages/database-types/src/database.types.ts
```

## Enlazar proyecto remoto

```bash
npx supabase login
npx supabase link --project-ref <tu-project-ref>
npx supabase db push   # solo con revisión explícita del equipo
```

Variables típicas (ver `.env.example` de cada app):

| Variable | Uso |
|----------|-----|
| `DATABASE_URL` | Payload + pooler Supabase (session mode) |
| `NEXT_PUBLIC_SUPABASE_URL` | Storefront Auth / client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente público |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo servidor (workers, hooks); nunca en el navegador |

Local tras `supabase start`: API `http://127.0.0.1:54321`, Postgres `postgresql://postgres:postgres@127.0.0.1:54322/postgres`.

## Migraciones

| Archivo | Contenido |
|---------|-----------|
| `20250604120000_extensions_enums.sql` | `pgcrypto`, enums |
| `20250604120001_core_tenant_tables.sql` | `customers`, `web_profiles` |
| `20250604120002_search_events_audit_log.sql` | Cola RF-009, audit log |
| `20250604120003_row_level_security.sql` | RLS + `current_customer_id()` |
| `20250604120004_storage_buckets.sql` | `catalog-media`, `private-documents` |

Nueva migración: `npx supabase migration new <nombre>`.

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

Payload crea sus propias tablas (`users`, `pages`, `products`, …). Este esquema **no** usa esos nombres. Aplicar migraciones Jeyjo **antes** de `payload migrate` / arranque en un entorno nuevo.

## Buckets Storage

- `catalog-media` — lectura pública; subidas vía CMS con `SUPABASE_BUCKET=catalog-media`
- `private-documents` — solo `service_role`; URLs firmadas en cambio área documental (#37)
