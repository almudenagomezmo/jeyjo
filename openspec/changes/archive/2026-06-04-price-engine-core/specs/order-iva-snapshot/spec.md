## ADDED Requirements

### Requirement: IVA snapshot set on order confirmation

When an order transitions to a confirmed status, the CMS SHALL populate `ivaRateSnapshot` on every line item with the product VAT rate at confirmation time if not already set.

#### Scenario: Confirmation copies current VAT

- **WHEN** an order with a line for a product at 21% VAT moves to confirmed status
- **THEN** that line's `ivaRateSnapshot` is 21

#### Scenario: Snapshot immutable after confirmation

- **WHEN** the product VAT rate is later changed to 10%
- **THEN** the confirmed order line `ivaRateSnapshot` remains 21

### Requirement: Confirmation fails without VAT on product

The confirmation hook SHALL reject the transition if any line's product lacks a resolvable VAT rate.

#### Scenario: Missing VAT blocks confirm

- **WHEN** a line references a product with null or undefined VAT at confirmation time
- **THEN** the order status transition fails with a validation error

### Requirement: Draft orders may omit snapshot

Orders not in confirmed status MAY leave `ivaRateSnapshot` empty until confirmation.

#### Scenario: Draft line without snapshot

- **WHEN** an order is saved in draft status
- **THEN** lines may have empty `ivaRateSnapshot` without validation error
