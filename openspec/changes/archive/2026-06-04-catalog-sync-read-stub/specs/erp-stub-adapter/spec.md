## ADDED Requirements

### Requirement: Stub includes CA-PRECIOS fixture SKUs

The stub `ErpCatalogReader` dataset SHALL include products REF-001, REF-002, REF-003, and REF-004 with P1/P2/vatRate values aligned to CA-PRECIOS-001..004 documentation.

#### Scenario: REF-003 present with offer-compatible base prices

- **WHEN** `getProductBySku('REF-003')` is called in stub mode
- **THEN** the DTO includes p1Price 12, p2Price 10, and vatRate 21

#### Scenario: REF-004 present for special price scenario

- **WHEN** `getProductBySku('REF-004')` is called in stub mode
- **THEN** the DTO includes p1Price 10 and p2Price 8 with vatRate 21

### Requirement: Stub includes wildcard reference SKU

The stub catalog dataset SHALL include SKU 9000000001 with `isWildcard: true` for RF-006 sync and exclusion tests (CA-BACKEND-002 preparation).

#### Scenario: Wildcard SKU in listProducts

- **WHEN** `listProducts` is called in stub mode
- **THEN** an item with `skuErp` 9000000001 and `isWildcard: true` is included

### Requirement: Stub pricing reader aligns with catalog fixtures

The stub `ErpPricingReader` SHALL return special prices and group offers consistent with REF-001..004 catalog fixtures when pricing sync runs.

#### Scenario: Group offer targets REF-003

- **WHEN** `listGroupOffers` is called in stub mode
- **THEN** an active offer for skuErp REF-003 with net price 8.00 is returned
