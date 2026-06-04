## MODIFIED Requirements

### Requirement: Search events table implements async indexing queue

The database SHALL expose `public.search_events` with columns: `id` (uuid PK), `entity_type` (text), `entity_id` (uuid), `action` (text: `upsert` | `delete`), `payload` (jsonb), `status` (text: `pending` | `processing` | `done` | `error`), `error_message` (text nullable), `created_at`, `processed_at` (nullable).

#### Scenario: Backoffice change enqueues event

- **WHEN** a catalog entity change is recorded (Payload hook on products or categories)
- **THEN** a row is inserted with `status = 'pending'` and non-null `entity_type`, `entity_id`, `action`

#### Scenario: Worker marks completion

- **WHEN** the Qdrant indexer worker (change #13) finishes processing an event successfully
- **THEN** `status` becomes `done` and `processed_at` is set

#### Scenario: Worker marks failure with context

- **WHEN** the Qdrant indexer worker exhausts retries or encounters a non-recoverable error for an event
- **THEN** `status` becomes `error`, `error_message` is non-empty, and `processed_at` is set

### Requirement: Failed events retain error context

Rows with `status = 'error'` SHALL store `error_message` and MUST NOT be deleted automatically; operational cleanup is a separate admin process.

#### Scenario: Qdrant unavailable

- **WHEN** processing fails after retries
- **THEN** the row remains with `status = 'error'` and a non-empty `error_message` for dashboard alerting (RF-009 verification criterion)

## ADDED Requirements

### Requirement: Catalog hooks include ERP fields in search event payload

When enqueueing product search events, the CMS SHALL include `skuErp`, `mainWholesaleRef`, `oemRef`, and `ean` in the json `payload` when present on the document.

#### Scenario: Product save enqueues rich payload

- **WHEN** a staff user saves a product with populated ERP reference fields
- **THEN** the inserted `search_events` row `payload` json contains those field values

### Requirement: Processing state is used during worker claim

The worker SHALL set `status = 'processing'` when claiming an event and MUST NOT leave successful events in `processing`.

#### Scenario: Claim transitions to processing

- **WHEN** the worker selects a pending event for work
- **THEN** the row `status` is `processing` before Qdrant or embedding calls begin
