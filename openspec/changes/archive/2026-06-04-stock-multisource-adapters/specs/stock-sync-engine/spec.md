## ADDED Requirements

### Requirement: Stock sync orchestrator pulls wholesale sources and updates products

The CMS SHALL expose `runStockSync()` that reads Distrisantiago and Arnoia via the stock registry, matches snapshots to Payload products by `mainWholesaleRef` with fallback to `skuErp`, updates internal wholesale stock fields under `stockSync` context, and recalculates `stockIndicator` per affected product.

#### Scenario: Successful wholesale sync updates matched products

- **WHEN** the orchestrator runs with stub adapters and Payload contains products whose `mainWholesaleRef` matches stub snapshots
- **THEN** `distrisantiagoStock` and/or `arnoiaStock` update, sync timestamps refresh, and `stockIndicator` is recalculated

#### Scenario: Unmatched wholesale ref preserves previous stock

- **WHEN** a product has no matching snapshot in a source for the current run
- **THEN** the previous quantity for that source remains unchanged and the run continues for other products

### Requirement: Stock sync cron trigger is protected

The system SHALL expose a cron-invokable HTTP route that runs `runStockSync()` only when presented with a valid `CRON_SECRET` bearer token.

#### Scenario: Stock cron with valid secret

- **WHEN** a request includes `Authorization: Bearer <CRON_SECRET>` matching configuration
- **THEN** the stock orchestrator executes and returns HTTP 200 with sync summary JSON

#### Scenario: Stock cron without valid secret

- **WHEN** a request omits or presents an invalid cron secret
- **THEN** the route responds with HTTP 401 and does not mutate stock fields

### Requirement: Manual stock sync trigger available in non-production

An admin-authenticated manual endpoint SHALL run the same stock orchestrator for development and staging.

#### Scenario: Admin manual stock sync

- **WHEN** an authenticated admin user invokes the manual stock sync route in non-production
- **THEN** `runStockSync()` executes and returns summary JSON with product counters

### Requirement: Stock sync runs are auditable and persisted

Each stock orchestrator execution SHALL insert an `audit_log` row with action summarizing sources, counts, status, and errors, and persist metadata in `stock_sync_runs` with timestamps, per-source status, and terminal status (`success`, `partial`, or `failed`).

#### Scenario: Partial source failure logged

- **WHEN** Distrisantiago rejects with `STOCK_UNAVAILABLE` but Arnoia succeeds
- **THEN** Arnoia fields update, Distrisantiago fields are not cleared, `stock_sync_runs.status` is `partial`, and `audit_log` records the Distrisantiago error

#### Scenario: Fatal dual-source failure preserves data

- **WHEN** both wholesale sources reject with `STOCK_UNAVAILABLE`
- **THEN** no stock quantities are zeroed, previous indicators remain, and `audit_log` records `error_stock`

### Requirement: Stock sync completes within batch SLA window

Scheduled stock sync SHALL be configured for a maximum interval of 15 minutes in production cron configuration (RNF-004 batch mode).

#### Scenario: Cron schedule documented

- **WHEN** operators inspect CMS deployment configuration for stock sync
- **THEN** the cron interval is documented as 15 minutes or less by default
