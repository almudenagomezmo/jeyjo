## 1. Supabase analytics schema

- [x] 1.1 Add migration for `storefront_sessions` and `storefront_cart_activity` with indexes on `last_seen_at`, `first_seen_at`, `updated_at` (verify: `supabase db reset` applies cleanly)
- [x] 1.2 Add RLS: service_role full access; deny direct anon select; heartbeat writes only via API using service role (verify: anon cannot `select` from sessions table)
- [x] 1.3 Document retention cleanup optional job (sessions older than 90 days) as comment in migration (verify: no runtime requirement v1)

## 2. Storefront analytics beacons

- [x] 2.1 Implement `POST /api/analytics/heartbeat` in storefront with payload validation and basic rate limit (verify: valid POST returns 200, invalid returns 400)
- [x] 2.2 Add `AnalyticsBeacon` client component: 45 s interval, `document.visibilityState`, cart snapshot from `useCartStore`, respects `ANALYTICS_BEACONS_ENABLED` (verify: flag off sends zero fetch calls in test)
- [x] 2.3 Mount beacon in storefront root layout without blocking LCP (verify: dev storefront loads, network tab shows heartbeat after delay)
- [x] 2.4 Set HttpOnly `jeyjo_sid` cookie on first heartbeat response (verify: second request reuses same session_id in DB)

## 3. Dashboard aggregation core (CMS)

- [x] 3.1 Create `apps/cms/src/lib/dashboard/period.ts` resolving presets and `Europe/Madrid` custom ranges (verify: unit tests for today/week/custom boundaries)
- [x] 3.2 Create `aggregateSalesKpis` from Payload orders API/query with cancelled/failed exclusion (verify: fixture 3 orders → correct count and revenue)
- [x] 3.3 Create `aggregateConversion` from `storefront_sessions` + order count (verify: unit test rate null when visitors 0)
- [x] 3.4 Create `aggregateRealtime` for active visitors (5 min) and active carts (30 min, line_count > 0) (verify: unit test with seeded session rows)
- [x] 3.5 Create `buildRecentOrders` top 5 with customerLabel enrichment (verify: matches OMS inbox label rules for guest vs B2B)
- [x] 3.6 Create `buildEvaPanel` from pending EVA orders + stub conversation count (verify: EVA order in seed appears in unresolved list)
- [x] 3.7 Create `buildSystemAlerts` for ERP sync, top-sales low stock, pending customers with role filtering (verify: failed `erp_sync_runs` produces error alert)
- [x] 3.8 Implement top-sales SKU aggregation over `TOP_SALES_WINDOW_DAYS` with batch stock read (verify: top SKU below `DASHBOARD_LOW_STOCK_THRESHOLD` triggers warning)

## 4. Dashboard API and access control

- [x] 4.1 Add `GET /api/dashboard/summary` with staff auth and `period` query params (verify: 401 without session, 403 for wrong role on financial fields)
- [x] 4.2 Map `staffRoles` to `roleScope` full | technical | minimal per design (verify: `catalogo` response omits `sales.revenueCents`)
- [x] 4.3 Register route in Payload/Next app with credentials include from admin UI (verify: manual fetch from `/admin` returns JSON)

## 5. Admin UI

- [x] 5.1 Replace `BeforeDashboard` with `DashboardKpisView` component and SCSS (KPI cards, period selector, recent orders table, EVA panel, alerts tray) (verify: `/admin` no longer shows Stripe/seed template text)
- [x] 5.2 Wire `payload.config.ts` `beforeDashboard` to new component (verify: login as superadmin shows KPI cards)
- [x] 5.3 Add client fetch to `/api/dashboard/summary` with period state and 60 s refresh (verify: changing preset refetches data)
- [x] 5.4 Add preview label on EVA panel and links to `/admin/oms/eva`, `/admin/pending-customers`, product admin URLs from alerts (verify: alert links resolve)

## 6. Configuration and docs

- [x] 6.1 Add env vars to `apps/cms/.env.example` and `apps/storefront/.env.example`: `DASHBOARD_LOW_STOCK_THRESHOLD`, `TOP_SALES_WINDOW_DAYS`, `ANALYTICS_BEACONS_ENABLED`, `TZ` (verify: documented defaults 5, 30, true)
- [x] 6.2 Update `apps/cms/README.md` with dashboard landing and role visibility (verify: US-19 referenced)
- [x] 6.3 Seed scenario: one failed `erp_sync_runs` row and pending customer for manual alert check (verify: optional seed block or test fixture)

## 7. Verification

- [x] 7.1 Unit tests: period resolver, sales aggregation, alerts builder, role scope (verify: `pnpm --filter cms test` passes)
- [x] 7.2 Integration test: dashboard summary with seeded order + session returns non-zero conversion (verify: test in cms `tests/int/`)
- [x] 7.3 Manual checklist US-19: period filters, last 5 orders, EVA panel, three alert types, catalogo minimal view
- [x] 7.4 Manual checklist RF-026: order count for today matches OMS filter; low-stock alert when top seller under threshold
