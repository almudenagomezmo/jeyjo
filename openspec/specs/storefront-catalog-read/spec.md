# Storefront catalog read

## Purpose

Server-side resolution of product price bases and public PLP listing from Payload CMS data populated by ERP sync, replacing hardcoded storefront stubs.

## Requirements

### Requirement: Storefront reads product price bases from synced CMS catalog

The storefront SHALL resolve `ProductPriceBase` (sku, p1Price, p2Price, vatRate) from Payload CMS data populated by ERP sync instead of hardcoded local stubs.

#### Scenario: REF-001 price base from CMS after sync

- **WHEN** catalog sync has applied stub data for REF-001 and the product is published
- **THEN** `getProductPriceBase('REF-001')` returns p1/p2/vat matching the synced Payload ERP fields

#### Scenario: Unknown SKU returns null

- **WHEN** `getProductPriceBase` is called for a SKU that does not exist or is not publicly visible
- **THEN** the function returns `null` without throwing

### Requirement: Catalog read uses server-side CMS access only

Price base resolution SHALL occur server-side using authenticated CMS access (Local API or internal REST with secret) and MUST NOT expose CMS credentials to the browser.

#### Scenario: Client bundle has no CMS secret

- **WHEN** inspecting the storefront client bundle for pricing resolution
- **THEN** no Payload secret or service role key is present

### Requirement: Catalog read respects public visibility rules

Price base resolution SHALL apply the same public visibility filters as catalog listing (published status, non-wildcard).

#### Scenario: Draft synced product not priced publicly

- **WHEN** sync creates a new product in draft status
- **THEN** `getProductPriceBase` returns null for that SKU until staff publishes it

### Requirement: Storefront lists public products by category slug

The storefront SHALL expose a server-only function `listPublicProducts` that returns paginated public catalog rows for one or more category slugs, applying the same visibility rules as `getProductPriceBase` (published, non-wildcard).

#### Scenario: List by category slug

- **WHEN** `listPublicProducts` is called with category slug `escritura` and published products exist in CMS
- **THEN** the result includes only published non-wildcard products linked to that category

#### Scenario: Wildcard products excluded from PLP list

- **WHEN** sync created a wildcard SKU that is published
- **THEN** that SKU does not appear in `listPublicProducts` results

### Requirement: PLP list rows expose facet fields

Each row returned for PLP listing SHALL include at minimum: `skuErp`, display title, slug, supplier display name (brand), `facetColor`, `facetMaterial`, `ecoLabel`, category slug ids, `packUnit`, and optional rating for facet aggregation and cards.

#### Scenario: Facet fields available for aggregation

- **WHEN** products in CMS have `facetColor` set to "Azul"
- **THEN** `listPublicProducts` rows include `facetColor: "Azul"` for server-side facet building

### Requirement: Text search helper for PLP search route

The storefront SHALL expose `searchPublicProducts(q)` that returns the same row shape as `listPublicProducts` filtered by case-insensitive match on title, `skuErp`, `oemRef`, or `ean` within the public catalog set.

#### Scenario: Search matches SKU

- **WHEN** `searchPublicProducts` is called with `q=REF-001` and that SKU is public
- **THEN** the result includes that product

#### Scenario: Empty query returns no search candidates

- **WHEN** `searchPublicProducts` is called with an empty or whitespace query
- **THEN** the result is an empty list without error

### Requirement: Product list read uses server-side CMS access only

PLP listing SHALL use the same server-only CMS access pattern as single-SKU reads and MUST NOT expose CMS credentials to the browser.

#### Scenario: Client bundle has no list credentials

- **WHEN** inspecting the storefront client bundle for PLP listing
- **THEN** no Payload secret or service role key is present

### Requirement: Storefront resolves full PDP snapshot by slug

The storefront SHALL expose `fetchPublicProductPdpBySlug(slugOrSku)` returning a PDP view model with title, slug, sku, brand, OEM, EAN, packUnit, vatRate, longDescription HTML, primary category, resolved image URL, ecoLabel, technical spec rows, attachments, and related product row stubs, applying public visibility filters.

#### Scenario: PDP snapshot by slug

- **WHEN** `fetchPublicProductPdpBySlug` is called with slug `bic-cristal-azul` for a published product
- **THEN** the result includes enrichment and ERP fields needed to render the PDP without demo stubs

#### Scenario: Unknown slug returns null

- **WHEN** no published non-wildcard product matches the slug or SKU
- **THEN** the function returns `null` without throwing

### Requirement: Related products resolved for PDP cross-sell

The storefront SHALL resolve `relatedProducts` from the PDP document into public PLP row shapes, excluding wildcard and draft related items, capped at eight items.

#### Scenario: Related public products included

- **WHEN** a PDP document lists three published related product IDs
- **THEN** the PDP loader returns three related rows eligible for `ProductGrid`

#### Scenario: Wildcard related excluded

- **WHEN** a related product is marked wildcard
- **THEN** it is omitted from the related rows returned to the PDP

### Requirement: Lexical long description converted server-side

The storefront SHALL convert CMS `longDescription` Lexical JSON to sanitized HTML on the server before passing to client components.

#### Scenario: HTML available in view model

- **WHEN** a product has Lexical long description content
- **THEN** the PDP view model includes an HTML string safe for rendering in the description tab

### Requirement: List public products by curated IDs for home carousels

The storefront SHALL expose a server-only function `listPublicProductsByIds(ids: string[])` that returns PLP row shapes for published, non-wildcard products whose CMS document IDs or SKUs match the input, preserving caller-provided order.

#### Scenario: Curated IDs resolve in order

- **WHEN** `listPublicProductsByIds` is called with three IDs for published products in order A, B, C
- **THEN** the result contains exactly those three rows in order A, B, C

#### Scenario: Draft or wildcard omitted

- **WHEN** the input includes a draft product ID and a wildcard published SKU
- **THEN** those entries are omitted from the result without throwing

#### Scenario: Unknown IDs skipped

- **WHEN** the input includes an ID that does not exist
- **THEN** the function returns only matching public products and does not fail the whole batch

### Requirement: Home product list uses server-side CMS access only

Home carousel product resolution SHALL use the same server-only CMS access pattern as PLP listing and MUST NOT expose CMS credentials to the browser.

#### Scenario: Client bundle has no home list credentials

- **WHEN** inspecting the storefront client bundle for home carousel fetching
- **THEN** no Payload secret or service role key is present
