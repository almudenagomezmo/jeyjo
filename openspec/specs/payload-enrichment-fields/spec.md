# Payload enrichment fields

## Purpose

PIM/SEO enrichment and dual-image fields on products (RF-024 bootstrap, US-16), separate from ERP-sourced read-only data.

## Requirements

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

Each product SHALL support `providerImageUrl` (external URL, no download) and optional `ownImage` upload to Supabase Storage via the `media` collection and `catalog-media` bucket for **catalog display**. Social and structured-data images SHALL use `meta.image` from the SEO plugin when set, with fallback to the catalog-resolved image per `catalog-image-resolution` (RF-024 complete).

#### Scenario: Provider URL only

- **WHEN** a product has only `providerImageUrl` set
- **THEN** the resolved catalog display image for API consumers is the provider URL

#### Scenario: Own image takes priority for catalog

- **WHEN** a product has both `providerImageUrl` and `ownImage`
- **THEN** the own uploaded image is the canonical **catalog** display image for frontend consumption

#### Scenario: SEO image overrides social metadata only

- **WHEN** a product has `meta.image` set and a different catalog image from `ownImage` or `providerImageUrl`
- **THEN** Open Graph and JSON-LD use `meta.image`
- **AND** the PDP gallery and PLP cards still use the catalog display image

#### Scenario: No image placeholder

- **WHEN** a product has neither provider URL nor own image
- **THEN** API consumers receive a null/placeholder signal for catalog image display

### Requirement: Product defaultPopulate includes SEO image

The Products collection `defaultPopulate` SHALL include `meta.image` (and nested media URL fields) so server consumers can resolve SEO images without extra round-trips.

#### Scenario: REST read depth zero still has meta image when populated

- **WHEN** the storefront fetches a product with `defaultPopulate` applied at depth 1
- **THEN** the response includes `meta.image` URL data when configured in CMS

### Requirement: Bulk SEO and health panel capabilities

The CMS product admin SHALL implement bulk SEO template application and PIM health alerts as specified in `cms-pim-seo-admin` (US-16 CA3–CA4 partial).

#### Scenario: Staff can access bulk SEO from products admin

- **WHEN** a catalog staff user with update access opens the products admin
- **THEN** a bulk SEO template action is available for published products
