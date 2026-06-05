## ADDED Requirements

### Requirement: Catalog resolves public product by alternate reference fields

The storefront SHALL resolve a published, non-wildcard catalog product by exact match on `skuErp`, `oemRef`, or `ean` for server-side intranet quick order lookup (RF-019, RF-013 indexing).

#### Scenario: Resolve by OEM returns canonical SKU

- **WHEN** `resolveProductByReference` is called with an OEM code present on exactly one published product
- **THEN** the result includes canonical `skuErp` and CMS slug
- **AND** `matchedBy` is `oem`

#### Scenario: Resolve by EAN returns canonical SKU

- **WHEN** `resolveProductByReference` is called with an EAN present on a published product
- **THEN** the result includes canonical `skuErp` and CMS slug
- **AND** `matchedBy` is `ean`

#### Scenario: Unknown reference returns null

- **WHEN** no published product matches the reference on sku, OEM, or EAN
- **THEN** `resolveProductByReference` returns null without throwing

#### Scenario: Draft or wildcard product not resolved

- **WHEN** the only matching product is draft or wildcard-excluded
- **THEN** `resolveProductByReference` returns null
