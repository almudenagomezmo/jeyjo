## ADDED Requirements

### Requirement: Product enrichment fields separate from ERP data

Each product SHALL expose editable marketing fields: `longDescription` (rich text), `metaDescription` (max 160 characters), `keywords`, and `slug` (URL amigable), distinct from ERP `shortDescription`.

#### Scenario: Marketing tab shows enrichment fields

- **WHEN** a catalog staff user edits a product
- **THEN** long description, meta description, keywords, and slug appear in a Marketing/SEO admin tab separate from ERP read-only fields (US-16 CA1)

### Requirement: Meta description length enforced

The system SHALL enforce a maximum of 160 characters on `metaDescription` and display a character counter in the admin UI.

#### Scenario: Meta description exceeds limit

- **WHEN** a user enters 161 characters in meta description
- **THEN** validation prevents save or shows an error before persist

### Requirement: Slug auto-generation when empty

If `slug` is empty on save, the system SHALL generate a URL-friendly slug from the product title or name (US-16 CA2).

#### Scenario: Empty slug on create

- **WHEN** a product is created with title "Grifo monomando 35mm" and empty slug
- **THEN** after save the slug is populated (e.g. `grifo-monomando-35mm`)

#### Scenario: Duplicate slug warning

- **WHEN** a user saves a slug already used by another product
- **THEN** validation fails with a duplicate slug message (RF-024)

### Requirement: Dual image source on product

Each product SHALL support `providerImageUrl` (external URL, no download) and optional `ownImage` upload to Supabase Storage via the `media` collection and `catalog-media` bucket.

#### Scenario: Provider URL only

- **WHEN** a product has only `providerImageUrl` set
- **THEN** the resolved display image for API consumers is the provider URL (RF-024 verification partial)

#### Scenario: Own image takes priority

- **WHEN** a product has both `providerImageUrl` and `ownImage`
- **THEN** the own uploaded image is the canonical display image for frontend consumption

#### Scenario: No image placeholder

- **WHEN** a product has neither provider URL nor own image
- **THEN** API consumers receive a null/placeholder signal for image display
