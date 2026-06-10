# Backoffice B2B pricing admin

## Purpose

CMS collections for special prices and group offers with Supabase mirror hooks in web-native mode.

## Requirements

### Requirement: Special prices collection mirrors Supabase special_prices

The CMS SHALL expose a `specialPrices` collection with fields: `customer` (relation to Supabase customer UUID or picker), `productSku` (text, required), `netPrice`, optional `discount1Pct`, optional `discount2Pct`, optional `minQty`, `validFrom`, optional `validTo`. On create/update/delete, hooks SHALL upsert or remove the corresponding row in Supabase `special_prices`.

#### Scenario: Staff creates special price

- **WHEN** administracion staff saves a special price for customer C1 and SKU REF-004 with net price 8.50 and `validTo` 2026-12-31
- **THEN** a row exists in `special_prices` for C1 + REF-004 with matching amounts and dates

#### Scenario: Delete removes Supabase row

- **WHEN** staff deletes a special price record in Payload
- **THEN** the matching `special_prices` Supabase row is removed

### Requirement: Group offers collection mirrors Supabase group_offers

The CMS SHALL expose a `groupOffers` collection with fields: `productSku`, `offerNetPrice`, optional `customerGroup` (1-4 or null for all), `validFrom`, optional `validTo`, `active` (default true). Hooks SHALL mirror to Supabase `group_offers`.

#### Scenario: Staff creates group offer for group 2

- **WHEN** staff saves an active group offer for SKU REF-003, group 2, net price 6.00
- **THEN** Supabase `group_offers` contains the equivalent active row

### Requirement: SKU validation against catalog

Special price and group offer saves SHALL validate that `productSku` matches an existing product `skuErp` unless staff has override role `superadmin`.

#### Scenario: Unknown SKU rejected

- **WHEN** staff saves a special price for SKU NONEXISTENT
- **THEN** validation fails with a message referencing missing catalog SKU

### Requirement: Special price net must not exceed catalog P2

When staff saves a `specialPrices` record, validation SHALL reject `netPrice` greater than the linked product `p2Price` with a clear error message.

#### Scenario: Net above P2 rejected

- **WHEN** staff saves special price net 100.00 for SKU 10102007 whose catalog P2 is 0.30
- **THEN** validation fails with a message that net cannot exceed P2

### Requirement: Pricing admin respects staff roles RF-030

Roles `administracion` and `superadmin` SHALL create and update pricing collections; role `catalogo` SHALL have read-only or no access per existing staff matrix.

#### Scenario: Catalogo denied write

- **WHEN** a catalogo-only user attempts to update a group offer
- **THEN** access is denied
