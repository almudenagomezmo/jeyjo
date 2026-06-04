## ADDED Requirements

### Requirement: Confirmed web orders contribute to B2B purchase history aggregation

Confirmed storefront orders stored in Payload SHALL be readable as a secondary source for B2B purchase history line aggregation by `customerRef`, using line SKU and quantity with unit price snapshot as historical reference only (not as current sale price).

#### Scenario: Confirmed B2B order lines are eligible

- **WHEN** an order has `customerRef` matching the session customer, `origin` b2b, and `jeyjoStatus` confirmed
- **THEN** its line items are included when building purchase history merge input

#### Scenario: Draft or cancelled orders are excluded

- **WHEN** an order has `jeyjoStatus` pending_payment or cancelled
- **THEN** its lines are not included in purchase history aggregation

#### Scenario: Line snapshot is historical reference only

- **WHEN** a web order line has unit price snapshot 4.00 at confirmation
- **THEN** purchase history may expose 4.00 as historicalUnitPrice
- **AND** repeat-to-cart and list active price still use pricing engine current quote
