## ADDED Requirements

### Requirement: Search queue statistics exposed for operations

The CMS SHALL expose a server function `getSearchQueueStats()` returning counts of `search_events` by status (`pending`, `processing`, `error`) and the age in seconds of the oldest pending row, for use by dashboard KPIs and alerts.

#### Scenario: Stats with pending backlog

- **WHEN** `search_events` contains 12 pending and 2 error rows and the oldest pending was created 400 seconds ago
- **THEN** `getSearchQueueStats()` returns `{ pending: 12, processing: 0, error: 2, oldestPendingAgeSec: 400 }` (approximate)

#### Scenario: Empty queue

- **WHEN** no rows exist with status `pending`, `processing`, or `error`
- **THEN** all counts are zero and `oldestPendingAgeSec` is 0

### Requirement: Optional dev post-save indexer trigger

When `SEARCH_INDEX_ON_SAVE=true` and `NODE_ENV` is not `production`, after a successful `enqueueSearchEvent` from catalog hooks, the CMS MAY invoke `runSearchIndexerBatch` with a small batch size asynchronously without blocking the save response.

#### Scenario: Dev flag triggers immediate batch

- **WHEN** `SEARCH_INDEX_ON_SAVE=true` in development and a product is saved
- **THEN** a search event is enqueued
- **AND** an indexer batch runs in the background without delaying the admin HTTP response

#### Scenario: Production ignores post-save trigger

- **WHEN** `SEARCH_INDEX_ON_SAVE=true` in production
- **THEN** hooks enqueue only; no synchronous or fire-and-forget indexer invocation occurs on save

### Requirement: Search reliability documented in CMS runbook

The CMS README and `docs/qdrant.md` SHALL document: required env vars (`CRON_SECRET`, `QDRANT_URL`, `QDRANT_API_KEY`), cron routes (indexer, reconcile, orphan cleanup), backfill endpoint, and first-time Qdrant Cloud bootstrap steps (collections + backfill + monitor pending).

#### Scenario: Developer follows bootstrap runbook

- **WHEN** a developer configures a new Qdrant Cloud cluster
- **THEN** documentation describes creating collections via Payload `onInit`, running backfill, and verifying suggest with zero pending events
