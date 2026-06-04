## MODIFIED Requirements

### Requirement: Product suggestions include US-01 visual fields

Each product suggestion in the suggest response SHALL include at least: public title, link href to PDP (`/p/{slug}` or stable sku path), thumbnail from `resolveCatalogImage` after CMS hydration or placeholder glyph when null, wholesale reference, OEM reference when present, EAN when present, and resolved price presentation for the active price mode (dual labels per price-resolution spec).

#### Scenario: Typo-tolerant match surfaces BIC pen

- **WHEN** Qdrant indexes "Bolígrafo BIC Cristal Azul" and the user queries "boligrafo vic"
- **THEN** the suggest response includes that product in the product list

#### Scenario: EAN search returns matching SKU

- **WHEN** a product with EAN `3086123519963` is indexed and the user queries that EAN
- **THEN** the first product suggestion corresponds to that SKU

#### Scenario: Suggest thumbnail uses catalog image not SEO image

- **WHEN** a product has `meta.image` different from catalog `ownImage`
- **THEN** the suggest dropdown thumbnail uses the catalog display image

#### Scenario: Suggest without image uses glyph

- **WHEN** a hydrated product has no catalog image sources
- **THEN** the suggest row shows the placeholder glyph
