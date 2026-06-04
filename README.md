# Jeyjo Digital Platform

Monorepo de la plataforma e-commerce B2C/B2B y backoffice de Jeyjo.

| App | Paquete | Puerto dev | Descripción |
|-----|---------|------------|-------------|
| Tienda | `@jeyjo/storefront` | 3000 | Next.js — catálogo, carrito, área cliente (evolución) |
| CMS | `@jeyjo/cms` | 3001 | Payload CMS — administración interna |

## Requisitos

- Node.js >= 20.9
- [pnpm](https://pnpm.io/) 9+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — para Supabase local y Qdrant/Mailpit del CMS

## Base de datos (Supabase)

Esquema núcleo (`customers`, `web_profiles`, `search_events`, `audit_log`, RLS): ver [supabase/README.md](supabase/README.md).

```bash
pnpm db:start    # primera vez: levanta Postgres local (puerto 54322)
pnpm db:reset    # migraciones + seed
pnpm db:types    # regenera tipos en packages/database-types
```

**CMS con Postgres local:** en `apps/cms/.env` usa  
`DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres`

**Proyecto remoto:** enlaza con `npx supabase link` y usa el pooler en `DATABASE_URL` (ver `apps/cms/.env.example`).

| Variable (storefront) | Uso |
|-----------------------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | API Auth / cliente |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública |

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
| `pnpm db:reset` | Migraciones Supabase + seed local |
| `pnpm db:types` | Tipos TS del esquema núcleo |

## OpenSpec

Roadmap de 43 cambios incrementales: [openspec/ROADMAP.md](openspec/ROADMAP.md)

Cambios recientes: `foundation-monorepo-design-system`, `data-schema-core-supabase` (en `openspec/changes/`)

## Referencias legacy

- `especificaciones_inicio/diseño/jeyjo-next` — prototipo UI (origen del storefront)
- `jeyjo_back` — copia histórica del template Payload; **código canónico en `apps/cms`**

## Especificaciones

Documentos de dominio en `openspec/specs/` y `especificaciones_inicio/`.
