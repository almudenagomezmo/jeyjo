# Stock source ports

## Purpose

Shared `@jeyjo/stock-ports` package defining wholesale stock reader contracts, integration errors, and CMS adapter registry resolution.

## Requirements

### Requirement: Stock source reader port defines wholesale snapshot contract

The `@jeyjo/stock-ports` package SHALL export a `StockSourceReader` interface with `sourceId` (`distrisantiago` | `arnoia`), `listStockSnapshots(options?)` returning paginated `StockSnapshotDto` rows, and `getStockByRef(ref)` returning a single snapshot or `null`.

#### Scenario: List snapshots returns ref and quantity

- **WHEN** a consumer calls `listStockSnapshots` on a configured reader
- **THEN** each row includes `wholesaleRef`, `quantity` (non-negative integer or zero), and `sourceId`

#### Scenario: Unknown ref returns null

- **WHEN** `getStockByRef` is called with a ref not present in the source dataset
- **THEN** the result is `null` without throwing

### Requirement: Stock integration errors are typed

Stock adapters SHALL reject with `StockIntegrationError` carrying codes `STOCK_UNAVAILABLE`, `STOCK_TIMEOUT`, and `STOCK_NOT_IMPLEMENTED`, aligned with ERP error handling patterns.

#### Scenario: Simulated source outage

- **WHEN** a stub adapter has failure simulation enabled for a source
- **THEN** read methods reject with `StockIntegrationError` code `STOCK_UNAVAILABLE`

### Requirement: Stock source registry resolves adapters from environment

The CMS stock registry SHALL resolve Distrisantiago and Arnoia reader implementations from `STOCK_DISTRI_ADAPTER` and `STOCK_ARNOIA_ADAPTER` with supported value `stub` in this change; unsupported production values SHALL fail fast with `STOCK_NOT_IMPLEMENTED`.

#### Scenario: Development defaults to stub readers

- **WHEN** stock adapter env vars are unset in development
- **THEN** both sources resolve to stub implementations

#### Scenario: Unimplemented ftp adapter fails fast

- **WHEN** `STOCK_DISTRI_ADAPTER=ftp` before the FTP adapter is registered
- **THEN** registry access fails with `STOCK_NOT_IMPLEMENTED` or a descriptive configuration error
