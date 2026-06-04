# @jeyjo/cms

Backoffice Jeyjo sobre **Payload CMS 3.x** (base: template ecommerce Payload).

## Colecciones Jeyjo (cambio `payload-collections-bootstrap`)

| Grupo admin | Colección | Descripción |
|-------------|-----------|-------------|
| **Catálogo** | `products` | Productos con pestañas ERP (solo lectura) y Marketing/SEO |
| **Catálogo** | `categories` | Árbol de categorías (`parent`, orden) |
| **Catálogo** | `suppliers` | Proveedores (Distrisantiago, Arnoia, etc.) |
| **Pedidos** | `orders` | Pedidos web (`orderNumber`, `origin`, `ivaRateSnapshot` en líneas) |
| **Contenido** | `pages`, `media`, forms | CMS template (blog/home en cambios posteriores) |

Hooks en catálogo escriben en Supabase `search_events` y `audit_log` (requiere `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`).

Ver propuesta: [`openspec/changes/payload-collections-bootstrap/`](../../openspec/changes/payload-collections-bootstrap/).

## Deuda conocida del template

- **Stripe / plugin ecommerce:** opcional en dev (sin claves reales). Jeyjo usará **Redsys, Bizum, PayPal** (#18). El storefront `(app)` dentro de `apps/cms` es **deprecated** — la tienda vive en `apps/storefront`.
- **Puerto dev:** `3001` (la tienda usa `3000`).

## Desarrollo local

### Con Supabase (recomendado)

1. Aplicar migraciones núcleo: desde la raíz, `pnpm db:reset` (ver [`supabase/README.md`](../../supabase/README.md)).
2. En `apps/cms/.env`:

```env
DATABASE_URL=postgresql://postgres.xxxx:PASSWORD@....pooler.supabase.com:5432/postgres?uselibpqcompat=true&sslmode=require
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3001
NEXT_PUBLIC_SERVER_URL=http://localhost:3001
```

3. Payload crea/actualiza tablas de colecciones al arrancar (`push` en dev). **Orden:** migraciones Supabase (#2) primero, luego `pnpm dev:cms`.

4. Seed Jeyjo: admin → seed endpoint o POST `/next/seed` (incluye proveedor, categorías anidadas y 2 productos demo).

```bash
pnpm dev:cms
```

Admin: `http://localhost:3001/admin`

### Coexistencia Payload + Supabase

- Tablas `customers`, `web_profiles`, `search_events`, `audit_log` → migraciones `supabase/migrations/`.
- Tablas `products`, `orders`, `suppliers`, etc. → schema Payload (postgres adapter).
- No ejecutar `DROP` manual de tablas core desde Payload.

## Scripts

```bash
pnpm dev
pnpm build          # requiere DATABASE_URL
pnpm lint
pnpm typecheck
pnpm generate:types # regenera payload-types.ts tras cambios en colecciones
pnpm test:int       # incluye tests supabase-server (mock)
```

## CI

Build de producción puede omitirse sin `DATABASE_URL`; lint, typecheck e int tests sí se ejecutan.
