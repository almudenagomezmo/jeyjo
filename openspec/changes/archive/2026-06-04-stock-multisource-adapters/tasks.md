## 1. Package and schema foundation

- [x] 1.1 Create `packages/stock-ports` with `StockSourceReader`, `StockSnapshotDto`, `StockIntegrationError`, and exports mirroring `@jeyjo/erp-ports` structure (verify: `pnpm --filter @jeyjo/stock-ports test`)
- [x] 1.2 Add Supabase migration `stock_sync_runs` table with per-source status columns and index on `started_at` (verify: `\d stock_sync_runs` in local DB)
- [x] 1.3 Wire `@jeyjo/stock-ports` into cms and storefront workspace dependencies (verify: `pnpm typecheck` resolves imports)

## 2. Stub adapters and fixtures

- [x] 2.1 Implement stub Distrisantiago and Arnoia readers with REF-001..004 fixtures and independent failure simulation (verify: `pnpm --filter @jeyjo/stock-ports test`)
- [x] 2.2 Implement `resolveStockIndicator` pure function with `STOCK_LOW_THRESHOLD` default 5 covering available/low/limited/stale cases (verify: unit tests for CA-ERP-001 REF-002 scenario)
- [x] 2.3 Add CMS stock registry resolving `STOCK_DISTRI_ADAPTER` / `STOCK_ARNOIA_ADAPTER` with stub default and `STOCK_NOT_IMPLEMENTED` for unregistered ftp/web (verify: registry unit test)

## 3. Payload fields and guards

- [x] 3.1 Extend `erpFields.ts` with `distrisantiagoStock`, `arnoiaStock`, `stockIndicator`, `syncDistrisantiagoAt`, `syncArnoiaAt`; regenerate payload types (verify: admin shows read-only stock tab fields)
- [x] 3.2 Add `stockSync` context guard (extend `erpProductBeforeChange` or parallel hook) blocking manual edits to stock sync fields (verify: int test staff save rejected)
- [x] 3.3 Update seed `jeyjo-catalog.ts` with `mainWholesaleRef` values aligned to stub fixtures for REF-001..004 (verify: seed runs without errors)

## 4. Stock sync orchestrator and triggers

- [x] 4.1 Implement `StockSyncOrchestrator` matching snapshots to products, updating wholesale fields, recalculating indicators, writing `stock_sync_runs` + `audit_log` (verify: orchestrator unit test with mocked Payload)
- [x] 4.2 Add cron route `GET /api/cron/stock-sync` protected by `CRON_SECRET`; document env vars in `apps/cms/.env.example`; add `vercel.json` schedule 15m (verify: 401 without secret, 200 with secret)
- [x] 4.3 Add manual admin stock sync route for non-production (verify: POST returns JSON counters)
- [x] 4.4 Handle per-source `STOCK_UNAVAILABLE` without clearing prior quantities; mark run `partial` (verify: stub outage test — RNF-007)

## 5. Catalog sync integration

- [x] 5.1 After `runCatalogSyncRead()` product updates, invoke indicator recalculation for changed SKUs without re-pulling wholesale sources (verify: ERP stock 50→2 updates indicator to `low` in int test)
- [x] 5.2 Ensure catalog sync failure does not trigger recalculation or clear wholesale fields (verify: `ERP_UNAVAILABLE` simulation test)

## 6. Storefront stock read

- [x] 6.1 Add CSS tokens `--stock-available`, `--stock-low`, `--stock-limited` in `apps/storefront/src/app/globals.css` (verify: tokens present before any stock UI in #11)
- [x] 6.2 Implement `getStockIndicator(sku)` server helper with CMS fetch, wildcard/draft filter, cache 60s, no numeric fields in return type (verify: storefront unit test)
- [x] 6.3 Add optional `GET /api/stock/[sku]` returning public indicator JSON only (verify: response body has no `erpStock`/`distrisantiagoStock` keys)
- [x] 6.4 Document `STOCK_LOW_THRESHOLD` in `apps/storefront/.env.example` (verify: env documented)

## 7. Integration verification

- [x] 7.1 CMS integration test: full stock sync stub run updates wholesale fields and indicators for seeded products (verify: `pnpm --filter cms test:int stock-sync`)
- [x] 7.2 End-to-end scenario test: REF-002 shows `low` after ERP+catalog sync with threshold 5 — CA-ERP-001 partial (verify: int or combined test)
- [x] 7.3 Run monorepo typecheck and document stock sync workflow in `apps/cms/README.md` (verify: `pnpm typecheck` passes)
