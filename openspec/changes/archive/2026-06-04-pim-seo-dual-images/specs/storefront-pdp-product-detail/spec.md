## MODIFIED Requirements

### Requirement: PDP displays image gallery with resolved primary image

The PDP SHALL show a primary product image using `resolveCatalogImage` (`ownImage` over `providerImageUrl`) and a glyph placeholder when no catalog image exists (RF-024 complete).

#### Scenario: Own image takes priority

- **WHEN** a product has both `ownImage` and `providerImageUrl`
- **THEN** the primary gallery image is the own uploaded image URL

#### Scenario: Provider URL when no own image

- **WHEN** a product has only `providerImageUrl`
- **THEN** the primary gallery image loads from that external URL

#### Scenario: No image shows placeholder

- **WHEN** a product has neither own nor provider image
- **THEN** the gallery shows the design-system product glyph placeholder

### Requirement: PDP metadata from enrichment fields

The PDP SHALL set Next.js page metadata title and description from the product CMS title and `metaDescription` (or truncated long description fallback), and SHALL delegate Open Graph, Twitter, and JSON-LD image metadata to `storefront-product-seo-metadata`.

#### Scenario: Meta description in head

- **WHEN** a product has `metaDescription` set to 120 characters
- **THEN** the page `<meta name="description">` uses that value

#### Scenario: SEO image separate from gallery

- **WHEN** a product has `meta.image` distinct from the catalog display image
- **THEN** social meta tags use the SEO image
- **AND** the visible PDP gallery still shows the catalog display image
