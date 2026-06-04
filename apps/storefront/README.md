# @jeyjo/storefront

Tienda pública Jeyjo (Next.js 15, App Router, Tailwind v4).

## Design tokens

**Los colores, tipografías, radios y sombras de marca se definen solo en:**

`src/app/globals.css`

- Variables en `:root` y `.dark`
- Mapeo a Tailwind en `@theme inline`

No uses valores hex arbitrarios en componentes; utiliza utilidades como `bg-surface`, `text-primary`, `text-text-brand`.

Referencia visual: `especificaciones_inicio/diseño/jeyjo-next` (prototipo histórico).

## Scripts

```bash
pnpm dev          # http://localhost:3000
pnpm build
pnpm lint
pnpm typecheck
```

Desde la raíz del monorepo: `pnpm dev:storefront`
