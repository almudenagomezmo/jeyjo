# Jeyjo Digital Platform

Monorepo de la plataforma e-commerce B2C/B2B y backoffice de Jeyjo.

| App | Paquete | Puerto dev | Descripción |
|-----|---------|------------|-------------|
| Tienda | `@jeyjo/storefront` | 3000 | Next.js — catálogo, carrito, área cliente (evolución) |
| CMS | `@jeyjo/cms` | 3001 | Payload CMS — administración interna |

## Requisitos

- Node.js >= 20.9
- [pnpm](https://pnpm.io/) 9+

## Inicio rápido

```bash
# En Windows, si fallan postinstall de git-hooks: pnpm install --ignore-scripts
pnpm install

# Solo tienda (sin base de datos)
pnpm dev:storefront

# CMS (requiere Postgres — ver apps/cms/README.md)
pnpm dev:cms
```

## Scripts raíz

| Script | Acción |
|--------|--------|
| `pnpm dev` | Arranca storefront y cms en paralelo |
| `pnpm build` | Build de todas las apps |
| `pnpm lint` | ESLint en todas las apps |
| `pnpm typecheck` | TypeScript en todas las apps |

## OpenSpec

Roadmap de 43 cambios incrementales: [openspec/ROADMAP.md](openspec/ROADMAP.md)

Cambio activo de fundación: `openspec/changes/foundation-monorepo-design-system/`

## Referencias legacy

- `especificaciones_inicio/diseño/jeyjo-next` — prototipo UI (origen del storefront)
- `jeyjo_back` — copia histórica del template Payload; **código canónico en `apps/cms`**

## Especificaciones

Documentos de dominio en `openspec/specs/` y `especificaciones_inicio/`.
