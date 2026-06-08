# @jeyjo/cms

Backoffice Jeyjo sobre **Payload CMS 3.x** (base: template ecommerce Payload).

## Staff auth (cambio `backoffice-mfa-audit-roles`)

- **`users` Payload = solo staff Jeyjo.** Clientes tienda → Supabase `web_profiles` (#16).
- **MFA obligatorio** para todo staff antes de operar en colecciones. **Desarrollo:** código por email (`RESEND_*` o Mailpit). **Producción:** TOTP (Google Authenticator).
- **Roles staff:** `superadmin`, `administracion`, `catalogo`, `personalizacion`, `mantenimiento` (campo `staffRoles`, `saveToJWT`).
- **Consola de auditoría:** `/admin/audit-log` (roles `superadmin` | `mantenimiento`).
- **Contraseñas staff:** mínimo 12 caracteres + complejidad (RNF-011).

### Usuarios de prueba (seed)

Tras `POST /next/seed` se crean:

| Email | Rol | Contraseña |
|-------|-----|------------|
| `superadmin@jeyjo.local` | superadmin | `JeyjoStaff2026!` |
| `catalogo@jeyjo.local` | catalogo | `JeyjoStaff2026!` |
| `administracion@jeyjo.local` | administracion | `JeyjoStaff2026!` |

**TOTP e2e (RFC 6238):** secreto `JBSWY3DPEHPK3PXP` — usar Google Authenticator o generar código con `otpauth`.

### Variables MFA / auditoría

```env
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...   # audit_log + consola
MFA_GRACE_DAYS=0                # solo dev: omitir cookie MFA temporalmente
```

## Dashboard KPIs (cambio `dashboard-kpis-alerts`, US-19 / RF-026)

Tras MFA, la landing `/admin` muestra el **dashboard de KPIs** (ventas, conversión, visitantes, carritos, últimos pedidos, monitorización EVA preview y alertas de sistema).

| Rol | Visibilidad |
|-----|-------------|
| `superadmin`, `administracion` | KPIs completos + alertas operativas |
| `mantenimiento` | Solo alertas técnicas (sync ERP) |
| `catalogo`, `personalizacion` | Bienvenida sin cifras de ventas; alertas PIM/stock si aplica |

API staff: `GET /api/dashboard/summary?period=today|yesterday|week|month|custom&from=&to=`

Variables:

```env
TZ=Europe/Madrid
DASHBOARD_LOW_STOCK_THRESHOLD=5
TOP_SALES_WINDOW_DAYS=30
```

Los visitantes y carritos activos dependen de beacons en `apps/storefront` (`NEXT_PUBLIC_ANALYTICS_BEACONS_ENABLED`).

## Configuración del sistema (cambio `#42`, Alcance §1.36)

Hub staff: **`/admin/system-config`** — enlaces a portes, stock, contacto, pagos, marketing, SKAI, analytics y auditoría.

| Recurso | Descripción |
|---------|-------------|
| Global `systemSettings` | Portes B2C/B2B, umbral stock, ventana Top Ventas, staleness ERP, contacto, toggles búsqueda |
| `GET /api/system/config` | API pública cacheable (60 s) consumida por storefront |
| Auditoría | Cambios en `systemSettings` → `audit_log` entityType `systemSettings` |

| Rol | Edición |
|-----|---------|
| `superadmin`, `administracion` | Portes, stock, contacto, umbrales dashboard |
| `superadmin`, `mantenimiento` | Staleness ERP, búsqueda predictiva |
| `catalogo`, otros | Sin acceso de escritura |

Variables env (`STOCK_LOW_THRESHOLD`, `DASHBOARD_LOW_STOCK_THRESHOLD`, `TOP_SALES_WINDOW_DAYS`, `CATALOG_STALENESS_HOURS`) actúan como **fallback** si el global CMS no está disponible.

## Colecciones Jeyjo (cambio `payload-collections-bootstrap`)

| Grupo admin | Colección | Descripción |
|-------------|-----------|-------------|
| **Catálogo** | `products` | Productos con pestañas ERP (solo lectura) y Marketing/SEO |
| **Catálogo** | `categories` | Árbol de categorías (`parent`, orden) |
| **Catálogo** | `brands` | Marcas comerciales (BIC, HP, etc.) |
| **Catálogo** | `suppliers` | Proveedores logísticos (Distrisantiago, Arnoia, etc.) |
| **Pedidos** | `orders` | Pedidos web (`orderNumber`, `origin`, `ivaRateSnapshot` en líneas) |
| **Contenido** | `pages`, `media`, forms | CMS template (blog/home en cambios posteriores) |
| **Mantenimiento** | `users`, audit log | Staff y trazabilidad |

Hooks en catálogo y staff escriben en Supabase `search_events` y `audit_log` (requiere `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`).

Ver propuesta: [`openspec/changes/payload-collections-bootstrap/`](../../openspec/changes/payload-collections-bootstrap/).

## Deuda conocida del template

- **Stripe / plugin ecommerce:** opcional en dev (sin claves reales). Jeyjo usará **Redsys, Bizum, PayPal** (#18). El storefront `(app)` dentro de `apps/cms` es **deprecated** — la tienda vive en `apps/storefront`.
- **Puerto dev:** `3001` (la tienda usa `3000`).
- **Staff security (MFA + roles + audit):** implementado en cambio `backoffice-mfa-audit-roles`.

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
MFA_GRACE_DAYS=0
```

3. **Orden:** migraciones Supabase (#2) primero, luego `pnpm dev:cms`. El schema push de Payload está **desactivado** por defecto (coexiste con tablas `customers`, `web_profiles`, etc.). Si cambias colecciones Payload, ejecuta `pnpm --filter @jeyjo/cms payload migrate`. Solo en Postgres aislado: `PAYLOAD_DB_PUSH=true pnpm dev:cms`.

4. Seed Jeyjo: admin → seed endpoint o POST `/next/seed` (catálogo demo + usuarios staff).

```bash
pnpm dev:cms
```

Admin: `http://localhost:3001/admin`  
Audit console: `http://localhost:3001/admin/audit-log`

### Coexistencia Payload + Supabase

- Tablas `customers`, `web_profiles`, `search_events`, `audit_log` → migraciones `supabase/migrations/`.
- **Clientes tienda (RF-004):** vista admin `/admin/customers` (filtro pendientes por defecto); APIs `GET /api/customers-admin` y `GET /api/customers-admin/:id`; validación `POST /next/customers/:id/validate` (solo `superadmin`/`administracion` + MFA). Email Supabase = confirmar dirección; email CMS = cuenta aprobada. Legacy `/admin/pending-customers` redirige a la nueva vista.
- Tablas `products`, `orders`, `suppliers`, etc. → schema Payload (postgres adapter).
- No ejecutar `DROP` manual de tablas core desde Payload.

## Motor de precios (`price-engine-core`)

- Paquete compartido `@jeyjo/pricing` (`resolvePrice`, reglas RF-007).
- CMS: `src/pricing/` (Supabase + Payload `p1Price`/`p2Price`/`vatRate`).
- Pedidos: al pasar `jeyjoStatus` → `confirmed`, se rellena `ivaRateSnapshot` en líneas (rechazo si falta IVA en producto).
- Tablas Supabase: `special_prices`, `group_offers` (seed CA-PRECIOS en `supabase/seed.sql`).
- Puertos ERP: `ErpPricingReader` en `@jeyjo/erp-ports` (stub REF-001..004).

```bash
pnpm --filter @jeyjo/pricing test
pnpm test:int   # incluye pricing-engine + order-iva-snapshot + erp-sync
```

## Importación / exportación catálogo Excel (`excel-importer-exporter`, ROADMAP #29)

- **Paquete:** `@jeyjo/erp-excel` — parser `ImportaciónArticulos.xlsx` ↔ DTOs ERP.
- **Admin:** `/admin/catalog-import` (roles `superadmin` | `catalogo`).
- **API:** `POST /api/erp/catalog-import/parse`, `POST /api/erp/catalog-import/apply`, `GET /api/erp/catalog-export`, `GET /api/erp/catalog-import/template`.
- **Storage:** bucket Supabase `erp-imports` (o `.data/erp-imports` en local sin Storage).
- **Auditoría:** `audit_log` action `IMPORT_CATALOG_EXCEL` / `EXPORT_CATALOG_EXCEL`; `erp_sync_runs.source=excel_import`.
- **Docs:** `docs/avansuite-catalog-import.md`; checklist staging en `openspec/changes/excel-importer-exporter/MANUAL-VERIFY.md`.

```bash
pnpm --filter @jeyjo/erp-excel test
pnpm test:int   # erp-registry, catalog-excel-import
# ERP_ADAPTER=excel + ERP_EXCEL_CATALOG_PATH para cron sync desde fichero
```

## Modo web-native (`web-native-operations`, ROADMAP #51)

- **Flag:** `systemSettings.webNativeMode` (default `true`) o env `WEB_NATIVE_MODE=true`.
- **Operación:** catálogo comercial, stock, documentos B2B y tarifas gestionados desde Payload; sin sync ERP ni export Avansuite.
- **Colecciones:** `customer-documents`, `special-prices`, `group-offers`.
- **Sync deshabilitado:** crons `erp-catalog-sync` y `stock-sync` responden HTTP 410.
- **Integración API Avansuite (#36):** congelada hasta activar `webNativeMode=false`.

## Sync lectura ERP (`catalog-sync-read-stub`, ROADMAP #7)

- **Orquestador:** `src/erp/ErpCatalogSyncOrchestrator.ts` — pull stub → Payload + tablas `special_prices` / `group_offers`.
- **Manual (dev):** `POST /next/sync-from-stub` (admin autenticado, deshabilitado en producción).
- **Cron (staging/prod):** `GET /api/cron/erp-catalog-sync` con `Authorization: Bearer $CRON_SECRET` (Vercel cada 15 min, ver `vercel.json`).
- **Metadatos:** tabla Supabase `erp_sync_runs`; cada ejecución escribe en `audit_log` (`SYNC_ERP_READ`).
- **Stub ampliado:** SKUs `REF-001..004`, comodín `9000000001` (RF-006); productos nuevos desde ERP se crean en `_status: draft`.
- **Storefront:** lee P1/P2/IVA vía `CMS_INTERNAL_URL` + filtro público (sin comodín ni borradores).

```bash
# Tras seed + migraciones
curl -X POST http://localhost:3001/next/sync-from-stub -H "Cookie: ..."   # admin session
curl http://localhost:3001/api/cron/erp-catalog-sync -H "Authorization: Bearer $CRON_SECRET"
pnpm --filter @jeyjo/erp-ports test
pnpm test:int   # erp-sync, erp-orchestrator
```

## Sync stock multisource (`stock-multisource-adapters`, ROADMAP #8)

- **Paquete:** `@jeyjo/stock-ports` — puertos Distrisantiago/Arnoia, stubs, `resolveStockIndicator` (RF-005).
- **Orquestador:** `src/stock/StockSyncOrchestrator.ts` — pull mayoristas → campos internos Payload → semáforo `stockIndicator`.
- **Manual (dev):** `POST /next/sync-stock-from-stub` (admin, deshabilitado en producción).
- **Cron:** `GET /api/cron/stock-sync` con el mismo `CRON_SECRET` (Vercel cada 15 min).
- **Tras sync ERP:** `runCatalogSyncRead` recalcula indicador para SKUs actualizados sin re-pull mayoristas.
- **Campos Payload (pestaña Stock multisource):** `distrisantiagoStock`, `arnoiaStock`, `stockIndicator`, `syncDistrisantiagoAt`, `syncArnoiaAt` — solo escritura con `req.context.stockSync`.
- **Metadatos:** tabla `stock_sync_runs`; `audit_log` action `SYNC_STOCK_READ`.
- **Env:** `STOCK_DISTRI_ADAPTER`, `STOCK_ARNOIA_ADAPTER`, `STOCK_LOW_THRESHOLD` (default 5).

```bash
curl -X POST http://localhost:3001/next/sync-stock-from-stub -H "Cookie: ..."   # admin session
curl http://localhost:3001/api/cron/stock-sync -H "Authorization: Bearer $CRON_SECRET"
pnpm --filter @jeyjo/stock-ports test
pnpm test:int stock
```

## B2B notifications (`notifications-center-email`, ROADMAP #28)

- **Tablas Supabase:** `notifications`, `notification_preferences`, `erp_invoice_sync_state`
- **Despacho:** `src/lib/notifications/dispatch.ts` (hooks Orders/Quotes + cron facturas)
- **Env:** `NOTIFICATIONS_ENABLED=true` (sin esto los hooks y sync no envían avisos)
- **Cron:** `GET /api/cron/invoice-sync` cada 5 min; `GET /api/cron/quote-expiry-notifications` diario — mismo `CRON_SECRET`
- **Storefront:** campana en portal, APIs `/api/intranet/notifications` y `notification-preferences`

```bash
curl http://localhost:3001/api/cron/invoice-sync -H "Authorization: Bearer $CRON_SECRET"
curl http://localhost:3001/api/cron/quote-expiry-notifications -H "Authorization: Bearer $CRON_SECRET"
pnpm test:int notifications
```

## Search indexer Qdrant (`search-events-qdrant-worker`, ROADMAP #13)

- **Worker:** `src/search-indexer/` — poll `search_events` → embeddings (`@xenova/transformers`) → upsert/delete Qdrant (`products`, `categories`).
- **Manual (dev):** `POST /next/process-search-events` (admin autenticado, deshabilitado en producción).
- **Backfill (dev):** `POST /next/search-backfill` (admin) — encola todo el catálogo publicado.
- **Cron:** `GET /api/cron/search-indexer` cada minuto; `GET /api/cron/search-reconcile` cada hora; `GET /api/cron/search-orphan-cleanup` diario — todos con `Authorization: Bearer $CRON_SECRET`.
- **Exclusiones:** productos comodín (`isWildcard`) y no publicados no permanecen en el índice.
- **Embeddings:** modelo `Xenova/multilingual-e5-small` (384 dims); primera ejecución descarga ~100 MB — ver `docs/qdrant.md`.
- **Dashboard:** KPIs cola + alertas lag/error en `/admin` (RF-009).

```bash
curl -X POST http://localhost:3001/next/process-search-events -H "Cookie: ..."   # admin session
curl -X POST http://localhost:3001/next/search-backfill -H "Cookie: ..."       # admin session
curl http://localhost:3001/api/cron/search-indexer -H "Authorization: Bearer $CRON_SECRET"
curl http://localhost:3001/api/cron/search-reconcile -H "Authorization: Bearer $CRON_SECRET"
curl http://localhost:3001/api/cron/search-orphan-cleanup -H "Authorization: Bearer $CRON_SECRET"
pnpm test:int search-indexer
pnpm test:int search-reconcile
```

## GA4 y Merchant Center feed (`analytics-ga4-merchant-feed`, ROADMAP #34, RF-028)

- **Feed XML:** `GET /api/feeds/merchant-center.xml` — catálogo publicado P1+IVA, imagen dual, stock semáforo.
- **Cron diario:** `GET /api/cron/merchant-feed` con `Authorization: Bearer $CRON_SECRET` (Vercel 03:00 UTC).
- **Admin:** `/admin/analytics-config` (roles `superadmin`, `mantenimiento`) — estado del feed, omitidos, checklist.
- **GA4:** configuración runtime en storefront (`NEXT_PUBLIC_GA4_*`); global Payload `analyticsSettings` es referencia operativa.
- **Env CMS:** `MERCHANT_FEED_ENABLED`, `MERCHANT_FEED_BASE_URL` (URL tienda para links del feed).

```bash
curl http://localhost:3001/api/feeds/merchant-center.xml
curl http://localhost:3001/api/cron/merchant-feed -H "Authorization: Bearer $CRON_SECRET"
pnpm test:int merchant-feed
```

### Checklist manual RI-008

1. Ejecutar cron o abrir feed URL; validar XML en Google Merchant Center / Content API test tool.
2. Confirmar producto de prueba con `g:image_link`, `g:price`, `link` absoluto a `/p/{slug}`.

## Scripts

```bash
pnpm dev
pnpm build          # requiere DATABASE_URL
pnpm lint
pnpm typecheck
pnpm generate:types # regenera payload-types.ts tras cambios en colecciones
pnpm test:int       # supabase-server, staff roles, MFA helpers, pricing
```

## CI

Build de producción puede omitirse sin `DATABASE_URL`; lint, typecheck e int tests sí se ejecutan.
