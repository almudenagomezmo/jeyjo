## ADDED Requirements

### Requirement: PDP gallery URL resolution

The package `@jeyjo/catalog-images` SHALL export `resolvePdpGalleryUrls` that builds an ordered, deduplicated list of absolute-ready URLs for the PDP gallery.

Resolution order SHALL be:

1. The catalog display image from `resolveCatalogImage({ ownImage, providerImageUrl })` when non-null.
2. Each `additionalImages` entry resolved via `mediaUrl`, preserving CMS array order.

Duplicate URLs (after trim) SHALL appear only once. The provider URL SHALL NOT be appended again when it is already the catalog display image.

#### Scenario: Primary plus additional images

- **WHEN** a product has `ownImage`, `providerImageUrl`, and two populated `additionalImages`
- **THEN** `resolvePdpGalleryUrls` returns `[ownImageUrl, extra1Url, extra2Url]` in that order

#### Scenario: Provider-only primary with extras

- **WHEN** a product has no `ownImage`, `providerImageUrl` set, and one `additionalImages` entry
- **THEN** the returned list is `[providerUrl, extraUrl]`

#### Scenario: Duplicate own image in additionalImages

- **WHEN** `additionalImages` contains the same media URL as the catalog display image
- **THEN** the returned list contains that URL only once

#### Scenario: No catalog image but additional images exist

- **WHEN** `resolveCatalogImage` returns null and `additionalImages` has entries
- **THEN** the returned list contains only the resolved additional image URLs in CMS order

#### Scenario: Empty gallery

- **WHEN** catalog resolution is null and `additionalImages` is empty
- **THEN** `resolvePdpGalleryUrls` returns an empty array

### Requirement: PDP gallery resolution is unit tested

The package SHALL ship unit tests for `resolvePdpGalleryUrls` covering order, deduplication, provider-only primary, and empty inputs.

#### Scenario: Unit tests pass in CI

- **WHEN** `pnpm --filter @jeyjo/catalog-images test` runs
- **THEN** all `resolvePdpGalleryUrls` branch tests pass
