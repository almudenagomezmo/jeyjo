# Storefront product SEO metadata

## Purpose

PDP Open Graph, Twitter, and JSON-LD metadata using `resolveSeoImage` (RF-024, US-16).

## Requirements

### Requirement: PDP Open Graph and Twitter metadata

The storefront PDP route SHALL set Next.js `openGraph` and `twitter` image fields using `resolveSeoImage` with absolute URLs when a product is found.

#### Scenario: SEO meta image in Open Graph

- **WHEN** a published product has `meta.image` with a public media URL
- **THEN** the PDP HTML includes `og:image` pointing to that absolute URL

#### Scenario: Open Graph falls back to catalog image

- **WHEN** `meta.image` is empty and the product has `ownImage` or `providerImageUrl`
- **THEN** `og:image` uses the catalog-resolved absolute URL

### Requirement: PDP JSON-LD Product schema

The PDP SHALL render a `application/ld+json` script of type `Product` including `name`, `description`, `sku` (`skuErp`), and `image` when `resolveSeoImage` returns a URL.

#### Scenario: Structured data includes image

- **WHEN** a product has a resolvable SEO image URL
- **THEN** the JSON-LD `image` property contains that absolute URL

#### Scenario: Structured data without image omits image property

- **WHEN** no catalog or SEO image resolves
- **THEN** the JSON-LD object does not include an `image` property

### Requirement: PDP page description uses enrichment fields

The PDP `description` metadata SHALL prefer `metaDescription`, then truncated plain text from long description, matching existing enrichment behavior.

#### Scenario: Meta description in head

- **WHEN** a product has `metaDescription` set to 120 characters
- **THEN** the page meta description uses that value
