# Storefront PDP product detail

## Purpose

Enriched product detail page at `/p/[slug]` wired to CMS catalog, pricing engine, and stock semaphore (RF-012, RF-008, US-03).

## Requirements

### Requirement: PDP resolves public product by slug or SKU from CMS

The storefront SHALL load the product detail page from Payload CMS using the URL segment as slug first, then as `skuErp` fallback, applying the same public visibility rules as PLP (published, non-wildcard per RF-006).

#### Scenario: Published product by slug

- **WHEN** a user opens `/p/bic-cristal-azul` and that slug matches a published non-wildcard product
- **THEN** the PDP renders with that product's CMS data

#### Scenario: Wildcard product returns not found

- **WHEN** a user opens `/p/9000000001` for a wildcard SKU
- **THEN** the storefront responds with HTTP 404 via `notFound()`

#### Scenario: SKU URL redirects to canonical slug

- **WHEN** a user opens `/p/REF-001` by SKU and the product has slug `bic-cristal-azul`
- **THEN** the storefront redirects to `/p/bic-cristal-azul`

### Requirement: PDP displays image gallery with resolved primary image

The PDP SHALL show a primary product image using the dual-image resolution rule (`ownImage` over `providerImageUrl`) and a glyph placeholder when no image exists (RF-024 partial until #21).

#### Scenario: Own image takes priority

- **WHEN** a product has both `ownImage` and `providerImageUrl`
- **THEN** the primary gallery image is the own uploaded image URL

#### Scenario: No image shows placeholder

- **WHEN** a product has neither own nor provider image
- **THEN** the gallery shows the design-system product glyph placeholder

### Requirement: PDP shows long description and technical specifications

The PDP SHALL render `longDescription` as sanitized HTML in the description tab and a technical specifications table with at minimum brand, Jeyjo reference, OEM reference, EAN, pack unit, VAT rate, and primary category name (RF-012).

#### Scenario: Long description from CMS

- **WHEN** a product has `longDescription` content in CMS
- **THEN** the description tab displays that HTML content

#### Scenario: Specifications table shows ERP identifiers

- **WHEN** a product has `skuErp`, `oemRef`, and `ean` populated
- **THEN** the specifications tab lists those values in labeled rows

### Requirement: PDP buy box uses dynamic pricing per RF-011

The PDP buy box SHALL display prices from `PriceQuote` resolved server-side via the pricing engine, using dual-price presentation helpers and the header price-mode toggle (anonymous/B2C vs B2B simulated).

#### Scenario: Anonymous dual price on PDP

- **WHEN** an unauthenticated user views a product with P1 quote net 1.00 and gross 1.21
- **THEN** the buy box shows RF-011 dual presentation for B2C mode

#### Scenario: P2 not exposed to anonymous users

- **WHEN** an unauthenticated user loads the PDP
- **THEN** the pricing response and UI do not expose P2 or B2B-only price fields

### Requirement: PDP shows stock semaphore without quantities

The PDP buy box SHALL display the public stock indicator (`available`, `low`, `limited`) from CMS or `getStockIndicator` with RF-005 labels and MUST NOT show numeric stock quantities.

#### Scenario: Available stock badge

- **WHEN** the product indicator level is `available`
- **THEN** the buy box shows the available-level label (e.g. "Disponible")

#### Scenario: No numeric stock on PDP

- **WHEN** the PDP renders stock status
- **THEN** no numeric stock count appears in the UI

### Requirement: Pack-unit quantity control on PDP per RF-008

The PDP quantity selector SHALL only allow multiples of `packUnit` as minimum and step; when the user enters a non-multiple quantity, the system SHALL round up to the next multiple and show the US-03 CA2 notice.

#### Scenario: Non-multiple quantity adjusts with notice

- **WHEN** a product has `packUnit` 12 and the user enters quantity 5
- **THEN** the quantity adjusts to 12 and an notice reads that the item is sold in boxes of 12 units

#### Scenario: Stepper increments by pack unit

- **WHEN** a product has `packUnit` 12
- **THEN** increment and decrement change quantity by 12

### Requirement: Add to cart from PDP respects stock rules US-03

The PDP add-to-cart control SHALL add the selected quantity (in pack multiples) to the cart store, disable the button when stock is limited and `allowOrderWithoutStock` is false, and show the US-03 CA4 pending-validation message when ordering without stock is allowed.

#### Scenario: Add to cart with available stock

- **WHEN** stock level is `available` and the user clicks add to cart with valid quantity
- **THEN** the cart store receives the line with the selected SKU and quantity

#### Scenario: Limited stock without allow flag disables button

- **WHEN** stock level is `limited` and `allowOrderWithoutStock` is false
- **THEN** the add-to-cart button is disabled

#### Scenario: Order without stock shows validation message

- **WHEN** stock level is `limited`, `allowOrderWithoutStock` is true, and the user adds to cart
- **THEN** the UI shows that the order is pending stock validation for the product reference

### Requirement: Downloadable attachments on PDP

When a product has one or more downloadable attachments configured in CMS, the PDP SHALL list them with labels and links to download (RF-012).

#### Scenario: Attachments section visible

- **WHEN** a product has an attachment labeled "Manual de usuario" with a public file URL
- **THEN** the PDP shows a downloadable link with that label

#### Scenario: No attachments hides section

- **WHEN** a product has no attachments
- **THEN** the attachments area is not rendered

### Requirement: Cross-selling module from relatedProducts RF-012

The PDP SHALL render a related-products section from the CMS `relatedProducts` relationship, showing only published non-wildcard products with PLP-equivalent cards (price quote and stock indicator).

#### Scenario: Related toner for printer

- **WHEN** a printer product has related toner products configured and published
- **THEN** the cross-selling section lists those toner products with add-to-cart or navigation to their PDP

#### Scenario: Draft related product excluded

- **WHEN** a related product is draft or wildcard
- **THEN** it does not appear in the cross-selling section

### Requirement: PDP metadata from enrichment fields

The PDP SHALL set Next.js page metadata title and description from the product CMS title and `metaDescription` (or truncated long description fallback).

#### Scenario: Meta description in head

- **WHEN** a product has `metaDescription` set to 120 characters
- **THEN** the page `<meta name="description">` uses that value

### Requirement: PDP uses server-side CMS access only

PDP data loading SHALL occur server-side without exposing CMS credentials to the browser, consistent with catalog read and PLP patterns.

#### Scenario: Client bundle has no CMS secret

- **WHEN** inspecting the storefront client bundle for PDP routes
- **THEN** no Payload secret or service role key is present
