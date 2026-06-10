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

The PDP SHALL show an interactive image gallery built from `resolvePdpGalleryUrls`. The primary visible image SHALL be the first URL in that list, or the design-system product glyph placeholder when the list is empty. When the gallery contains more than one URL, the PDP SHALL render a row of clickable thumbnails and previous/next carousel controls that update the primary image without a full page navigation.

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

#### Scenario: Carousel navigates between images

- **WHEN** the gallery has more than one URL
- **THEN** the PDP provides previous/next controls to change the active image without a full page reload

### Requirement: PDP exposes gallery URLs in view model

The PDP loader SHALL map CMS product data to `PdpProductView.galleryUrls` using `resolvePdpGalleryUrls` with absolute media URLs for uploads.

#### Scenario: Mapper populates galleryUrls

- **WHEN** `mapPdpDocToView` processes a product with `additionalImages` at fetch depth 2
- **THEN** `galleryUrls` contains the resolved ordered list from `resolvePdpGalleryUrls`

### Requirement: PDP shows long description and technical specifications

The PDP SHALL render `longDescription` as sanitized HTML in the description tab and a technical specifications table with at minimum brand (from `brands`, or "—" when unset), supplier (from `suppliers`, or "—" when unset), Jeyjo reference, OEM reference, EAN, pack unit, VAT rate, and primary category name (RF-012). Brand MUST NOT be derived from `supplier.name`.

#### Scenario: Long description from CMS

- **WHEN** a product has `longDescription` content in CMS
- **THEN** the description tab displays that HTML content

#### Scenario: Specifications table shows brand and supplier separately

- **WHEN** a product has brand BIC and supplier Distrisantiago
- **THEN** the specifications tab lists "Marca: BIC" and "Proveedor: Distrisantiago"

#### Scenario: Specifications table shows ERP identifiers

- **WHEN** a product has `skuErp`, `oemRef`, and `ean` populated
- **THEN** the specifications tab lists those values in labeled rows

### Requirement: PDP header shows brand not supplier

The PDP buy box header SHALL display the product brand when present (`{brand} · REF {sku}`) and SHALL NOT display the supplier name in the header line.

#### Scenario: Header with brand

- **WHEN** a product has brand BIC
- **THEN** the PDP header shows "BIC · REF {sku}"

#### Scenario: Header without brand

- **WHEN** a product has no linked brand
- **THEN** the PDP header shows only the reference line without a brand prefix

### Requirement: PDP buy box uses dynamic pricing per RF-011

The PDP buy box SHALL display prices from `PriceQuote` resolved server-side via the pricing engine, using dual-price presentation helpers and the header price-mode toggle (anonymous/B2C vs B2B simulated). Validated B2B sessions SHALL receive quotes with `pricingCustomerId` so special prices prevail over group offers per RF-007.

#### Scenario: Anonymous dual price on PDP

- **WHEN** an unauthenticated user views a product with P1 quote net 1.00 and gross 1.21
- **THEN** the buy box shows RF-011 dual presentation for B2C mode

#### Scenario: P2 not exposed to anonymous users

- **WHEN** an unauthenticated user loads the PDP
- **THEN** the pricing response and UI do not expose P2 or B2B-only price fields

#### Scenario: Offer styling without limited-offer text badge

- **WHEN** the buy box quote has `listUnit` greater than `netUnit`
- **THEN** strikethrough and offer background styling MAY appear
- **AND** no «Oferta limitada» text badge is shown

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

The PDP add-to-cart control SHALL add the selected quantity (in pack multiples) to the cart store, disable the button when stock is limited and `allowOrderWithoutStock` is false, show the US-03 CA4 pending-validation message when ordering without stock is allowed, and open the header minicart with updated subtotal per US-03 CA3.

#### Scenario: Add to cart with available stock

- **WHEN** stock level is `available` and the user clicks add to cart with valid quantity
- **THEN** the cart store receives the line with the selected SKU and quantity and the minicart opens showing the updated subtotal

#### Scenario: Limited stock without allow flag disables button

- **WHEN** stock level is `limited` and `allowOrderWithoutStock` is false
- **THEN** the add-to-cart button is disabled

#### Scenario: Order without stock shows validation message

- **WHEN** stock level is `limited`, `allowOrderWithoutStock` is true, and the user adds to cart
- **THEN** the UI shows that the order is pending stock validation for the product reference and the minicart opens with the line added

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

