# Payload backoffice hooks

## Purpose

Server-side Payload hooks that enqueue search indexing events and append audit log entries in Supabase when backoffice users mutate catalog and order data.

## Requirements

### Requirement: Catalog changes enqueue search events

On create, update, or delete of a product or category, the CMS SHALL insert a row into Supabase `search_events` with status pending for async indexing (RF-009 preparation).

#### Scenario: Product update enqueues event

- **WHEN** a staff user saves an existing product
- **THEN** a `search_events` row exists with `entity_type` producto, the product id, action update, and a json payload containing indexable fields

#### Scenario: Category delete enqueues event

- **WHEN** a staff user deletes a category
- **THEN** a `search_events` row exists with action delete for that category id

### Requirement: Backoffice CRUD writes audit log

On create, update, or delete of business collections (`products`, `categories`, `suppliers`, `orders`) and staff-relevant collections (`users`, `media`, `pages`), the CMS SHALL append an immutable row to Supabase `audit_log` with actor, entity, action, `previous_value` and `new_value` on updates (field-level diff for configured sensitive fields), `source_ip` from the request when available, and timestamps managed by the database.

#### Scenario: Product create audited

- **WHEN** a staff user creates a product
- **THEN** an `audit_log` entry records the staff user id, entity type product, entity id, action create, and `new_value` metadata

#### Scenario: Product price update stores diff

- **WHEN** a staff user updates `p1Price` on an existing product
- **THEN** `audit_log.previous_value` contains the prior `p1Price`
- **AND** `audit_log.new_value` contains the new `p1Price`

#### Scenario: User role change audited

- **WHEN** superadmin updates `staffRoles` on a staff user
- **THEN** an `audit_log` entry records previous and new role arrays

### Requirement: Hook failures do not roll back Payload save

If Supabase insert for search events or audit log fails, the Payload document save SHALL still succeed and the failure SHALL be logged server-side.

#### Scenario: Search event insert fails

- **WHEN** `search_events` insert fails due to transient DB error
- **THEN** the product save completes and an error is written to server logs for retry or ops follow-up

#### Scenario: Audit insert fails

- **WHEN** `audit_log` insert fails after a successful product save
- **THEN** the product document remains persisted
- **AND** server logs contain the failure for operations follow-up

### Requirement: Hooks use service role Supabase client

Server-side hooks SHALL use a Supabase client configured with service role credentials, not the anon key, to write to `search_events` and `audit_log`.

#### Scenario: Service role insert

- **WHEN** hooks run in a server context with valid `SUPABASE_SERVICE_ROLE_KEY`
- **THEN** inserts to protected tables succeed without RLS denial for authenticated storefront users

### Requirement: Audit helper captures client IP

The `writeAuditLog` function SHALL accept optional `sourceIp` derived from `x-forwarded-for` or connection IP and persist it to `audit_log.source_ip`.

#### Scenario: Update includes IP

- **WHEN** a staff user updates a category from a request with `x-forwarded-for` set
- **THEN** the corresponding `audit_log` row has non-null `source_ip`
