## MODIFIED Requirements

### Requirement: PLP list rows expose facet fields

Each row returned for PLP listing SHALL include at minimum: `skuErp`, display title, slug, brand display name (`string | null` from `brands.name`), supplier display name (`string | null` from `suppliers.name`), `facetColor`, `facetMaterial`, `ecoLabel`, category slug ids, `packUnit`, `rating` (`number | null` from product `ratingAverage` when `reviewCount` > 0, otherwise null), and `reviews` (`number` from product `reviewCount`, default 0). Brand and supplier SHALL be independent fields; brand MUST NOT be derived from `supplier.name`. Hardcoded placeholder ratings MUST NOT be used.

#### Scenario: Brand and supplier exposed separately

- **WHEN** a published product has brand "BIC" and supplier "Distrisantiago"
- **THEN** `listPublicProducts` rows include `brand: "BIC"` and `supplier: "Distrisantiago"`

#### Scenario: Product without brand omits brand facet value

- **WHEN** a published product has no linked brand
- **THEN** the row includes `brand: null`
- **AND** the product is excluded from brand facet aggregation

#### Scenario: Facet color still available

- **WHEN** products in CMS have `facetColor` set to "Azul"
- **THEN** `listPublicProducts` rows include `facetColor: "Azul"` for server-side facet building

#### Scenario: Real review aggregates on PLP row

- **WHEN** a published product has `reviewCount` 8 and `ratingAverage` 4.5
- **THEN** the PLP row includes `rating: 4.5` and `reviews: 8`

#### Scenario: No reviews yields null rating on PLP row

- **WHEN** a published product has `reviewCount` 0
- **THEN** the PLP row includes `rating: null` and `reviews: 0`
- **AND** product cards do not display star ratings
