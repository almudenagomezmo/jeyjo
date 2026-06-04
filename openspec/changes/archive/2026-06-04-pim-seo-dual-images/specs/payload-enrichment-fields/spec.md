## MODIFIED Requirements

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

## ADDED Requirements

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
