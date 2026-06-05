# Catalog wildcard exclusion

## Purpose

Enforce RF-006 exclusion of wildcard ERP references from public catalog and price resolution paths while keeping them visible in backoffice.

## Requirements

### Requirement: Wildcard products are excluded from public catalog reads

Storefront and other unauthenticated catalog query paths SHALL exclude products where `isWildcard` is true (RF-006).

#### Scenario: Wildcard SKU absent from public product list

- **WHEN** a public catalog query runs after sync applied SKU 9000000001 with `isWildcard=true`
- **THEN** that SKU is not returned in public product results

#### Scenario: Wildcard visible in backoffice

- **WHEN** a staff user opens the product with SKU 9000000001 in Payload admin
- **THEN** the product is visible with `isWildcard` indicated in ERP fields

### Requirement: ERP sync preserves wildcard flag

When `ErpCatalogSyncService` applies a product DTO with `isWildcard=true`, the Payload product SHALL store `isWildcard=true` and SHALL NOT auto-publish to the public storefront.

#### Scenario: Sync marks wildcard from DTO

- **WHEN** stub reader returns product 9000000001 with `isWildcard: true`
- **THEN** after sync the Payload record has `isWildcard=true` and remains excluded from public reads even if previously published

### Requirement: Wildcard products are excluded from public price resolution

Public price resolution endpoints SHALL return no quote for wildcard SKUs.

#### Scenario: Price resolve for wildcard returns not found

- **WHEN** an unauthenticated client requests price resolution for SKU 9000000001
- **THEN** the response indicates the product is not available for public pricing (null or 404 per API contract)

### Requirement: Excel import marks wildcard references

When catalog data is applied from an Excel import, products whose `skuErp` matches the configured wildcard list SHALL be stored with `isWildcard=true` and excluded from public catalog reads (CA-BACKEND-002, RF-006).

#### Scenario: Wildcard reference excluded after Excel import

- **WHEN** `ImportaciónArticulos_test.xlsx` contains reference `9000000001` among 50 normal references and staff applies the import
- **THEN** the Payload product for `9000000001` has `isWildcard=true`
- **AND** that SKU is not returned by public storefront catalog queries
- **AND** the import summary indicates one wildcard excluded from the public catalog

#### Scenario: Wildcard remains visible in backoffice after Excel import

- **WHEN** staff opens product `9000000001` in Payload admin after Excel import
- **THEN** the product is visible with `isWildcard` indicated in ERP fields
