## ADDED Requirements

### Requirement: Checkout uses session segment for pricing and shipping

Checkout server APIs and UI SHALL resolve `PriceMode` and shipping segment from the same rules as `pricingCustomerGroup` and `getCustomerContext`, overriding the manual anonymous header toggle when a validated B2B session exists.

#### Scenario: Checkout prepare uses B2B quotes

- **WHEN** `POST /api/checkout/prepare` is called by a validated B2B session
- **THEN** line unit prices match B2B batch pricing rules
- **AND** shipping thresholds use B2B constants

#### Scenario: Manual toggle ignored for validated B2B at checkout

- **WHEN** a validated B2B user has manually set the header toggle to B2C
- **THEN** checkout prepare still uses B2B segment
