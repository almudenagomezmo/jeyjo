## MODIFIED Requirements

### Requirement: PDP displays image gallery with resolved primary image

The PDP SHALL show an interactive image gallery built from `resolvePdpGalleryUrls`. The primary visible image SHALL be the first URL in that list, or the design-system product glyph placeholder when the list is empty. When the gallery contains more than one URL, the PDP SHALL render a row of clickable thumbnails that update the primary image without a full page navigation.

#### Scenario: Own image takes priority

- **WHEN** a product has both `ownImage` and `providerImageUrl`
- **THEN** the primary gallery image is the own uploaded image URL

#### Scenario: Provider URL when no own image

- **WHEN** a product has only `providerImageUrl`
- **THEN** the primary gallery image loads from that external URL

#### Scenario: No image shows placeholder

- **WHEN** a product has neither own nor provider image and no `additionalImages`
- **THEN** the gallery shows the design-system product glyph placeholder

#### Scenario: Additional images appear in gallery

- **WHEN** a product has a resolved catalog image and two `additionalImages`
- **THEN** the PDP shows three gallery items with the catalog image first
- **AND** clicking a thumbnail updates the primary image to that URL

#### Scenario: Single image hides thumbnail row

- **WHEN** `resolvePdpGalleryUrls` returns exactly one URL
- **THEN** the PDP shows only the primary image
- **AND** no decorative duplicate thumbnail row is rendered

#### Scenario: Thumbnails render visible previews

- **WHEN** the PDP renders gallery thumbnails for a product with multiple images
- **THEN** each thumbnail displays a scaled preview of its image (not an empty box)

## ADDED Requirements

### Requirement: PDP exposes gallery URLs in view model

The PDP loader SHALL map CMS product data to `PdpProductView.galleryUrls` using `resolvePdpGalleryUrls` with absolute media URLs for uploads.

#### Scenario: Mapper populates galleryUrls

- **WHEN** `mapPdpDocToView` processes a product with `additionalImages` at fetch depth 2
- **THEN** `galleryUrls` contains the resolved ordered list from `resolvePdpGalleryUrls`
