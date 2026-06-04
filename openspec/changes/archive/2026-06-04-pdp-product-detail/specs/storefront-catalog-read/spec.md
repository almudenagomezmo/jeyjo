## ADDED Requirements

### Requirement: Storefront resolves full PDP snapshot by slug

The storefront SHALL expose `fetchPublicProductPdpBySlug(slugOrSku)` returning a PDP view model with title, slug, sku, brand, OEM, EAN, packUnit, vatRate, longDescription HTML, primary category, resolved image URL, ecoLabel, technical spec rows, attachments, and related product row stubs, applying public visibility filters.

#### Scenario: PDP snapshot by slug

- **WHEN** `fetchPublicProductPdpBySlug` is called with slug `bic-cristal-azul` for a published product
- **THEN** the result includes enrichment and ERP fields needed to render the PDP without demo stubs

#### Scenario: Unknown slug returns null

- **WHEN** no published non-wildcard product matches the slug or SKU
- **THEN** the function returns `null` without throwing

### Requirement: Related products resolved for PDP cross-sell

The storefront SHALL resolve `relatedProducts` from the PDP document into public PLP row shapes, excluding wildcard and draft related items, capped at eight items.

#### Scenario: Related public products included

- **WHEN** a PDP document lists three published related product IDs
- **THEN** the PDP loader returns three related rows eligible for `ProductGrid`

#### Scenario: Wildcard related excluded

- **WHEN** a related product is marked wildcard
- **THEN** it is omitted from the related rows returned to the PDP

### Requirement: Lexical long description converted server-side

The storefront SHALL convert CMS `longDescription` Lexical JSON to sanitized HTML on the server before passing to client components.

#### Scenario: HTML available in view model

- **WHEN** a product has Lexical long description content
- **THEN** the PDP view model includes an HTML string safe for rendering in the description tab
