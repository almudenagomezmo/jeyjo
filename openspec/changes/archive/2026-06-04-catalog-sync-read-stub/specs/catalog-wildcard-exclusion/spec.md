## ADDED Requirements

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
