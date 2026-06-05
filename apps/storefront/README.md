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
- El árbol de categorías se carga en servidor desde Payload (`GET /api/categories`) con caché 300 s; si el CMS no responde o devuelve vacío, se usa el snapshot versionado en `data/category-tree.snapshot.json`.
- Tras cambios de taxonomía en Payload: `pnpm sync:categories` (requiere `CMS_URL` y CMS con categorías).
- Tres niveles en navegación: categoría → subcategoría → familia (`/c/{root}/{sub}/{family}`). Glyphs de raíz desde `homeGlyph` en CMS.
- Route groups: `(shop)` para catálogo/búsqueda, `(account)` para `/cuenta` — las URLs públicas no cambian.
- Skip link «Ir al contenido» y breadcrumbs en `/c/*`, `/p/*`, `/search`.

Variables CMS para navegación: `CMS_URL` (preferida), `CMS_INTERNAL_URL` o `NEXT_PUBLIC_PAYLOAD_URL` — ver `.env.example`.

## Catálogo (categorías, productos, proveedores)

Todo el catálogo público se lee de Payload en servidor; **no hay slugs, SKUs ni taxonomía embebidos** en el código del storefront.

| Dato | Origen |
|------|--------|
| Categorías (slug, jerarquía, `homeGlyph`) | `GET /api/categories` + snapshot fallback |
| Productos PLP/PDP (slug, SKU, categorías, marca/proveedor) | `GET /api/products` |
| Home merchandising | `GET /api/globals/home` |
| Búsqueda | Qdrant + hidratación CMS, o filtro texto sobre productos cacheados |

Si el CMS no devuelve datos, las listas y fichas quedan vacías (sin catálogo demo local). Ejecuta `pnpm seed:catalog` y `pnpm sync:categories` en local.

## Configuración operativa (RF-013 / cambio `#42`)

- `fetchSystemConfig()` — server-only, cache 60 s contra `GET {CMS_URL}/api/system/config`.
- Portes checkout/carrito, umbral stock semáforo, contacto footer y toggles búsqueda leen esta API.
- Proxy cliente: `GET /api/system/config` (misma respuesta, para minicart/carrito client-side).
- Fallback: defaults v1 (39€/5€ B2C, 10€/2,50€ B2B) si CMS no responde.

## Búsqueda predictiva (RF-009 / US-01)

- `POST /api/search/suggest` — body `{ "q": "boli" }` (mínimo 3 caracteres). Embebe con `@jeyjo/search-embedding`, consulta Qdrant (`products`, `categories`) y hidrata desde Payload + precios batch.
- Cabecera: `SearchBar` con debounce 250 ms, panel predictivo desde la 3.ª letra, Enter → `/search?q=`.
- `/search?q=` usa candidatos vectoriales (top 200) + facetas PLP existentes cuando `PREDICTIVE_SEARCH_ENABLED=true` (defecto).

Variables (server-only, ver `.env.example` junto a `CMS_URL`):

| Variable | Descripción |
|---|---|
| `QDRANT_URL` | URL REST de Qdrant (local: `http://localhost:6333`) |
| `QDRANT_API_KEY` | API key (Qdrant Cloud; vacío en local) |
| `PREDICTIVE_SEARCH_ENABLED` | `false` desactiva además del toggle CMS en `/admin/system-config` |

### Staging warm-up y latencia

Tras deploy, el primer suggest puede tardar (cold start del modelo ~100 MB). Comprobar p95 &lt;150 ms:

```bash
node apps/storefront/scripts/suggest-latency-check.mjs https://<staging-storefront> boli
```

Verificación manual (**CA-SEARCH-002**): tras warm-up, `"boligrafo vic"` debe mostrar bolígrafo BIC en el desplegable. **CA-SEARCH-003**: EAN completo `3086123519963` debe priorizar el SKU indexado.

## Autenticación y área de cliente (RF-001 / RF-004)

- Rutas: `/login`, `/registro`, `/cuenta` (B2C), `/intranet` (B2B validado). Alias `/mi-cuenta` → `/cuenta`.
- Variables Supabase en `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- Tras `supabase db reset`, crea usuarios en **Supabase Studio → Authentication** y enlaza `web_profiles` (ver comentarios en `supabase/seed.sql`):
  - **CA-AUTH-001 (B2C):** email `b2c-demo@jeyjo.local`, customer `a0000002-…0002`, `role=b2c`.
  - **CA-AUTH-002 (B2B):** email `b2b-demo@jeyjo.local`, customer `a0000001-…0001`, `role=b2b_superadmin`, `customer_group=2`.
- Confirmación de email: configurable en el proyecto Supabase; redirect recomendado `/login?confirmed=1`.
- Validación de altas pendientes: CMS admin → **Clientes tienda** (`/admin/customers`, filtro pendientes). Tras validar, el CMS envía email de aprobación (distinto del email de confirmación de Supabase).

## Scripts

```bash
pnpm dev          # http://localhost:3000
pnpm build
pnpm lint
pnpm typecheck
```

Desde la raíz del monorepo: `pnpm dev:storefront`

## Analytics GA4 y beacons (#30 / #34)

- **Beacons internos (dashboard US-19):** `AnalyticsBeacon` → `POST /api/analytics/heartbeat` cuando `NEXT_PUBLIC_ANALYTICS_BEACONS_ENABLED` ≠ `false`. Alimentan KPIs del backoffice; no sustituyen GA4.
- **Google Analytics 4 (RF-028):** `Ga4Script` + eventos e-commerce (`page_view`, `view_item`, `add_to_cart`, `begin_checkout`, `purchase`) solo en la tienda pública — **no** en `/intranet`.
- Variables: `NEXT_PUBLIC_GA4_ENABLED` (defecto desactivado en `.env.example`), `NEXT_PUBLIC_GA4_MEASUREMENT_ID`, `GA4_API_SECRET` (opcional, Measurement Protocol en confirmación de pedido).

### Checklist manual RF-028

1. Activar GA4 test property + `NEXT_PUBLIC_GA4_ENABLED=true`.
2. DebugView: navegar PLP/PDP → `view_item`; añadir al carrito → `add_to_cart`; checkout → `begin_checkout`.
3. Completar pedido de prueba con `paid=1` → evento `purchase` con `transaction_id` = número de pedido.
