## ADDED Requirements

### Requirement: Storefront lists public products by category slug

The storefront SHALL expose a server-only function `listPublicProducts` that returns paginated public catalog rows for one or more category slugs, applying the same visibility rules as `getProductPriceBase` (published, non-wildcard).

#### Scenario: List by category slug

- **WHEN** `listPublicProducts` is called with category slug `escritura` and published products exist in CMS
- **THEN** the result includes only published non-wildcard products linked to that category

#### Scenario: Wildcard products excluded from PLP list

- **WHEN** sync created a wildcard SKU that is published
- **THEN** that SKU does not appear in `listPublicProducts` results

### Requirement: PLP list rows expose facet fields

Each row returned for PLP listing SHALL include at minimum: `skuErp`, display title, slug, supplier display name (brand), `facetColor`, `facetMaterial`, `ecoLabel`, category slug ids, `packUnit`, and optional rating for facet aggregation and cards.

#### Scenario: Facet fields available for aggregation

- **WHEN** products in CMS have `facetColor` set to "Azul"
- **THEN** `listPublicProducts` rows include `facetColor: "Azul"` for server-side facet building

### Requirement: Text search helper for PLP search route

The storefront SHALL expose `searchPublicProducts(q)` that returns the same row shape as `listPublicProducts` filtered by case-insensitive match on title, `skuErp`, `oemRef`, or `ean` within the public catalog set.

#### Scenario: Search matches SKU

- **WHEN** `searchPublicProducts` is called with `q=REF-001` and that SKU is public
- **THEN** the result includes that product

#### Scenario: Empty query returns no search candidates

- **WHEN** `searchPublicProducts` is called with an empty or whitespace query
- **THEN** the result is an empty list without error

### Requirement: Product list read uses server-side CMS access only

PLP listing SHALL use the same server-only CMS access pattern as single-SKU reads and MUST NOT expose CMS credentials to the browser.

#### Scenario: Client bundle has no list credentials

- **WHEN** inspecting the storefront client bundle for PLP listing
- **THEN** no Payload secret or service role key is present
