## ADDED Requirements

### Requirement: Catalog changes enqueue search events

On create, update, or delete of a product or category, the CMS SHALL insert a row into Supabase `search_events` with status pending for async indexing (RF-009 preparation).

#### Scenario: Product update enqueues event

- **WHEN** a staff user saves an existing product
- **THEN** a `search_events` row exists with `entity_type` producto, the product id, action update, and a json payload containing indexable fields

#### Scenario: Category delete enqueues event

- **WHEN** a staff user deletes a category
- **THEN** a `search_events` row exists with action delete for that category id

### Requirement: Backoffice CRUD writes audit log

On create, update, or delete of business collections (`products`, `categories`, `suppliers`, `orders`), the CMS SHALL append an immutable row to Supabase `audit_log` with actor, entity, and action metadata (RF-029 preparation).

#### Scenario: Product create audited

- **WHEN** a staff user creates a product
- **THEN** an `audit_log` entry records the staff user id, entity type product, entity id, and action create

### Requirement: Hook failures do not roll back Payload save

If Supabase insert for search events or audit log fails, the Payload document save SHALL still succeed and the failure SHALL be logged server-side.

#### Scenario: Search event insert fails

- **WHEN** `search_events` insert fails due to transient DB error
- **THEN** the product save completes and an error is written to server logs for retry or ops follow-up

### Requirement: Hooks use service role Supabase client

Server-side hooks SHALL use a Supabase client configured with service role credentials, not the anon key, to write to `search_events` and `audit_log`.

#### Scenario: Service role insert

- **WHEN** hooks run in a server context with valid `SUPABASE_SERVICE_ROLE_KEY`
- **THEN** inserts to protected tables succeed without RLS denial for authenticated storefront users
