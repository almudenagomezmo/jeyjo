## Why

RF-009 and US-01 depend on Qdrant as the primary search engine, but the current implementation (#13 `search-events-qdrant-worker`) only drains the `search_events` queue on a one-minute cron. It does not detect drift when hooks fail to enqueue, when the catalog was loaded before indexing existed, when Qdrant was temporarily unavailable (terminal `error` rows), or when orphaned vectors remain after deletes. Operational gaps surfaced in dev (403/404 Qdrant auth, empty collections, suggest returning errors or empty results despite a populated Payload catalog). Search is business-critical; the platform needs explicit reconciliation, backfill, cleanup, and observability—not only eventual consistency via the happy path.

## What Changes

- Add a **reconciliation cron** (`GET /api/cron/search-reconcile`) that re-enqueues stale published products and categories, and resets recent terminal `error` events for retry.
- Add a **backfill admin endpoint** (dev + authenticated staff) to enqueue all publishable catalog entities for initial or disaster recovery indexing.
- Add a **daily orphan cleanup cron** (`GET /api/cron/search-orphan-cleanup`) that removes Qdrant points with no matching published Payload document.
- Extend **search indexer observability**: queue depth KPIs and search-index health alerts on the admin dashboard (integrates with #30 KPI dashboard and system alerts tray).
- Document and enforce **`CRON_SECRET`** for all search crons in `.env.example` and CMS README; register new schedules in `vercel.json`.
- Optional dev flag **`SEARCH_INDEX_ON_SAVE`**: fire-and-forget single-batch worker trigger after successful enqueue (non-production only; does not replace cron).
- Ensure ERP/catalog import paths continue to enqueue; reconciliation covers gaps when enqueue silently fails.

**Non-goals:**

- Synchronous Qdrant upsert inside Payload `afterChange` hooks (blocks admin, poor serverless fit).
- Full Qdrant scroll vs Payload compare every minute (too expensive at 30k products).
- Indexing `pages` collection (Qdrant collection exists but no hooks today—separate change if needed).
- Voice search / EVA integration (post-EVA, RF-009 phase 2).
- Changing embedding model or vector dimension (would require collection recreation runbook).

## Capabilities

### New Capabilities

- `qdrant-search-reconciliation`: Reconciliation cron, error retry policy, stale-entity detection, orphan cleanup, and catalog backfill endpoints.

### Modified Capabilities

- `qdrant-search-indexer`: Add requirements for reconciliation/backfill/cleanup crons, extended retry semantics, and operational runbook expectations.
- `backoffice-system-alerts`: Add search-index health alert when `search_events` error count or queue lag exceeds configured thresholds.
- `backoffice-kpi-dashboard`: Add search queue KPI cards (pending, processing, error counts; optional Qdrant vs published ratio).

## Impact

- **apps/cms**: new routes under `src/app/(app)/api/cron/search-reconcile`, `search-orphan-cleanup`; new module `src/search-indexer/reconcile.ts` (or similar); optional hook extension for dev on-save trigger; dashboard components for KPIs/alerts; `vercel.json` cron entries; `.env.example` + docs.
- **Supabase**: read-heavy queries on `search_events`; no schema migration required (reuse existing table and statuses).
- **Qdrant Cloud**: scroll API usage on daily cleanup; increased upsert volume during backfill.
- **Storefront**: no code changes; benefits from reliable suggest/search once index is healthy.
- **Dependencies**: builds on completed changes #13 (`search-events-qdrant-worker`), #14 (`predictive-search-ui`), #30 (`dashboard-kpis-alerts`), #42 (`system-config-backoffice`). Does not block roadmap items #33–#46.
