## ADDED Requirements

### Requirement: Qdrant product payload thumbnail uses catalog image only

When building the Qdrant product point payload, the search indexer worker SHALL set `thumbnailUrl` using `resolveCatalogImage` from `@jeyjo/catalog-images` and SHALL NOT use `meta.image` for thumbnails.

#### Scenario: Indexer stores display thumbnail

- **WHEN** a product upsert is indexed with `ownImage` URL and a separate `meta.image`
- **THEN** the Qdrant payload `thumbnailUrl` equals the catalog-resolved URL (own image)

#### Scenario: Indexer omits SEO image from thumbnail

- **WHEN** a product has only `meta.image` and no catalog image sources
- **THEN** `thumbnailUrl` in the Qdrant payload is null or absent
- **AND** suggest hydration may still show glyph after CMS fetch
