# Jeyjo Digital Platform

Monorepo de la plataforma e-commerce B2C/B2B y backoffice de Jeyjo.

| App | Paquete | Puerto dev | Descripción |
|-----|---------|------------|-------------|
| Tienda | `@jeyjo/storefront` | 3000 | Next.js — catálogo, carrito, área cliente (evolución) |
| CMS | `@jeyjo/cms` | 3001 | Payload CMS — administración interna |

## Requisitos

- Node.js >= 20.9
- [pnpm](https://pnpm.io/) 9+
- Proyecto en [Supabase Cloud](https://supabase.com/dashboard) (flujo habitual)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — **opcional**: Qdrant/Mailpit del CMS (`apps/cms/docker/`) o Supabase local (ver abajo)

**Configuración detallada** (Supabase dashboard, Resend, `.env` de cada app): [CONFIGURACION.md](CONFIGURACION.md)

**Emails en local (Mailpit):** `pnpm mailpit:up` y `USE_MAILPIT=true` en `apps/cms/.env` + `apps/storefront/.env`

## Base de datos (Supabase Cloud — recomendado)

Esquema núcleo (`customers`, `web_profiles`, `search_events`, `audit_log`, RLS): ver [supabase/README.md](supabase/README.md).

**No ejecutes `pnpm db:start`** si usas cloud: levanta ~12 contenedores Docker locales que no necesitas.

1. Configura `apps/cms/.env` y `apps/storefront/.env` con el pooler y las URLs de tu proyecto (ver `apps/cms/.env.example`).
2. Primera vez en un proyecto vacío:

```bash
npx supabase login
npx supabase link --project-ref <tu-project-ref>
pnpm db:push        # migraciones → supabase.com
pnpm db:bootstrap   # seed.sql + catálogo jeyjo.es
pnpm db:types       # regenera tipos en packages/database-types
```

| Variable (storefront) | Uso |
|-----------------------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | API Auth / cliente (`https://<ref>.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública |

### Supabase local (Docker) — solo si lo necesitas

Alternativa offline. Requiere Docker y variables apuntando a `127.0.0.1:54321` / `:54322`.

```bash
pnpm db:start           # levanta stack local (~12 contenedores)
pnpm db:reset           # migraciones + seed en local
pnpm db:bootstrap:local # db:reset + catálogo
pnpm db:stop            # para los contenedores cuando termines
```

En `apps/cms/.env`: `DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres`

## Inicio rápido

```bash
# En Windows, si fallan postinstall de git-hooks: pnpm install --ignore-scripts
pnpm install

# Solo tienda (sin base de datos)
pnpm dev:storefront

# CMS (requiere DATABASE_URL → Supabase Cloud o Postgres local)
pnpm dev:cms
```

## Scripts raíz

| Script | Acción |
|--------|--------|
| `pnpm dev` | Arranca storefront y cms en paralelo |
| `pnpm build` | Build de todas las apps |
| `pnpm lint` | ESLint en todas las apps |
| `pnpm typecheck` | TypeScript en todas las apps |
| `pnpm db:push` | Migraciones → proyecto cloud enlazado (`supabase link`) |
| `pnpm db:bootstrap` | Seed + catálogo en cloud (`DATABASE_URL` del CMS) |
| `pnpm db:types` | Tipos TS del esquema núcleo |
| `pnpm db:start` / `db:stop` | **Solo local:** levantar / parar stack Docker Supabase |
| `pnpm db:reset` / `db:bootstrap:local` | **Solo local:** migraciones + seed en Docker |

## OpenSpec

Roadmap de 43 cambios incrementales: [openspec/ROADMAP.md](openspec/ROADMAP.md)

Cambios recientes: `foundation-monorepo-design-system`, `data-schema-core-supabase` (en `openspec/changes/`)

## Referencias legacy

- `especificaciones_inicio/diseño/jeyjo-next` — prototipo UI (origen del storefront)
- `jeyjo_back` — copia histórica del template Payload; **código canónico en `apps/cms`**

## Especificaciones

Documentos de dominio en `openspec/specs/` y `especificaciones_inicio/`.
