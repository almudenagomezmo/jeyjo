## MODIFIED Requirements

### Requirement: ErpPricingReader port defined

The `@jeyjo/erp-ports` package SHALL define `ErpPricingReader` with methods to list special prices by customer ERP code and list active group offers, returning normalized DTOs independent of Avansuite wire format.

#### Scenario: DTO fields are normalized

- **WHEN** `ErpSpecialPriceDto` is returned from the stub adapter
- **THEN** it includes `customerErpCode`, `skuErp`, `netPrice`, `validFrom`, `validTo` as JSON-safe primitives

#### Scenario: DTO includes RF-020 presentation fields

- **WHEN** `ErpSpecialPriceDto` is returned for a special price with Avansuite discount columns
- **THEN** it MAY include `recommendedNetPrice`, `discount1Pct`, `discount2Pct`, and `minQty` as optional JSON-safe fields for B2B tariff display

## ADDED Requirements

### Requirement: Stub includes expired special price fixture

The stub implementation SHALL include at least one expired special price row for a fixture B2B customer to support US-14 review-button acceptance tests.

#### Scenario: Stub lists expired special price

- **WHEN** `listSpecialPrices` is called for fixture customer code `B2B-EMPRESA2`
- **THEN** an entry exists with `validTo` before the current date and a distinct SKU from the active REF-004 fixture

#### Scenario: Stub expired row includes discount fields

- **WHEN** the expired fixture row is returned
- **THEN** it includes `recommendedNetPrice` and at least `discount1Pct` for table display
