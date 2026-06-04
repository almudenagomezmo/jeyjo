# ERP purchase history reader

## Purpose

Read-only ERP port for B2B customer purchase history lines (stub until Avansuite API, change #23 / #36).

## Requirements

### Requirement: ErpPurchaseHistoryReader port lists customer purchase lines

The `packages/erp-ports` package SHALL expose `ErpPurchaseHistoryReader` with a method to list historical purchase lines for an ERP customer code within optional date and filter parameters, independent of invoice PDF delivery (RF-018 / US-10 dependency RF-031).

#### Scenario: Port interface is typed

- **WHEN** application code imports `ErpPurchaseHistoryReader` from `@jeyjo/erp-ports`
- **THEN** the interface declares list operation with `erpCustomerCode`, optional `from`, `to`, `sku`, and `department` filters
- **AND** each line includes at minimum `sku`, `quantity`, `purchasedAt`, `historicalUnitPrice`, and optional `department`

#### Scenario: Stub adapter is bundled

- **WHEN** the ERP bundle uses the stub adapter
- **THEN** `ErpPurchaseHistoryReader` returns fixture data without throwing `ERP_NOT_IMPLEMENTED`

### Requirement: Stub fixtures support CA-B2B-004 scenario

The stub SHALL include sample data for demo company customers where at least one SKU has `historicalUnitPrice` different from the price the storefront pricing engine would resolve today, enabling CA-B2B-004 tests.

#### Scenario: REF-010 historical versus current in stub

- **WHEN** `listLines` is called for the demo B2B customer fixture tied to empresa@test.com
- **THEN** a line for REF-010 exists with historical unit price 5.00
- **AND** the line purchasedAt is before the current pricing fixture date

### Requirement: Stub respects date and reference filters

The stub implementation SHALL filter lines by inclusive date range and case-insensitive SKU substring when filters are provided.

#### Scenario: Date filter excludes old lines

- **WHEN** `from` is 2026-01-01 and a fixture line purchasedAt is 2025-06-01
- **THEN** that line is not returned

#### Scenario: SKU filter matches partial reference

- **WHEN** `sku` filter is REF-01
- **THEN** lines with SKU REF-010 are included

### Requirement: Production adapter placeholder documents Avansuite contract

Until Avansuite API documentation is confirmed, non-stub adapters SHALL throw a documented `ERP_NOT_IMPLEMENTED` error with message referencing change #36 or API documentation dependency (RI-001).

#### Scenario: Default non-stub throws clearly

- **WHEN** a non-stub bundle without implementation is wired
- **THEN** callers receive `ERP_NOT_IMPLEMENTED`
- **AND** the error message states purchase history API is pending
