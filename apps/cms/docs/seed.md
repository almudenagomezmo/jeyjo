# Seed — Datos de Demo

## Endpoint

```
POST /next/seed
```

Requiere autenticación como **admin**. El payload de Payload se encarga de la autenticación si haces la petición estando logueado en el admin.

## ¿Qué crea?

| Tipo | Cantidad |
|---|---|
| Usuario customer | `customer@example.com` / `password` |
| Categorías template | 3 (Accessories, T-Shirts, Hats) |
| Categorías Jeyjo | 6 raíz + 24 subcategorías (taxonomía jeyjo.es) |
| Marcas | 26 marcas comerciales (BIC, DYMO, Fellowes, Navigator, HP, etc.) |
| Proveedores | 1 proveedor logístico demo (Distrisantiago) |
| Productos template | 2 (Hat, T-Shirt con variantes) |
| Productos Jeyjo | ~65 referencias reales de jeyjo.es + 5 fixtures de test |
| Páginas | 2 (Home + Contact) |
| Formulario | 1 (Contact) |
| Direcciones | 2 (US + UK) |
| Transacciones | 2 (1 pending, 1 succeeded) |
| Carritos | 3 (1 open, 1 abandoned, 1 completed) |
| Pedidos | 2 (1 completed, 1 processing) |
| Navegación | Header + Footer + merchandising home |

## Primer admin

Si es la primera vez, crea un usuario admin desde el panel de Payload (`/admin`),
luego úsalo para hacer seed.

## Catálogo en Supabase Postgres

Los productos, categorías, marcas y proveedores **no** van en `supabase/seed.sql`. Se persisten en las tablas Payload del mismo Postgres (`DATABASE_URL`):

```bash
# Supabase Cloud (no requiere supabase start)
pnpm db:bootstrap      # seed.sql + catálogo
# o solo catálogo:
pnpm seed:catalog

# Supabase local
pnpm db:bootstrap:local
```

El script `apps/cms/scripts/seed-catalog.ts` usa la API local de Payload y escribe ~70 referencias de jeyjo.es en Supabase.

## Páginas legales y FAQ (footer §1.12)

```bash
pnpm --filter cms seed:site-pages
```

Crea de forma idempotente slugs legales (`aviso-legal`, `privacidad`, `cookies`, `envios`, etc.) y la página FAQ en la colección `site-pages`. Revisar copy legal antes de go-live.

La configuración del footer (redes, badge UE, enlace blog) está en el global Payload `footerSettings`, accesible desde `/admin/system-config`.

## Blog corporativo (§1.13)

```bash
pnpm --filter cms seed:blog-posts
```

Crea de forma idempotente categorías de blog y tres artículos de demo (publicado, borrador y programado). Tras el seed, activar `footerSettings.blogEnabled` en `/admin/system-config` para mostrar el enlace `/blog` en el pie.

## Reset total

El seed **limpia todas las colecciones** antes de poblar, así que es seguro ejecutarlo
múltiples veces.
