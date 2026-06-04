## 1. Schema and stub fixtures

- [x] 1.1 Add Supabase migration `erp_sync_runs` table with indexes on `started_at` (verify: `\d erp_sync_runs` in local DB)
- [x] 1.2 Extend `packages/erp-ports` stub `sample-data.ts` with REF-001..004, SKU 9000000001 wildcard, and aligned pricing reader fixtures (verify: `pnpm --filter @jeyjo/erp-ports test`)
- [x] 1.3 Update `jeyjo-catalog.ts` seed to include REF-001..004 published products for storefront demos (verify: seed runs without duplicate slug errors)

## 2. Catalog sync service extensions

- [x] 2.1 Extend `ErpCatalogSyncService.applyProduct` to create draft products when SKU missing (verify: int test new SKU creates draft with `erpSync` context)
- [x] 2.2 Implement `ErpPricingSyncService` upserting `special_prices` and `group_offers` from `ErpPricingReader` (verify: query Supabase after run shows REF-004 special price 5.00)
- [x] 2.3 Implement `ErpCatalogSyncOrchestrator` sequencing catalog + pricing sync and writing `erp_sync_runs` + `audit_log` (verify: orchestrator unit test with mocked Payload/Supabase)

## 3. Triggers and resilience

- [x] 3.1 Refactor `syncFromStub.ts` to call orchestrator; keep admin POST route for non-production (verify: manual POST returns JSON counters)
- [x] 3.2 Add cron route protected by `CRON_SECRET` and document in `apps/cms/.env.example`; add `vercel.json` cron schedule default 15m (verify: 401 without secret, 200 with secret)
- [x] 3.3 Handle `ERP_UNAVAILABLE` without clearing Payload data; log `error_erp` in audit (verify: stub failure simulation test — RNF-007 prep)

## 4. Storefront catalog read and wildcard exclusion

- [x] 4.1 Add `fetchProductBySkuFromCms` server helper with cache and CMS auth (verify: server-only, no secret in client bundle grep)
- [x] 4.2 Replace hardcoded `product-catalog.ts` stubs with CMS-backed `getProductPriceBase` (verify: REF-001 returns synced prices after seed+sync)
- [x] 4.3 Add public catalog filter excluding `isWildcard` and non-published products; wire into price resolution (verify: 9000000001 returns null publicly — CA-BACKEND-002 partial)

## 5. Integration verification

- [x] 5.1 Add CMS integration test: full orchestrator run updates ERP fields and pricing tables (verify: `pnpm --filter cms test:int erp-sync`)
- [x] 5.2 Add storefront test for `getProductPriceBase` against mocked CMS response (verify: `pnpm --filter storefront test` pricing module)
- [x] 5.3 Run full monorepo typecheck and document sync workflow in `apps/cms/README.md` ERP section (verify: `pnpm typecheck` passes)
