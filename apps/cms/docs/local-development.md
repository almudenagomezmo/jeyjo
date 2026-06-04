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

Para hooks de `search_events` / `audit_log`:

```bash
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role
```

Con monorepo Supabase CLI (recomendado):

```bash
# Desde la raíz del repo
pnpm db:reset    # aplica supabase/migrations + seed SQL
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
2. Arrancar CMS — Payload crea/actualiza tablas de colecciones (`products`, `suppliers`, …) vía postgres adapter.
3. No eliminar tablas core (`customers`, `search_events`, …) desde el admin Payload.

## 5. Poblar datos de demo (opcional)

```bash
# Desde el admin panel:
# POST http://localhost:3000/next/seed (requiere auth admin)

# O desde terminal:
# Primero crea un admin manualmente, luego haz la petición
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
