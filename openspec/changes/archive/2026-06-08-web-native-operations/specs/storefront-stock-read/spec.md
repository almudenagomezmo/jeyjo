## MODIFIED Requirements

### Requirement: Storefront resolves stock indicator by SKU server-side

The storefront SHALL expose `getStockIndicator(sku)` as a server-only function that loads the product from CMS, applies wildcard and publication filters from catalog read (#7), and returns `{ level, label, isStale, allowOrderWithoutStock }` or `null` when the product is not publicly visible. When `webNativeMode` is true, indicator resolution SHALL use manual `erpStock` and `stockIndicator` from CMS only; `isStale` SHALL be false unless staff-configured staleness rules apply to manual stock edits.

#### Scenario: Published product returns indicator without quantities

- **WHEN** `getStockIndicator` is called for a published non-wildcard SKU with `stockIndicator` `available` and manual stock set in CMS
- **THEN** the result includes `level=available` and `label="Disponible"` and does not include numeric stock fields

#### Scenario: Wildcard SKU returns null

- **WHEN** `getStockIndicator` is called for SKU `9000000001` marked wildcard
- **THEN** the result is `null`

#### Scenario: Draft product returns null

- **WHEN** the SKU exists only as a draft product
- **THEN** the result is `null`

#### Scenario: Web-native mode does not mark stale from ERP sync age

- **WHEN** `webNativeMode` is true and no ERP sync has ever run
- **THEN** `isStale` is false for a product with manual stock set today
