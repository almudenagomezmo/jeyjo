# Pricing engine

## Purpose

Shared `@jeyjo/pricing` package that resolves product net and gross prices per customer using RF-007 business rules (special price, group offer, B2B discount, P1 retail) with explicit non-accumulation.

## Requirements

### Requirement: Price resolution applies RF-007 priority chain

The `@jeyjo/pricing` package SHALL expose `resolvePrice` that evaluates pricing rules in strict order: (1) valid customer special price, (2) active group offer, (3) B2B P2 minus general discount when no offer applied, (4) P1 for anonymous or B2C customers.

#### Scenario: Anonymous customer receives P1 (CA-PRECIOS-001)

- **WHEN** `resolvePrice` is called for SKU REF-001 with P1=1.00, VAT=21%, and no authenticated B2B customer
- **THEN** `netUnit` is 1.00
- **AND** `appliedRule` is `p1_retail`
- **AND** `grossUnit` is 1.21

#### Scenario: B2B customer receives P2 minus discount without offer (CA-PRECIOS-002)

- **WHEN** `resolvePrice` is called for SKU REF-002 with P2=10.00, customer general discount 10%, and no active offer or special price
- **THEN** `netUnit` is 9.00
- **AND** `appliedRule` is `b2b_discount`

#### Scenario: Group offer blocks B2B discount stacking (CA-PRECIOS-003)

- **WHEN** `resolvePrice` is called for SKU REF-003 with P2=10.00, active group offer net price 8.00, and customer general discount 10%
- **THEN** `netUnit` is 8.00
- **AND** `appliedRule` is `group_offer`
- **AND** `netUnit` is not 7.20

#### Scenario: Special price overrides P2 and offers (CA-PRECIOS-004)

- **WHEN** `resolvePrice` is called for SKU REF-004 with valid special price 5.00, P2=8.00, and customer general discount 5%
- **THEN** `netUnit` is 5.00
- **AND** `appliedRule` is `special_price`

### Requirement: Non-accumulation is enforced in code paths

When rule (1) or (2) applies, the engine MUST NOT apply the B2B general discount from rule (3) to the same line.

#### Scenario: Offer path skips discount strategy

- **WHEN** `GroupOfferStrategy` matches for a line
- **THEN** `B2BDiscountStrategy` is not invoked for that resolution

### Requirement: Unit test coverage threshold

The `packages/pricing` module SHALL maintain ≥80% unit test coverage on statements for strategy and `resolvePrice` entry points.

#### Scenario: Coverage gate in CI

- **WHEN** CI runs `pnpm --filter @jeyjo/pricing test:coverage`
- **THEN** coverage report shows ≥80% for the pricing package source files

### Requirement: Price quotes are JSON-serializable

`PriceQuote` and `PricingInput` types SHALL use plain JSON-serializable fields for logging and API responses.

#### Scenario: API response parses as JSON

- **WHEN** the storefront pricing endpoint returns a quote
- **THEN** the payload contains no class instances or non-JSON types
