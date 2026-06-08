## MODIFIED Requirements

### Requirement: PLP list rows expose facet fields

Each row returned for PLP listing SHALL include at minimum: `skuErp`, display title, slug, brand display name (`string | null` from `brands.name`), supplier display name (`string | null` from `suppliers.name`), `facetColor`, `facetMaterial`, `ecoLabel`, category slug ids, `packUnit`, and optional rating for facet aggregation and cards. Brand and supplier SHALL be independent fields; brand MUST NOT be derived from `supplier.name`.

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

### Requirement: Storefront resolves full PDP snapshot by slug

The storefront SHALL expose `fetchPublicProductPdpBySlug(slugOrSku)` returning a PDP view model with title, slug, sku, brand (`string | null` from `brands`), supplier (`string | null` from `suppliers`), OEM, EAN, packUnit, vatRate, longDescription HTML, primary category, resolved image URL, ecoLabel, technical spec rows, attachments, and related product row stubs, applying public visibility filters.

#### Scenario: PDP snapshot includes brand and supplier

- **WHEN** `fetchPublicProductPdpBySlug` is called for a published product with brand BIC and supplier Distrisantiago
- **THEN** the result includes `brand: "BIC"` and `supplier: "Distrisantiago"`

#### Scenario: PDP snapshot by slug

- **WHEN** `fetchPublicProductPdpBySlug` is called with slug `bic-cristal-azul` for a published product
- **THEN** the result includes enrichment and ERP fields needed to render the PDP without demo stubs

#### Scenario: Unknown slug returns null

- **WHEN** no published non-wildcard product matches the slug or SKU
- **THEN** the function returns `null` without throwing
