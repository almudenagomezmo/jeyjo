# ERP pricing read ports

## Purpose

Read-only ERP integration ports and stub data for customer special prices and group offers, consumed by the pricing engine and future catalog sync.

## Requirements

### Requirement: ErpPricingReader port defined

The `@jeyjo/erp-ports` package SHALL define `ErpPricingReader` with methods to list special prices by customer ERP code and list active group offers, returning normalized DTOs independent of Avansuite wire format.

#### Scenario: DTO fields are normalized

- **WHEN** `ErpSpecialPriceDto` is returned from the stub adapter
- **THEN** it includes `customerErpCode`, `skuErp`, `netPrice`, `validFrom`, `validTo` as JSON-safe primitives

### Requirement: Stub adapter returns deterministic CA fixtures

The stub implementation SHALL return data for REF-001..004 scenarios documented in CA-PRECIOS-001..004 when requested in development.

#### Scenario: Stub lists special price for REF-004

- **WHEN** `listSpecialPrices` is called for the empresa2@test.com fixture customer code
- **THEN** an entry for SKU REF-004 with net price 5.00 is included

### Requirement: Pricing reader registered in adapter registry

`getErpAdapters()` SHALL expose `pricingReader` alongside catalog and documents readers, resolved from the same `ERP_ADAPTER` environment variable.

#### Scenario: Registry exposes pricing reader

- **WHEN** `ERP_ADAPTER=stub` and adapters are resolved
- **THEN** `pricingReader` is a non-null implementation of `ErpPricingReader`

### Requirement: No ERP write for pricing in this change

`ErpPricingReader` SHALL be read-only; write operations for special prices remain deferred to change #36.

#### Scenario: Writer not required for pricing port

- **WHEN** inspecting `erp-ports` exports for this change
- **THEN** there is no `ErpPricingWriter` interface
