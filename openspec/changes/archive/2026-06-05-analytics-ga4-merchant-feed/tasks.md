## 1. GA4 core module (storefront)

- [x] 1.1 Create `apps/storefront/src/lib/analytics/ga4.ts` with `ga4Enabled`, item mappers, and `trackPageView` / `trackViewItem` / `trackAddToCart` / `trackBeginCheckout` / `trackPurchase` no-op when disabled (verify: unit tests pass with mocked `window.gtag`)
- [x] 1.2 Add `Ga4Script` component loading `gtag.js` via `next/script` when measurement ID set (verify: enabled flag off renders no script tag in test)
- [x] 1.3 Add `Ga4PageView` client component using `usePathname` to fire `page_view` on route changes (verify: navigation mock calls `trackPageView` twice)
- [x] 1.4 Mount `Ga4Script` + `Ga4PageView` in public `app/layout.tsx` only — exclude intranet layout (verify: intranet layout has no GA4 imports)

## 2. GA4 funnel hooks

- [x] 2.1 Wire `trackViewItem` in PDP buy box or client wrapper after product hydrate (verify: PDP test asserts one view_item payload)
- [x] 2.2 Wire `trackAddToCart` in centralized cart add path (`useCartStore` or shared add helper) covering PDP, minicart, repeat purchase, quick order (verify: add line triggers event in cart store test)
- [x] 2.3 Wire `trackBeginCheckout` once per checkout session when cart non-empty (verify: checkout mount test fires single begin_checkout)
- [x] 2.4 Refactor `/checkout/confirmacion` to server-fetch order snapshot by `order` query param and pass to client `PurchaseTracker` (verify: paid order renders line items server-side)
- [x] 2.5 Implement `PurchaseTracker` emitting client `purchase` when `paid=1` (verify: confirmation page test sends purchase with transaction_id)
- [x] 2.6 Add optional `POST /api/analytics/ga4-purchase` Measurement Protocol forward when `GA4_API_SECRET` set (verify: mock fetch to Google MP endpoint with same transaction_id)

## 3. Merchant feed builder (CMS)

- [x] 3.1 Create `apps/cms/src/lib/feeds/merchant-center/types.ts` and `buildMerchantFeedXml(rows)` producing valid RSS 2.0 + `xmlns:g` (verify: unit test snapshot XML structure)
- [x] 3.2 Implement `fetchPublicCatalogRows(payload)` paginating published non-wildcard products with P1+IVA price, brand, gtin, absolute PDP link (verify: fixture catalog returns expected row count)
- [x] 3.3 Map stock semaphore to `g:availability` reusing CMS stock resolution logic (verify: in_stock vs out_of_stock mapping test)
- [x] 3.4 Resolve `image_link` via `@jeyjo/catalog-images` `resolveCatalogImage`; skip rows without image (verify: product without image omitted, counted)
- [x] 3.5 Upload snapshot to Supabase Storage bucket `merchant-feeds/latest.xml` with `generatedAt` metadata (verify: cron writes object; local dev skips gracefully if bucket missing)

## 4. Merchant feed routes and cron

- [x] 4.1 Add `GET /api/feeds/merchant-center.xml` streaming snapshot with `Cache-Control`, `ETag`, `Last-Modified` (verify: curl returns 200 XML when snapshot exists)
- [x] 4.2 Add `GET /api/cron/merchant-feed` protected by `CRON_SECRET` calling builder + upload + updating global timestamp (verify: unauthorized returns 401)
- [x] 4.3 Register cron in `apps/cms/vercel.json` daily schedule (e.g. `0 3 * * *`) (verify: vercel.json entry present)
- [x] 4.4 Respect `MERCHANT_FEED_ENABLED` env and global kill switch (verify: disabled returns 404/503 on public route)
- [x] 4.5 Surface repeated cron failure alert via existing dashboard alerts pattern (verify: two mocked failures create alert row)

## 5. Backoffice analytics settings

- [x] 5.1 Add Payload global `analyticsSettings` (ga4MeasurementId doc field, merchantFeedEnabled, lastFeedGeneratedAt, omittedCounts JSON) (verify: admin saves and reads back)
- [x] 5.2 Restrict global access to `superadmin` and `mantenimiento` roles (verify: `catalogo` role denied)
- [x] 5.3 Add admin UI section showing computed public feed URL and last run stats with env precedence help text (verify: help mentions `.env.example` vars)
- [x] 5.4 Cron updates `lastFeedGeneratedAt` and omitted product counts after each run (verify: post-cron global reflects new timestamp)

## 6. Configuration, docs, and verification

- [x] 6.1 Add env vars to `apps/storefront/.env.example`: `NEXT_PUBLIC_GA4_MEASUREMENT_ID`, `NEXT_PUBLIC_GA4_ENABLED`, `GA4_API_SECRET` (verify: documented defaults false/empty)
- [x] 6.2 Add env vars to `apps/cms/.env.example`: `MERCHANT_FEED_ENABLED`, `MERCHANT_FEED_BASE_URL`, `CRON_SECRET` note for merchant-feed (verify: documented)
- [x] 6.3 Update `apps/cms/README.md` with merchant feed URL, cron curl example, and GA4 env pointer (verify: RF-028 referenced)
- [x] 6.4 Update `apps/storefront/README.md` noting GA4 public storefront only and coexistence with analytics beacons (verify: both flags documented)
- [x] 6.5 Manual checklist RF-028: GA4 DebugView shows view_item, add_to_cart, begin_checkout, purchase on test order (verify: checklist in docs or PR template)
- [x] 6.6 Manual checklist RI-008: feed validates in Google Merchant Center / Content API test tool; product with image, price, URL present (verify: sample SKU in staging feed)
