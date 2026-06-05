## ADDED Requirements

### Requirement: Additional catalog images for PDP gallery

Each product SHALL expose an optional `additionalImages` array in the Marketing/SEO enrichment tab. Each entry SHALL be a required upload to the `media` collection (Supabase `catalog-media` bucket). The array SHALL allow at most 8 entries.

#### Scenario: Staff adds extra gallery images

- **WHEN** a catalog staff user edits a product in the Marketing/SEO tab
- **THEN** they can upload one or more images in `additionalImages` in addition to `ownImage` and `providerImageUrl`

#### Scenario: Additional images are PDP-only

- **WHEN** a product has `additionalImages` populated
- **THEN** those images are intended for the PDP gallery only
- **AND** PLP cards and search thumbnails continue to use the single catalog display image from `resolveCatalogImage`

#### Scenario: Maximum additional images enforced

- **WHEN** a user attempts to add a ninth entry to `additionalImages`
- **THEN** the admin UI prevents adding more than 8 additional images

### Requirement: defaultPopulate includes additional images

The Products collection `defaultPopulate` SHALL include `additionalImages` with nested media URL fields so storefront PDP fetches can resolve gallery URLs without extra round-trips.

#### Scenario: REST product read includes additionalImages at depth 2

- **WHEN** the storefront fetches a published product with `depth=2` and `defaultPopulate` applied
- **THEN** the response includes `additionalImages[].image` URL data when configured in CMS
