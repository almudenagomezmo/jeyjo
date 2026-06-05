## 1. SystemSettings global (CMS)

- [x] 1.1 Create `apps/cms/src/globals/SystemSettings.ts` with tabbed fields: shipping (B2C/B2B threshold+cost), stock low threshold, dashboard (topSalesWindowDays, dashboardLowStockThreshold), ERP catalogStalenessHours, contact (phone/email/WhatsApp + Alfaro/Rincón store blocks), search toggles (predictiveEnabled, suggestLimit, minQueryLength) with v1 defaults (verify: global appears in Payload admin after boot)
- [x] 1.2 Register `SystemSettings` in `payload.config.ts` globals array and run generate types (verify: `pnpm --filter cms exec payload generate:types` updates `payload-types.ts`)
- [x] 1.3 Implement role-based access on global sections per design matrix (verify: `catalogo` user cannot update shipping fields)
- [x] 1.4 Add `afterChange` hook writing `audit_log` for `systemSettings` updates (verify: saving B2C threshold creates audit entry with old/new JSON)
- [x] 1.5 Seed default `systemSettings` on empty global via onInit or documented seed script (verify: fresh DB has v1 defaults 39/5 B2C, 10/2.5 B2B, stock threshold 5)

## 2. Config resolver and public API (CMS)

- [x] 2.1 Create `apps/cms/src/lib/system-config/resolve.ts` with `getSystemConfig()` applying CMS → env → defaults precedence (verify: unit tests for each precedence layer)
- [x] 2.2 Create `apps/cms/src/lib/system-config/types.ts` exporting `SystemConfigDto` (verify: types match design contract)
- [x] 2.3 Add `GET /api/system/config` route returning DTO with `Cache-Control: public, max-age=60` (verify: curl returns JSON without auth; no secrets in body)
- [x] 2.4 Add validation on global fields (non-negative costs/thresholds, sensible min/max on suggestLimit) (verify: negative cost rejected on save)

## 3. Admin hub UI

- [x] 3.1 Create `SystemConfigHubView` custom admin view at `/admin/system-config` with cards linking to systemSettings tabs and existing globals (payments, marketing, SKAI, analytics, audit console) (verify: superadmin sees all cards)
- [x] 3.2 Register view in `payload.config.ts` admin.components.views and add nav group "Configuración del sistema" (verify: sidebar entry visible to superadmin)
- [x] 3.3 Unhide or link `skaiSettings` and `analyticsSettings` from hub; add read-only security/docs section for WAF/TLS (verify: mantenimiento sees search + ERP sections, not shipping edit)
- [x] 3.4 Style hub with existing Payload SCSS patterns (verify: no hardcoded hex outside design tokens if shared components used)

## 4. Storefront system-config consumer

- [x] 4.1 Create `apps/storefront/src/lib/system-config/fetch.ts` with `fetchSystemConfig()` using `unstable_cache` / revalidate 60 against CMS API (verify: unit test mocks API response and cache)
- [x] 4.2 Refactor `apps/storefront/src/lib/cart/shipping.ts`: export pure `computeShippingPreview(subtotal, mode, rules)`; add async `getShippingRules()` from system config (verify: existing cart-shipping tests pass with injected rules)
- [x] 4.3 Update checkout page/route and `place-order` to resolve shipping from config at request time (verify: B2C 38€ subtotal charges configured cost)
- [x] 4.4 Update cart page and minicart to receive shipping rules from server parent props (verify: banner shows remaining amount using CMS threshold)
- [x] 4.5 Update `apps/storefront/src/lib/stock/get-stock-indicator.ts` to use config low threshold (verify: threshold 8 from mocked config yields `low` at stock 6)
- [x] 4.6 Update `apps/storefront/src/lib/search/search-flags.ts` to respect `predictiveEnabled` from config (verify: disabled flag returns no suggest even when QDRANT_URL set)
- [x] 4.7 Wire footer/contact components to read support phone/email from config (verify: changed phone appears after config fetch)

## 5. CMS internal consumers

- [x] 5.1 Update `apps/cms/src/lib/dashboard/top-sales.ts` and alerts builder to use `resolveOperationalThresholds()` (verify: unit test uses CMS values over env)
- [x] 5.2 Update `apps/cms/src/stock/recalculateIndicators.ts` to read stock threshold from resolver (verify: int test threshold 8 matches global)
- [x] 5.3 Update `apps/cms/src/eva/resolve-context.ts` shipping policy from config rules (verify: changed B2C threshold reflected in EVA context string)
- [x] 5.4 Implement EVA contact fallback: prefer `skaiSettings` then `systemSettings.contact` (verify: SKAI phone wins when both set)

## 6. Documentation and env

- [x] 6.1 Update `apps/cms/.env.example` and `apps/storefront/.env.example`: mark `STOCK_LOW_THRESHOLD`, `DASHBOARD_LOW_STOCK_THRESHOLD`, `TOP_SALES_WINDOW_DAYS`, `CATALOG_STALENESS_HOURS` as fallbacks; document CMS precedence (verify: comments reference `/admin/system-config`)
- [x] 6.2 Update `apps/cms/README.md` with system config hub, role matrix, and API URL (verify: Alcance §1.36 referenced)
- [x] 6.3 Update `apps/storefront/README.md` with `fetchSystemConfig` and shipping config source (verify: RF-013 noted)

## 7. Verification

- [x] 7.1 Unit tests: config resolver precedence, shipping compute with custom rules, search flags (verify: `pnpm --filter cms test` and `pnpm --filter storefront test` pass)
- [x] 7.2 Integration test: change B2C threshold in global → API returns new value → checkout shipping calculation uses it (verify: cms or storefront int test)
- [x] 7.3 Manual checklist Alcance §1.36: hub navigation, shipping edit + audit log, stock threshold affects PDP semaphore, dashboard alert threshold change, search disable toggle
- [x] 7.4 Manual checklist RF-013: B2B/B2C portes from admin without code change; cart banner and checkout agree on same rules
