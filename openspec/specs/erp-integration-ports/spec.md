# ERP integration ports

## Purpose

Shared `@jeyjo/erp-ports` package interfaces for catalog read/write and future document read operations, with typed integration errors independent of Payload or Avansuite.

## Requirements

### Requirement: ERP catalog read port exists

The system SHALL expose an `ErpCatalogReader` interface in the shared `@jeyjo/erp-ports` package with methods to list and fetch normalized catalog entities without referencing Payload or Avansuite types.

#### Scenario: Reader returns product by SKU

- **WHEN** a consumer calls `getProductBySku` with a SKU that exists in the active adapter
- **THEN** the method resolves to an `ErpProductDto` or `null` if not found

#### Scenario: Reader lists suppliers

- **WHEN** a consumer calls `listSuppliers` with pagination options
- **THEN** the method returns a page of `ErpSupplierDto` records and a continuation cursor or equivalent pagination metadata

### Requirement: ERP catalog write port exists

The system SHALL expose an `ErpCatalogWriter` interface for idempotent upsert operations keyed by `skuErp` (products) and `erpCode` (suppliers).

#### Scenario: Writer upserts product

- **WHEN** a consumer calls `upsertProduct` with a valid `ErpProductDto`
- **THEN** the active adapter acknowledges success with a stable external reference or confirmation payload defined by the port contract

#### Scenario: Writer rejects invalid product

- **WHEN** a consumer calls `upsertProduct` without `skuErp`
- **THEN** the adapter rejects the operation with an `ErpIntegrationError` coded `ERP_VALIDATION`

### Requirement: ERP documents read port is defined for future use

The system SHALL expose an `ErpDocumentsReader` interface for invoices and delivery notes without requiring a working implementation in this change.

#### Scenario: Documents port not implemented in stub phase

- **WHEN** a consumer calls document list methods on the default stub adapter configuration
- **THEN** the operation fails with `ErpIntegrationError` coded `ERP_NOT_IMPLEMENTED` unless a future change provides a real adapter

### Requirement: Integration errors are typed

All ERP adapters SHALL throw or return failures using `ErpIntegrationError` with machine-readable `code` values including at minimum `ERP_UNAVAILABLE`, `ERP_TIMEOUT`, `ERP_VALIDATION`, and `ERP_NOT_IMPLEMENTED`.

#### Scenario: Simulated ERP outage in tests

- **WHEN** the stub adapter is configured to simulate unavailability
- **THEN** read operations reject with `ERP_UNAVAILABLE` and do not mutate internal stub state inconsistently
