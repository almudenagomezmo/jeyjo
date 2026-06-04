# Pricing data schema

## Purpose

Supabase tables and seed data that back the pricing engine (special prices and group offers) aligned to the ERD `PRECIO_ESPECIAL` and RF-007 acceptance fixtures.

## Requirements

### Requirement: Special prices table exists

Supabase SHALL provide a `special_prices` table linking `customer_id`, `product_sku`, `net_price`, validity dates, and a vigency indicator aligned to ERD `PRECIO_ESPECIAL`.

#### Scenario: Valid special price row is queryable

- **WHEN** a row exists for customer C and SKU REF-004 with `valid_to` in the future
- **THEN** the pricing repository returns that net price for the pair (C, REF-004)

#### Scenario: Expired special price is ignored

- **WHEN** `valid_to` is before the current date for a special price row
- **THEN** `resolvePrice` does not apply the special price rule for that row

### Requirement: Group offers table exists

Supabase SHALL provide a `group_offers` table with at minimum `sku_erp`, `offer_net_price`, optional `customer_group`, validity window, and `active` flag.

#### Scenario: Active offer applies to SKU

- **WHEN** `group_offers` has `active=true` for SKU REF-003 with `offer_net_price` 8.00
- **THEN** the pricing engine uses 8.00 as net unit when no special price applies

### Requirement: Pricing fixture seed for acceptance tests

The repository SHALL include seed or migration data for SKUs REF-001 through REF-004 sufficient to run CA-PRECIOS-001..004 in staging.

#### Scenario: Staging seed present

- **WHEN** staging database is seeded after migrations
- **THEN** queries for REF-001..004 special/offer rows used in acceptance docs return expected values

### Requirement: Monetary columns use numeric precision

Price columns in new tables SHALL use `numeric(12,6)` and disallow negative net prices.

#### Scenario: Negative net price rejected

- **WHEN** inserting `net_price` or `offer_net_price` less than zero
- **THEN** the database rejects the insert via CHECK constraint
