# Qdrant search indexer

## Purpose

CMS batch worker that claims `search_events` rows, generates embeddings, and upserts or deletes Qdrant points for products and categories (RF-009).

## Requirements

### Requirement: Search indexer worker processes pending queue events

The CMS SHALL expose a batch worker that claims rows from `public.search_events` with `status = 'pending'`, processes them in `created_at` order, and transitions each row to `done` or `error` with `processed_at` set on terminal states.

#### Scenario: Pending event indexed successfully

- **WHEN** a row exists with `status = 'pending'`, `entity_type = 'producto'`, `action = 'upsert'`, and the referenced product is published and not wildcard
- **THEN** the worker upserts a point into the Qdrant `products` collection and sets the row to `status = 'done'` with non-null `processed_at`

#### Scenario: Delete event removes Qdrant point

- **WHEN** a row exists with `action = 'delete'` for a previously indexed product
- **THEN** the worker deletes the Qdrant point keyed by `entity_id` and marks the row `done`

### Requirement: Worker uses atomic claim to avoid duplicate processing

The worker SHALL mark claimed rows as `processing` in the same database operation that selects them, so concurrent cron invocations do not process the same event twice.

#### Scenario: Concurrent cron runs

- **WHEN** two worker invocations start within the same second
- **THEN** each claimed event id appears in at most one invocation's batch

### Requirement: Product embeddings include RF-009 indexable fields

For `entity_type = 'producto'` upserts, the embedding input text SHALL concatenate at least: product title, `skuErp`, `mainWholesaleRef`, `oemRef`, `ean`, and category label or slug when available.

#### Scenario: ERP references searchable in index text

- **WHEN** a product with `skuErp` REF-001 and `ean` 8412345678901 is indexed
- **THEN** the Qdrant point payload stores those reference fields and the embedding is generated from text that includes both values

### Requirement: Wildcard and unpublished products are not indexed

Products with `isWildcard = true` or not in published status SHALL NOT remain in the public Qdrant `products` index.

#### Scenario: Wildcard product enqueue results in no public point

- **WHEN** an upsert event is processed for a product with `isWildcard = true`
- **THEN** any existing Qdrant point for that `entity_id` is deleted or not created, and the search event is marked `done` with a skip reason logged (not `error`)

#### Scenario: Unpublished product removed from index

- **WHEN** a published product is reverted to draft and an upsert event is processed
- **THEN** the Qdrant point is deleted or absent after processing

### Requirement: Category entities index to Qdrant categories collection

For `entity_type = 'categoria'`, the worker SHALL upsert or delete points in a Qdrant collection named `categories` with the same vector size as `products` (384).

#### Scenario: Category update indexed

- **WHEN** a category change enqueues an upsert event with title and slug in payload
- **THEN** a point exists in Qdrant `categories` with payload containing title and slug

### Requirement: Embedding dimension matches Qdrant collection config

The embedding service SHALL produce vectors of length 384 for all upserts, matching `qdrant-collections.ts` for `products` and `categories`.

#### Scenario: Dimension mismatch fails fast

- **WHEN** the embedding model returns a vector not of length 384
- **THEN** the worker marks the event `error` with a descriptive `error_message` and does not call Qdrant upsert

### Requirement: Scheduled cron trigger is protected

The system SHALL expose `GET /api/cron/search-indexer` that runs the worker only when `Authorization: Bearer <CRON_SECRET>` matches configuration.

#### Scenario: Cron with valid secret

- **WHEN** a request presents a valid cron bearer token
- **THEN** the worker runs and returns HTTP 200 with batch summary JSON

#### Scenario: Cron without valid secret

- **WHEN** the bearer token is missing or invalid
- **THEN** the route responds HTTP 401 and does not mutate `search_events` or Qdrant

### Requirement: Manual dev trigger for local queue drain

In non-production environments, the CMS SHALL expose an authenticated manual route to run the same worker for local verification.

#### Scenario: Admin manual indexer in development

- **WHEN** an authenticated staff user invokes the manual search indexer route in development
- **THEN** the worker processes pending events and returns the same summary shape as the cron route

### Requirement: Stale processing rows are recovered

Events stuck in `processing` longer than 10 minutes SHALL be reset to `pending` before new claims, so a crashed invocation does not block the queue indefinitely.

#### Scenario: Stale processing reset

- **WHEN** a row has `status = 'processing'` and `created_at` older than 10 minutes without `processed_at`
- **THEN** a subsequent worker run sets `status = 'pending'` before claiming new work
