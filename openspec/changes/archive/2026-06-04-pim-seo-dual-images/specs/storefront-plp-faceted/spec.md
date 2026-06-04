## ADDED Requirements

### Requirement: PLP product cards show catalog image

Each `PlpProductRow` and product card on category, subcategory, and search PLP routes SHALL include `imageUrl` resolved via `resolveCatalogImage` from CMS `ownImage` and `providerImageUrl`, rendering a real image when present or the design-system glyph placeholder when absent (RF-024).

#### Scenario: Card shows own image

- **WHEN** a listed product has `ownImage` with a public URL
- **THEN** the product card displays that image

#### Scenario: Card shows provider URL

- **WHEN** a listed product has only `providerImageUrl`
- **THEN** the product card displays the provider image URL

#### Scenario: Card without image shows glyph

- **WHEN** a listed product has no catalog image sources
- **THEN** the product card shows the glyph placeholder consistent with PDP

### Requirement: Quick view shows catalog image

The PLP quick-view modal SHALL display the same `imageUrl` as the product card for the selected product.

#### Scenario: Quick view image matches card

- **WHEN** a user opens quick view on a product with a provider image URL
- **THEN** the modal shows that image
