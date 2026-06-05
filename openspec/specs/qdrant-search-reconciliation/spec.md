# Qdrant search reconciliation

## Purpose

Reconciliation, backfill, and orphan cleanup for the Qdrant search index—closing drift between Payload catalog and vector index when queue events are missed or fail (RF-009 reliability layer).

## Requirements

### Requirement: Hourly reconcile cron re-enqueues stale catalog entities

The CMS SHALL expose `GET /api/cron/search-reconcile` protected by `Authorization: Bearer <CRON_SECRET>` that detects published, non-wildcard products and published categories whose Payload `updatedAt` is newer than their latest `search_events` row with `status = 'done'` (or that have no `done` event), and enqueues `update` events for those entities without duplicating existing `pending` or `processing` rows for the same `entity_type` and `entity_id`.

#### Scenario: Stale product re-enqueued

- **WHEN** a published product was updated 3 hours ago and its latest `search_events` row with `status = 'done'` has `processed_at` older than the product `updatedAt`
- **THEN** reconcile enqueues a new pending `update` event for that product
- **AND** the cron responds HTTP 200 with a summary including `staleProductsEnqueued >= 1`

#### Scenario: Pending event prevents duplicate enqueue

- **WHEN** reconcile runs for a stale product that already has a `search_events` row with `status = 'pending'` for the same `entity_id`
- **THEN** reconcile does not insert a second pending row for that entity
- **AND** the summary includes `skippedDuplicate >= 1`

#### Scenario: Reconcile cron unauthorized

- **WHEN** a request to `/api/cron/search-reconcile` lacks a valid bearer token
- **THEN** the route responds HTTP 401
- **AND** no rows are inserted into `search_events`

### Requirement: Reconcile retries recent terminal error events

The reconcile job SHALL reset `search_events` rows with `status = 'error'`, `processed_at` within the configured error window (default 24 hours), and fewer than three reconcile retry attempts recorded in payload, back to `status = 'pending'` for reprocessing by the search indexer worker.

#### Scenario: Recent error reset to pending

- **WHEN** a product indexing event failed with Qdrant unavailable 2 hours ago and `_reconcileAttempts` in payload is 0
- **THEN** reconcile sets the row to `pending`, increments `_reconcileAttempts`, and preserves the original entity reference
- **AND** a subsequent indexer cron run processes the event

#### Scenario: Error older than window skipped

- **WHEN** an error event has `processed_at` older than the configured error window
- **THEN** reconcile does not reset that row
- **AND** the row remains `error` for manual investigation

### Requirement: Daily orphan cleanup removes invalid Qdrant points

The CMS SHALL expose `GET /api/cron/search-orphan-cleanup` protected by `CRON_SECRET` on a daily schedule that scrolls Qdrant `products` and `categories` collections, and deletes points whose `entity_id` does not correspond to a published Payload document (including deleted, draft, or wildcard products).

#### Scenario: Deleted product point removed

- **WHEN** a point exists in Qdrant `products` for an `entity_id` that no longer exists in Payload
- **THEN** orphan cleanup deletes that point from Qdrant
- **AND** returns a summary with `orphansDeleted >= 1`

#### Scenario: Wildcard product point removed

- **WHEN** a Qdrant `products` point references a Payload product with `isWildcard = true`
- **THEN** orphan cleanup deletes that point

#### Scenario: Cleanup respects per-run delete cap

- **WHEN** more orphan points exist than the configured maximum deletes per run
- **THEN** cleanup deletes up to the cap and completes HTTP 200
- **AND** remaining orphans are eligible on the next daily run

### Requirement: Admin backfill enqueues all publishable catalog entities

In non-production and via authenticated staff routes, the CMS SHALL expose `POST /next/search-backfill` that enqueues `update` events for all published non-wildcard products and all published categories, with duplicate suppression for existing pending/processing events, without performing embeddings inline.

#### Scenario: Backfill after empty Qdrant cluster

- **WHEN** an admin invokes backfill with 500 published products and Qdrant `products` is empty
- **THEN** up to 500 new pending product events are created (minus duplicates skipped)
- **AND** the response JSON includes `enqueuedProducts` and `enqueuedCategories` counts

#### Scenario: Backfill forbidden in production route without admin

- **WHEN** an unauthenticated client calls `POST /next/search-backfill`
- **THEN** the route responds HTTP 403
- **AND** no events are enqueued

### Requirement: Reconcile schedules registered in Vercel

The CMS `vercel.json` SHALL register cron entries for `/api/cron/search-reconcile` (hourly) and `/api/cron/search-orphan-cleanup` (daily) alongside the existing search indexer cron.

#### Scenario: Reconcile cron registered

- **WHEN** the CMS project is deployed to Vercel
- **THEN** `vercel.json` includes a cron path `/api/cron/search-reconcile` with an hourly schedule
