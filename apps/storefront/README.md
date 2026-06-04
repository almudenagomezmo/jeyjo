# @jeyjo/storefront

Tienda pública Jeyjo (Next.js 15, App Router, Tailwind v4).

## Design tokens

**Los colores, tipografías, radios y sombras de marca se definen solo en:**

`src/app/globals.css`

- Variables en `:root` y `.dark`
- Mapeo a Tailwind en `@theme inline`

No uses valores hex arbitrarios en componentes; utiliza utilidades como `bg-surface`, `text-primary`, `text-text-brand`.

Referencia visual: `especificaciones_inicio/diseño/jeyjo-next` (prototipo histórico).

## Motor de precios (RF-007)

- `POST /api/pricing/resolve` — body `{ "sku": "REF-001", "customerId": "<uuid opcional>" }`.
- Paquete `@jeyjo/pricing`; fixtures CA-PRECIOS en memoria si no hay Supabase.
- Cabecera: `PriceModeToggle` muestra **Precios sin IVA** (B2C) o **Precios sin IVA (B2B)**.

Variables: ver `.env.example` (`PRICING_ENGINE_ENABLED`, `SUPABASE_*`).

## Shell y navegación

- **TopBar**, **Header** (mega-menú desktop + drawer móvil), **Footer** y **MiniCart** en el layout raíz.
- El árbol de categorías se carga en servidor desde Payload (`GET /api/categories`) con caché 300 s; si el CMS no responde, se usa la taxonomía estática de `lib/data/categories.ts`.
- Route groups: `(shop)` para catálogo/búsqueda, `(account)` para `/cuenta` — las URLs públicas no cambian.
- Skip link «Ir al contenido» y breadcrumbs en `/c/*`, `/p/*`, `/search`.

Variables CMS para navegación: `CMS_URL` (preferida), `CMS_INTERNAL_URL` o `NEXT_PUBLIC_PAYLOAD_URL` — ver `.env.example`.

## Scripts

```bash
pnpm dev          # http://localhost:3000
pnpm build
pnpm lint
pnpm typecheck
```

Desde la raíz del monorepo: `pnpm dev:storefront`
