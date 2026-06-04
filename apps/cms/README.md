# @jeyjo/cms

Backoffice Jeyjo sobre **Payload CMS 3.x** (base: template ecommerce Payload).

## Deuda conocida del template

- **Stripe / plugin ecommerce:** el template incluye pasarela Stripe y flujos de carrito del demo. Jeyjo usará **Redsys, Bizum, PayPal**, etc. en cambios posteriores del [ROADMAP](../../openspec/ROADMAP.md). No confundir el checkout del template con el producto final.
- **Puerto dev:** `3001` (la tienda usa `3000`).

## Desarrollo local

### Con Supabase (recomendado si ya tienes el proyecto en la nube)

1. En [Supabase](https://supabase.com/dashboard) → **Project Settings → Database → Connection string** → **Session pooler**.
2. Edita `apps/cms/.env` y sustituye `TU_PASSWORD` en `DATABASE_URL`:

```env
DATABASE_URL=postgresql://postgres.tqgrsofvlkyumagrqbqa:TU_PASSWORD@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?uselibpqcompat=true&sslmode=require
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3001
NEXT_PUBLIC_SERVER_URL=http://localhost:3001
```

**Importante:** el usuario del pooler es `postgres.tqgrsofvlkyumagrqbqa` (con el ref del proyecto), no solo `postgres`. La contraseña es la de **Database password** en Supabase (Settings → Database), no la anon key de la API.

Si la contraseña tiene símbolos (`@`, `#`, `%`…), codifícala en la URL (`@` → `%40`).
Si sigue fallando: resetea la contraseña en el dashboard y actualiza `.env`.

3. Desde la raíz del monorepo:

```bash
pnpm dev:cms
```

4. Admin: `http://localhost:3001/admin` (crea el primer usuario si la BD está vacía).

**Qdrant:** si no tienes Qdrant local, el arranque sigue; verás un aviso. Opcional: `docker compose -f apps/cms/docker/docker-compose.yml up -d qdrant`.

**Email:** por defecto no hace falta Mailpit. Para capturar correos en local: `SMTP_USE_MAILPIT=true` y `docker compose -f apps/cms/docker/docker-compose.yml up -d mailpit` → UI en `http://localhost:8025`.

### Con PostgreSQL en Docker (alternativa)

```bash
cp .env.example .env
# Descomenta DATABASE_URL local y comenta la de Supabase
cd apps/cms/docker && docker compose up -d
cd ../../..
pnpm dev:cms
```

## Scripts

```bash
pnpm dev
pnpm build          # requiere DATABASE_URL y Postgres
pnpm lint
pnpm typecheck
```

## CI

El build de producción en CI puede omitirse si no hay `DATABASE_URL` en secrets; lint y typecheck sí se ejecutan.
