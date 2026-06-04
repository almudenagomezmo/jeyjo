# Search events queue

## Purpose

Async event queue in Supabase for catalog indexing to Qdrant (RF-009), decoupled from the main request path.

## Requirements

### Requirement: Search events table implements async indexing queue

The database SHALL expose `public.search_events` with columns: `id` (uuid PK), `entity_type` (text), `entity_id` (uuid), `action` (text: `upsert` | `delete`), `payload` (jsonb), `status` (text: `pending` | `processing` | `done` | `error`), `error_message` (text nullable), `created_at`, `processed_at` (nullable).

#### Scenario: Backoffice change enqueues event

- **WHEN** a catalog entity change is recorded (future Payload hook)
- **THEN** a row is inserted with `status = 'pending'` and non-null `entity_type`, `entity_id`, `action`

#### Scenario: Worker marks completion

- **WHEN** the Qdrant indexer worker (change #13) finishes processing an event
- **THEN** `status` becomes `done` and `processed_at` is set

### Requirement: Indexes support queue throughput at RD-001 scale

The table SHALL have indexes on `(status, created_at)` for worker polling and on `(entity_type, entity_id)` for deduplication lookups, suitable for tens of thousands of catalog entities and frequent updates.

#### Scenario: Pending queue poll is efficient

- **WHEN** the worker queries `WHERE status = 'pending' ORDER BY created_at LIMIT 100`
- **THEN** the query uses the status index (verified in local `EXPLAIN` during implementation)

### Requirement: Failed events retain error context

Rows with `status = 'error'` SHALL store `error_message` and MUST NOT be deleted automatically; operational cleanup is a separate admin process.

#### Scenario: Qdrant unavailable

- **WHEN** processing fails after retries
- **THEN** the row remains with `status = 'error'` and a non-empty `error_message` for dashboard alerting (RF-009 verification criterion)
