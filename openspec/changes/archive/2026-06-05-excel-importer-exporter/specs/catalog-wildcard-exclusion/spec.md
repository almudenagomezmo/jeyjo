## ADDED Requirements

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
