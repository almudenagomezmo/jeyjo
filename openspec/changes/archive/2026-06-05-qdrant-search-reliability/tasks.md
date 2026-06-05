## 1. Search queue stats and shared helpers

- [x] 1.1 Add `getSearchQueueStats()` in `apps/cms/src/search-indexer/queueStats.ts` (pending/processing/error counts + oldest pending age) with Supabase service role (verify: unit test or int test with mocked Supabase)
- [x] 1.2 Add `hasPendingSearchEvent(entityType, entityId)` helper in `searchEvents.ts` for dedup before enqueue (verify: int test duplicate suppression)
- [x] 1.3 Add env defaults documented in `apps/cms/.env.example`: `SEARCH_RECONCILE_STALE_HOURS`, `SEARCH_RECONCILE_ERROR_WINDOW_HOURS`, `ORPHAN_CLEANUP_MAX_DELETES`, `SEARCH_INDEX_ON_SAVE` (verify: vars listed with comments)

## 2. Reconciliation worker and cron

- [x] 2.1 Implement `runSearchReconcile()` in `apps/cms/src/search-indexer/reconcile.ts` — stale product/category detection via Payload paginated query + last `done` event comparison (verify: int test enqueues stale product, skips fresh)
- [x] 2.2 Extend reconcile with error retry reset (`status=error` within window, `_reconcileAttempts < 3`) (verify: int test resets error row to pending)
- [x] 2.3 Add `GET /api/cron/search-reconcile/route.ts` with `CRON_SECRET` auth and `maxDuration` 120 (verify: `pnpm test:int search-reconcile-cron` unauthorized → 401)
- [x] 2.4 Register hourly cron in `apps/cms/vercel.json` (verify: cron path present in vercel.json test or existing cron int pattern)

## 3. Orphan cleanup worker and cron

- [x] 3.1 Add Qdrant scroll helper in `apps/cms/src/lib/qdrant.ts` (or search-indexer module) for batched point id iteration (verify: mocked scroll returns ids)
- [x] 3.2 Implement `runSearchOrphanCleanup()` — delete points for missing/draft/wildcard Payload docs, respect `ORPHAN_CLEANUP_MAX_DELETES` (verify: int test deletes orphan id, keeps valid published)
- [x] 3.3 Add `GET /api/cron/search-orphan-cleanup/route.ts` with `CRON_SECRET` auth (verify: unauthorized → 401)
- [x] 3.4 Register daily cron `0 4 * * *` in `vercel.json` (verify: entry exists)

## 4. Backfill and dev ergonomics

- [x] 4.1 Add `POST /next/search-backfill/route.ts` (admin auth, non-prod pattern aligned with `process-search-events`) calling enqueue for all published products/categories with dedup (verify: int test returns enqueued counts)
- [x] 4.2 Optional: wire `SEARCH_INDEX_ON_SAVE` fire-and-forget batch in `searchEventHooks.ts` for dev only (verify: hook test mocks batch invocation when flag true)
- [x] 4.3 Update `apps/cms/docs/qdrant.md` and `apps/cms/README.md` with bootstrap runbook (CRON_SECRET, backfill, monitor pending) (verify: docs mention all three cron routes)

## 5. Dashboard KPIs and alerts

- [x] 5.1 Create `SearchQueueKpiCards` component using design tokens from existing dashboard patterns; render pending/processing/error/lag from `getSearchQueueStats()` (verify: component renders zero state)
- [x] 5.2 Add optional Qdrant coverage ratio card with 5-minute cache and graceful fallback (verify: em dash when Qdrant count fails)
- [x] 5.3 Extend system alerts tray with search index health rules (warning/error thresholds per spec) (verify: int test or component test triggers warning at lag > 300s)
- [x] 5.4 Mount KPI cards in admin `beforeDashboard` alongside existing KPI dashboard (#30) (verify: `/admin` shows search queue section)

## 6. Integration tests and manual verification

- [x] 6.1 Add `tests/int/search-reconcile.int.spec.ts` covering stale enqueue, dedup, error retry (verify: `pnpm --filter @jeyjo/cms test:int search-reconcile`)
- [x] 6.2 Add `tests/int/search-orphan-cleanup.int.spec.ts` with mocked Qdrant scroll + Payload (verify: test passes in CI)
- [x] 6.3 Manual E2E checklist: set `CRON_SECRET`, run backfill, drain indexer until pending=0, storefront suggest returns products for known query (verify: RF-009 <60s after save in staging)

## 7. Roadmap and ops

- [x] 7.1 Add `qdrant-search-reliability` row to `openspec/ROADMAP.md` (depends #13, #14, #30, #42; status Pendiente) (verify: row present with correct deps)
- [x] 7.2 Document Vercel env requirements for CMS production (QDRANT_*, CRON_SECRET) in `apps/cms/docs/production.md` if not already complete (verify: production.md lists search crons)
