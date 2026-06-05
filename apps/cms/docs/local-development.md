# Local Development

## Requisitos

- Node.js ^18.20.2 || >=20.9.0
- pnpm (o npm)
- Docker Desktop

## 1. Levantar servicios (PostgreSQL + Qdrant)

```bash
cd docker
docker compose up -d
```

Esto arranca:
- **PostgreSQL 16** en `localhost:5432`
- **Qdrant** en `localhost:6333` (HTTP) y `localhost:6334` (gRPC)

Para ver los logs:

```bash
docker compose logs -f
```

## 2. Configurar variables de entorno

Copia `.env.example` a `.env` (ya existe, verifica que los valores sean correctos):

```bash
# Valores por defecto que funcionan con Docker
PAYLOAD_SECRET=09301cea19e538a42722e421
DATABASE_URL=postgres://postgres:postgres@localhost:5432/jeyjo
QDRANT_URL=http://localhost:6333
```

Stripe puede dejarse con placeholders (`sk_test_`) — el CMS arranca sin pasarela activa.

Para hooks de `search_events` / `audit_log` y consola de auditoría:

```bash
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role
MFA_GRACE_DAYS=0
```

Usuarios staff de prueba (seed): ver [`../README.md`](../README.md#usuarios-de-prueba-seed).

Con monorepo Supabase CLI (recomendado):

```bash
# Supabase Cloud (DATABASE_URL en apps/cms/.env → pooler remoto)
pnpm db:push        # migraciones (tras supabase link), primera vez
pnpm db:bootstrap   # seed.sql + catálogo jeyjo.es

# Supabase local (supabase start)
pnpm db:bootstrap:local
```

## 3. Instalar dependencias

Desde la raíz del monorepo:

```bash
pnpm install
```

## 4. Arrancar el servidor de desarrollo

```bash
pnpm dev:cms
# o desde apps/cms: pnpm dev
```

El servidor arranca en `http://localhost:3001`.

**Admin panel**: `http://localhost:3001/admin`

### Payload schema vs migraciones Supabase

1. Aplicar primero `supabase/migrations/` (`pnpm db:reset` o `supabase db push`).
2. Arrancar CMS — Payload **no** hace schema push automático (evita borrar `customers`, `web_profiles`, …). Tras cambiar colecciones: `pnpm --filter @jeyjo/cms payload migrate`.
3. No eliminar tablas core (`customers`, `search_events`, …) desde el admin Payload. No uses `PAYLOAD_DB_PUSH=true` salvo en Postgres sin tablas Supabase.

## 5. Poblar catálogo y datos de demo

**Catálogo (recomendado):**

```bash
pnpm seed:catalog   # desde la raíz; escribe en Supabase Postgres
```

**Seed completo del template ecommerce** (admin + carritos demo + catálogo):

```bash
# POST http://localhost:3001/next/seed (requiere auth admin)
```

Ver [Seed](seed.md) para más detalles.

## Colecciones de Payload (Jeyjo)

| Grupo | Slug | Descripción |
|---|---|---|
| Catálogo | `products` | Productos ERP + enriquecimiento SEO / imagen dual |
| Catálogo | `categories` | Categorías jerárquicas |
| Catálogo | `suppliers` | Proveedores |
| Pedidos | `orders` | Pedidos web (`origin`, `orderNumber`, IVA snapshot) |
| Contenido | `pages`, `media`, forms | CMS template |
| Users | `users` | Staff Payload (clientes tienda → Supabase #16) |

## Estructura de rutas

| Ruta | Descripción |
|---|---|
| `/` | Home |
| `/shop` | Tienda |
| `/products/[slug]` | Producto |
| `/checkout` | Checkout |
| `/account` | Mi cuenta |
| `/orders` | Mis pedidos |
| `/admin` | Admin Payload |
| `/api/graphql` | API GraphQL |
| `/api/[...slug]` | API REST |
