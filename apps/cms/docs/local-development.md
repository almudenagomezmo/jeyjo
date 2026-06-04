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

Stripe y Supabase pueden dejarse con valores placeholder para desarrollo.

## 3. Instalar dependencias

```bash
pnpm install
```

## 4. Arrancar el servidor de desarrollo

```bash
pnpm dev
```

El servidor arranca en `http://localhost:3000`.

**Admin panel**: `http://localhost:3000/admin`

## 5. Poblar datos de demo (opcional)

```bash
# Desde el admin panel:
# POST http://localhost:3000/next/seed (requiere auth admin)

# O desde terminal:
# Primero crea un admin manualmente, luego haz la petición
```

Ver [Seed](seed.md) para más detalles.

## Colecciones de Payload

| Slug | Descripción |
|---|---|
| `users` | Usuarios (admin y customer) |
| `pages` | Páginas del CMS |
| `media` | Archivos multimedia |
| `categories` | Categorías de producto |
| `products` | Productos (via ecommerce plugin) |
| `orders` | Pedidos |
| `carts` | Carritos |
| `addresses` | Direcciones |
| `transactions` | Transacciones Stripe |
| `form-submissions` | Envíos de formularios |

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
