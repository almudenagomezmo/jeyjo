## Why

Tras el dashboard KPI (#30), la plataforma dispone de beacons internos en Supabase (`storefront-analytics-sessions`) para visitantes y carritos, pero **no cumple RF-028 ni RI-007/RI-008**: no hay eventos GA4 en el embudo de compra ni feed de productos para Google Merchant Center. Sin GA4 el equipo no puede medir conversión en Google Analytics; sin GMC feed los productos no entran en Google Shopping. Es el cambio **#34** del ROADMAP; dependencias **#10** (PLP), **#11** (PDP), **#20** (OMS/pedidos) y **#21** (imágenes SEO dual para `image_link`) están completadas.

## What Changes

- **Integración GA4 en storefront:** cargar `gtag.js` cuando esté configurado y emitir eventos estándar `page_view`, `view_item`, `add_to_cart`, `begin_checkout` y `purchase` con items, revenue y `transaction_id` — **RF-028**, **RI-007**.
- **Capa de eventos reutilizable:** módulo cliente `lib/analytics/ga4.ts` con helpers tipados y feature flag `NEXT_PUBLIC_GA4_ENABLED`; no duplicar lógica en cada componente.
- **Purchase server-assisted:** tras confirmación de pago (Redsys/wallet), la página de éxito o endpoint servidor emite `purchase` con datos del pedido Payload para evitar pérdidas por adblockers — **RI-007** (server-side para datos sensibles).
- **Feed Google Merchant Center:** generador en CMS que exporta catálogo público (id, title, description, link, image_link, price, availability, brand, gtin) en XML RSS 2.0 con namespace Google — **RF-028**, **RI-008**, **RD-004**.
- **Cron nocturno y URL pública:** `GET /api/feeds/merchant-center.xml` (cacheable) regenerado al menos una vez al día vía `GET /api/cron/merchant-feed` con `CRON_SECRET`; snapshot persistido en Supabase Storage o regeneración on-demand con ETag.
- **Configuración mínima en backoffice:** campos globales Payload (measurement ID GA4, URL feed documentada, toggle feed activo) accesibles a rol mantenimiento — sin panel unificado #42.
- **Variables de entorno, tests y documentación** para checklist manual RF-028 (DebugView / tiempo real GA4 + validación feed en Merchant Center).

## Capabilities

### New Capabilities

- `storefront-ga4-events`: Script GA4, helpers de eventos del embudo e-commerce y emisión de `purchase` tras pedido confirmado (**RF-028**, **RI-007**).
- `cms-merchant-center-feed`: Generación, almacenamiento/serving y cron diario del feed GMC con campos obligatorios Google (**RF-028**, **RI-008**).
- `backoffice-analytics-config`: Global Payload con measurement ID, estado del feed y metadatos operativos para staff (**RF-028**).

### Modified Capabilities

- `storefront-analytics-sessions`: Los beacons Supabase coexisten con GA4; documentar que GA4 es la fuente externa de analítica web y los beacons siguen alimentando el dashboard interno.
- `storefront-cart-minicart`: Tras añadir línea al carrito, emitir evento GA4 `add_to_cart` con item payload estándar.
- `storefront-pdp-product-detail`: Al cargar PDP, emitir `view_item` con sku, nombre y precio público resuelto.
- `storefront-checkout-shipping`: Al entrar al checkout con carrito no vacío, emitir `begin_checkout`.

## Impact

- `apps/storefront/src/lib/analytics/ga4.ts` — helpers gtag y mapeo items.
- `apps/storefront/src/components/analytics/Ga4Script.tsx` — montaje condicional en `layout.tsx`.
- `apps/storefront/src/app/checkout/` — `begin_checkout` y página éxito con `purchase`.
- `apps/storefront/src/components/cart/` — hook `add_to_cart` en acciones de carrito/PDP.
- `apps/cms/src/lib/feeds/merchant-center/` — builder XML, query catálogo público, resolución imagen vía `@jeyjo/catalog-images`.
- `apps/cms/src/app/(app)/api/feeds/merchant-center.xml/route.ts` — URL pública del feed.
- `apps/cms/src/app/(app)/api/cron/merchant-feed/route.ts` — regeneración diaria; entrada en `vercel.json`.
- `apps/cms/src/globals/AnalyticsSettings.ts` (o extensión de global existente) — measurement ID y flags.
- Supabase Storage bucket `merchant-feeds` (o tabla snapshot) para artefacto XML versionado.
- Nuevas env: `NEXT_PUBLIC_GA4_MEASUREMENT_ID`, `NEXT_PUBLIC_GA4_ENABLED`, `GA4_API_SECRET` (opcional Measurement Protocol), `MERCHANT_FEED_ENABLED`, `MERCHANT_FEED_BASE_URL`.
- Cumple **RF-028**, **RI-007**, **RI-008**; desbloquea **#43** (`seo-technical-auditor` — auditor complementa feed); complementa **#30** (dashboard interno vs GA4 externo).
- Dependencias satisfechas: **#10** PLP, **#11** PDP, **#20** pedidos confirmados, **#21** imágenes feed, **#8** stock semáforo para `availability`.

## Non-Goals

- **Auditor SEO técnico** (Core Web Vitals, schema crawl, sitemap audit) — cambio **#43**.
- **Panel de configuración global unificado** (#42) — solo global mínimo de analytics/GMC.
- **Google Tag Manager** como capa intermedia — GA4 directo vía gtag en v1.
- **Enhanced conversions / ads remarketing** — fuera de RF-028.
- **Feed multi-idioma o multi-país** — castellano / EUR / España únicamente (RNF-015).
- **Precios B2B personalizados en feed** — catálogo público P1; tarifas B2B no van a GMC.
- **Sustituir beacons Supabase** — siguen alimentando dashboard US-19.
- **Consent Mode / CMP cookie banner** — mejora RGPD posterior; documentar que GA4 requiere consentimiento en producción.
