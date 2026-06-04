## ADDED Requirements

### Requirement: Catalog read sync orchestrator runs full stub pull

The CMS SHALL expose an orchestrator that pulls all suppliers and products from the active `ErpCatalogReader`, applies them through `ErpCatalogSyncService`, and returns aggregated counters and errors for the run.

#### Scenario: Successful full sync from stub

- **WHEN** the orchestrator runs with `ERP_ADAPTER=stub` and Payload contains seeded products matching stub SKUs
- **THEN** supplier and product ERP fields update, `syncErpAt` is refreshed, and the result reports non-zero `productsUpdated` or `suppliersUpdated` when changes exist

#### Scenario: Partial item failure does not abort batch

- **WHEN** one product DTO fails validation during sync but others are valid
- **THEN** valid products still update and the result includes an error entry for the failed SKU

### Requirement: Scheduled sync trigger is protected

The system SHALL expose a cron-invokable HTTP route that runs the catalog read orchestrator only when presented with a valid `CRON_SECRET` bearer token.

#### Scenario: Cron with valid secret

- **WHEN** a request includes `Authorization: Bearer <CRON_SECRET>` matching configuration
- **THEN** the orchestrator executes and returns HTTP 200 with sync summary JSON

#### Scenario: Cron without valid secret

- **WHEN** a request omits or presents an invalid cron secret
- **THEN** the route responds with HTTP 401 and does not mutate catalog data

### Requirement: Manual admin sync trigger remains available in non-production

The existing admin-authenticated manual sync endpoint SHALL remain available for development and staging manual runs.

#### Scenario: Admin manual sync in development

- **WHEN** an authenticated admin user POSTs to the manual sync route in non-production
- **THEN** the same orchestrator runs and returns sync summary JSON

### Requirement: Sync runs are auditable

Each orchestrator execution SHALL insert an immutable row into Supabase `audit_log` summarizing adapter id, counts, status, and error summary when applicable.

#### Scenario: Failed ERP read logged

- **WHEN** the active adapter rejects with `ERP_UNAVAILABLE`
- **THEN** no Payload ERP fields are cleared, and `audit_log` records status `error_erp` for the sync attempt

### Requirement: Sync run metadata is persisted

The system SHALL persist each orchestrator execution in `erp_sync_runs` with timestamps, adapter name, counters, and terminal status (`success`, `partial`, or `failed`).

#### Scenario: Last successful run timestamp available

- **WHEN** a sync completes with at least one successful product or supplier update and no fatal adapter error
- **THEN** `erp_sync_runs` contains a row with `status=success` or `partial` and `finished_at` set
