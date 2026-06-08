# ERP catalog sync engine

## Purpose

Orchestrated read-only ERP catalog synchronization from the active adapter into Payload CMS, with scheduled and manual triggers, run metadata, and audit logging.

## Requirements

### Requirement: Catalog read sync orchestrator runs full stub pull

When `systemSettings.webNativeMode` is false, the CMS SHALL expose an orchestrator that pulls all suppliers and products from the active `ErpCatalogReader`, applies them through `ErpCatalogSyncService`, and returns aggregated counters and errors for the run. When `webNativeMode` is true, manual and scheduled catalog sync endpoints SHALL respond with HTTP 410 and SHALL NOT invoke the orchestrator.

#### Scenario: Successful full sync from stub in ERP mode

- **WHEN** `webNativeMode` is false and the orchestrator runs with `ERP_ADAPTER=stub`
- **THEN** supplier and product commercial fields update, `syncErpAt` is refreshed, and the result reports counters

#### Scenario: Catalog sync blocked in web-native mode

- **WHEN** `webNativeMode` is true and staff or cron triggers catalog sync
- **THEN** the response status is 410
- **AND** no Payload commercial fields change

#### Scenario: Partial item failure does not abort batch in ERP mode

- **WHEN** `webNativeMode` is false and one product DTO fails validation during sync but others are valid
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

### Requirement: Catalog sync recalculates stock indicator after ERP stock changes

After a successful catalog read sync that updates product `erpStock` values, the catalog orchestrator SHALL invoke stock indicator recalculation for all SKUs updated in that run without re-pulling wholesale sources.

#### Scenario: ERP stock drop triggers indicator recalculation

- **WHEN** catalog sync updates REF-002 `erpStock` from 50 to 2
- **THEN** `stockIndicator` for REF-002 is recalculated to `low` when threshold is 5, without waiting for the next wholesale stock cron

#### Scenario: Catalog sync failure skips indicator recalculation

- **WHEN** catalog sync aborts due to `ERP_UNAVAILABLE` before applying product updates
- **THEN** no stock indicator recalculation runs and existing indicators remain unchanged

### Requirement: Catalog and stock sync compose without clearing wholesale data

Catalog read sync failures SHALL NOT clear wholesale stock fields; stock sync failures SHALL NOT clear ERP catalog fields populated by catalog sync.

#### Scenario: ERP outage preserves wholesale stock

- **WHEN** catalog sync fails with `ERP_UNAVAILABLE`
- **THEN** `distrisantiagoStock`, `arnoiaStock`, and previously computed `stockIndicator` remain unchanged

### Requirement: Manual Excel import runs persist sync metadata

When catalog sync is triggered from the PIM Excel import apply action, the system SHALL persist an `erp_sync_runs` row and audit log entry with `source=excel_import` and adapter `excel`.

#### Scenario: Excel import run recorded

- **WHEN** staff applies a catalog Excel import that updates 120 products with 0 fatal errors
- **THEN** `erp_sync_runs` contains a row with `adapter=excel`, `source=excel_import`, and `status=success` or `partial`
- **AND** `finished_at` is set

#### Scenario: Failed Excel parse does not create sync run

- **WHEN** dry-run reports blocking workbook errors and staff has not applied
- **THEN** no `erp_sync_runs` row is created
- **AND** Payload ERP fields remain unchanged

### Requirement: Excel import triggers stock indicator recalculation for updated SKUs

After a successful Excel import apply that updates `erpStock` values, the system SHALL recalculate stock indicators for all SKUs updated in that run using the same post-sync hook as scheduled catalog sync.

#### Scenario: Stock indicator updated after Excel import

- **WHEN** Excel import updates `REF-002` `erpStock` from 50 to 2
- **THEN** `stockIndicator` for `REF-002` is recalculated without waiting for the next wholesale stock cron
