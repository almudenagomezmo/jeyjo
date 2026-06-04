## ADDED Requirements

### Requirement: Pricing sync persists special prices from ERP reader

The CMS SHALL provide a service that reads special prices from `ErpPricingReader` and upserts rows into Supabase `special_prices` idempotently by natural keys defined in the pricing schema.

#### Scenario: Stub special price upserted

- **WHEN** pricing sync runs with stub adapter and fixture customer ERP code for empresa2@test.com
- **THEN** a row for SKU REF-004 with net price 5.00 exists in `special_prices` (CA-PRECIOS-004 data path)

#### Scenario: Repeated sync is idempotent

- **WHEN** pricing sync runs twice without upstream changes
- **THEN** duplicate logical rows are not created and existing prices remain stable

### Requirement: Pricing sync persists group offers from ERP reader

The CMS SHALL read active group offers from `ErpPricingReader` and upsert into Supabase `group_offers` idempotently.

#### Scenario: Stub group offer for REF-003

- **WHEN** pricing sync runs with stub adapter
- **THEN** an active group offer for SKU REF-003 exists with offer net price 8.00 (CA-PRECIOS-003)

### Requirement: Pricing sync is invoked by catalog orchestrator

The catalog read orchestrator SHALL invoke pricing sync after catalog entities are applied so storefront pricing reads consistent Supabase data in the same run.

#### Scenario: Single run updates catalog and pricing

- **WHEN** the orchestrator completes successfully
- **THEN** the result includes a pricing rows upserted count greater than zero when stub fixtures are present
