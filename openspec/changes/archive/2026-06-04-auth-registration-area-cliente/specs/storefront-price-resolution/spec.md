## MODIFIED Requirements

### Requirement: Server-side price resolution endpoint

The storefront SHALL expose a server-only API that resolves `PriceQuote` for a given product SKU using the shared pricing engine and the caller session (anonymous, pending registration, validated B2C, or validated B2B).

#### Scenario: Anonymous request resolves P1

- **WHEN** an unauthenticated client calls the pricing API for SKU REF-001
- **THEN** the response `appliedRule` is `p1_retail`
- **AND** P2 is not exposed in the response body

#### Scenario: B2B session resolves discounted P2

- **WHEN** an authenticated validated B2B session (`customer_group` 2–4, `validated_at` set) calls the pricing API for SKU REF-002
- **THEN** the response `netUnit` reflects CA-PRECIOS-002 (9.00 for the fixture)

#### Scenario: Pending registration resolves P1 only

- **WHEN** an authenticated user has `validated_at` IS NULL
- **THEN** pricing calls resolve as anonymous B2C (P1) regardless of requested B2B toggle

### Requirement: Price mode header indicator

The storefront header SHALL display the active price mode label ("Precios sin IVA" or "Precios con IVA") based on authenticated customer segment per RF-011; anonymous visitors MAY still use the manual toggle cookie until session exists.

#### Scenario: Anonymous header label (CA-PRECIOS-001)

- **WHEN** no B2B customer is authenticated
- **THEN** the header indicator reads "Precios sin IVA"

#### Scenario: Validated B2B header uses B2B mode

- **WHEN** a validated B2B customer session is active
- **THEN** the header indicator reflects B2B net pricing mode
- **AND** the manual B2B toggle does not override session segment

#### Scenario: Authenticated B2C header uses B2C dual display rules

- **WHEN** a validated B2C customer session is active
- **THEN** the header indicator follows B2C dual-price presentation rules from RF-011
