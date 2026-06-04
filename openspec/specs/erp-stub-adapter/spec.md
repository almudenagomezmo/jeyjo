# ERP stub adapter

## Purpose

Development and test stub implementation of ERP catalog ports with deterministic data and optional failure simulation.

## Requirements

### Requirement: Stub adapter provides deterministic catalog data

The stub implementation of `ErpCatalogReader` SHALL return a fixed set of sample products and suppliers suitable for local development and automated tests, aligned with Jeyjo seed SKUs where applicable.

#### Scenario: List products in stub mode

- **WHEN** `ERP_ADAPTER=stub` and a consumer calls `listProducts`
- **THEN** at least two products are returned with distinct `skuErp` values and valid `p1Price` / `p2Price`

#### Scenario: Get missing SKU returns null

- **WHEN** `getProductBySku` is called with a SKU not in the stub dataset
- **THEN** the result is `null` without throwing

### Requirement: Stub writer records upserts in memory

The stub `ErpCatalogWriter` SHALL apply upserts to an in-memory store so repeated reads reflect writes within the same process.

#### Scenario: Idempotent product upsert

- **WHEN** `upsertProduct` is called twice with the same `skuErp` and different `p2Price`
- **THEN** a subsequent `getProductBySku` returns the latest `p2Price` exactly once per SKU

### Requirement: Stub can simulate ERP failure

The stub adapter SHALL support a test-only configuration to simulate `ERP_UNAVAILABLE` for resilience tests (RNF-007 preparation).

#### Scenario: Simulated outage

- **WHEN** failure simulation is enabled and a read method is invoked
- **THEN** the call rejects with `ErpIntegrationError` code `ERP_UNAVAILABLE`
