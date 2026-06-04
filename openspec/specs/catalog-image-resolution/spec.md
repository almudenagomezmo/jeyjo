# Catalog image resolution

## Purpose

Shared `@jeyjo/catalog-images` package for RF-024 catalog vs SEO image priority chains (ownImage, providerImageUrl, meta.image).

## Requirements

### Requirement: Shared catalog and SEO image resolution

The monorepo package `@jeyjo/catalog-images` SHALL export pure functions `resolveCatalogImage` and `resolveSeoImage` that implement RF-024 priority chains without framework dependencies.

#### Scenario: Catalog image prefers own upload

- **WHEN** `resolveCatalogImage` is called with populated `ownImage.url` and `providerImageUrl`
- **THEN** the returned URL is the own image URL

#### Scenario: Catalog image falls back to provider URL

- **WHEN** `ownImage` is empty and `providerImageUrl` is a non-empty string
- **THEN** `resolveCatalogImage` returns the trimmed provider URL

#### Scenario: SEO image prefers meta image

- **WHEN** `resolveSeoImage` is called with `metaImage.url` and catalog fields populated
- **THEN** the returned URL is the meta image URL

#### Scenario: SEO image falls back to catalog image

- **WHEN** `metaImage` is empty and catalog resolution returns a URL
- **THEN** `resolveSeoImage` returns the same URL as `resolveCatalogImage`

#### Scenario: No image returns null

- **WHEN** all inputs are empty
- **THEN** both functions return `null`

### Requirement: Catalog and SEO resolution are independently testable

The package SHALL ship unit tests covering all fallback branches and SHALL be consumable from `apps/cms` and `apps/storefront` via workspace dependency.

#### Scenario: Unit tests pass in CI

- **WHEN** `pnpm --filter @jeyjo/catalog-images test` runs
- **THEN** all resolution branch tests pass