The PDP SHALL set Next.js page metadata title and description from the product CMS title and `metaDescription` (or truncated long description fallback), and SHALL delegate Open Graph, Twitter, and JSON-LD image metadata to `storefront-product-seo-metadata`.

#### Scenario: Meta description in head

- **WHEN** a product has `metaDescription` set to 120 characters
- **THEN** the page `<meta name="description">` uses that value

#### Scenario: SEO image separate from gallery

- **WHEN** a product has `meta.image` distinct from the catalog display image
- **THEN** social meta tags use the SEO image
- **AND** the visible PDP gallery still shows the catalog display image

### Requirement: PDP uses server-side CMS access only

PDP data loading SHALL occur server-side without exposing CMS credentials to the browser, consistent with catalog read and PLP patterns.

#### Scenario: Client bundle has no CMS secret

- **WHEN** inspecting the storefront client bundle for PDP routes
- **THEN** no Payload secret or service role key is present

### Requirement: PDP displays real review aggregates in header

The PDP SHALL show star rating and review count in the product header when the CMS product has `reviewCount` greater than zero, using `ratingAverage` for star fill and the count for the "(N valoraciones)" label. When `reviewCount` is zero, the rating row SHALL NOT be rendered.

#### Scenario: Product with approved reviews shows stars

- **WHEN** a product has `reviewCount` 3 and `ratingAverage` 4.3
- **THEN** the PDP header shows stars reflecting 4.3 and text "(3 valoraciones)"

#### Scenario: Product without reviews hides rating row

- **WHEN** a product has `reviewCount` 0
- **THEN** the PDP header does not show the star rating block

### Requirement: PDP valoraciones tab lists approved reviews

The PDP SHALL include a "Valoraciones" tab in `ProductTabs` listing approved reviews for the product with author display name, star rating, relative date, and comment text, paginated server-side.

#### Scenario: Valoraciones tab shows approved list

- **WHEN** a product has two approved reviews and one pending review
- **THEN** the Valoraciones tab lists only the two approved reviews

#### Scenario: Empty state when no approved reviews

- **WHEN** a product has no approved reviews
- **THEN** the Valoraciones tab shows an empty-state message

### Requirement: PDP review form for eligible logged-in purchasers

The Valoraciones tab SHALL render a review form for logged-in customers who have verified purchase of the product SKU and a non-empty `display_name`. The form SHALL collect star rating and comment and submit via the storefront reviews API. After submit, the UI SHALL inform the user the review awaits staff approval.

#### Scenario: Eligible customer sees form

- **WHEN** a logged-in customer with verified purchase and display name views the Valoraciones tab
- **AND** they have no existing review
- **THEN** the star and comment form is visible

#### Scenario: Pending review shows awaiting message

- **WHEN** the customer has a `pending` review for the product
- **THEN** the UI shows that the review awaits approval
- **AND** the customer may edit and resubmit

#### Scenario: Unauthenticated user sees login CTA

- **WHEN** an anonymous user opens the Valoraciones tab
- **THEN** a login call-to-action is shown instead of the form
- **AND** the approved public list remains visible if any exist

### Requirement: PDP maps review aggregates from CMS product

The PDP loader SHALL map `reviewCount` and `ratingAverage` from the CMS product document into `PdpProductView` as `reviews` and `rating` respectively, replacing hardcoded null placeholders.

#### Scenario: Mapper populates rating fields

- **WHEN** `mapPdpDocToView` processes a product with `reviewCount` 5 and `ratingAverage` 4.6
- **THEN** `PdpProductView.reviews` is 5 and `PdpProductView.rating` is 4.6

### Requirement: PDP emits GA4 view_item on product view

When GA4 is enabled, the product detail page SHALL emit a GA4 `view_item` event once per PDP load with the public product SKU, name, and resolved unit price, per **RF-028**.

#### Scenario: Anonymous visitor opens PDP

- **WHEN** GA4 is enabled and PDP loads for slug `boligrafo-premium` with SKU `REF-001`
- **THEN** a `view_item` event is sent with `item_id` REF-001 and the displayed public price

#### Scenario: GA4 disabled on PDP

- **WHEN** GA4 is disabled
- **THEN** PDP renders normally without `view_item` events
