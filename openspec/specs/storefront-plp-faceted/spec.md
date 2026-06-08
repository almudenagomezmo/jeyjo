# Storefront PLP faceted

## Purpose

Faceted product listing pages (category, subcategory, search) with URL-shareable filters, dual pricing on cards, stock semaphores, quick view, and pagination (RF-010, RF-011).

## Requirements

### Requirement: PLP lists public products from CMS by category

The storefront SHALL render category, subcategory, and family PLP routes using server-fetched published, non-wildcard products from Payload CMS whose category slug matches the active navigation node **or any descendant category slug in the CMS navigation tree**, replacing the demo `lib/data/products.ts` source on `/c/*` routes.

#### Scenario: Category page shows CMS products

- **WHEN** a user opens `/c/escritura` and Payload has published products linked to a descendant category slug such as `boligrafos` (but not directly to `escritura`)
- **THEN** the PLP displays those products in the grid with a total count matching the filtered public set for the `escritura` tree

#### Scenario: Subcategory page includes family products

- **WHEN** a user opens `/c/escritura/boligrafos` and Payload has published products linked only to a family slug such as `boligrafos-gel`
- **THEN** the PLP displays those products in the grid

#### Scenario: Family page shows only family products

- **WHEN** a user opens `/c/escritura/boligrafos/boligrafos-gel` and Payload has published products linked to `boligrafos-gel`
- **THEN** the PLP displays only products in that family branch (not products from sibling families under the same subcategory)

#### Scenario: Empty category shows empty state

- **WHEN** no published products match any slug in the active navigation subtree
- **THEN** the PLP shows an empty-state message without throwing

### Requirement: Faceted filters are cumulative per RF-010

The PLP SHALL provide accumulative sidebar filters for brand/manufacturer, supplier, color, material, price range, in-stock-for-shipment-today, eco-label, and contextual category, such that applying two filters simultaneously shows only products matching both. Brand and supplier filters SHALL operate on independent product fields.

#### Scenario: Brand and supplier filters narrow results together

- **WHEN** a user selects brand "BIC" and supplier "Distrisantiago"
- **THEN** the product grid contains only products that match both conditions

#### Scenario: Two filters narrow results

- **WHEN** a user selects brand "BIC" and enables "En stock para envío hoy"
- **THEN** the product grid contains only products that match both conditions

#### Scenario: Clearing filters restores full candidate set

- **WHEN** a user clears all active filters
- **THEN** the grid returns to the full public candidate set for the current category or search context

### Requirement: Facet option counts shown before applying

Each facet value in the sidebar SHALL display the number of products that would match if that value were selected, given all other currently active filters (RF-010). Brand and supplier dimensions SHALL each show independent counts.

#### Scenario: Brand facet shows count

- **WHEN** filters restrict the candidate set to 12 products and brand "Pilot" would match 4 of them if selected
- **THEN** the "Pilot" facet option displays count 4 before the user selects it

#### Scenario: Supplier facet shows count

- **WHEN** filters restrict the candidate set to 30 products and supplier "Distrisantiago" would match 10 of them if selected
- **THEN** the "Distrisantiago" facet option displays count 10 before the user selects it

#### Scenario: Zero-count options are disabled or hidden

- **WHEN** a facet value would match zero products under the current filter context
- **THEN** that option is not selectable (disabled or omitted)

### Requirement: Filter and sort state is shareable via URL

The PLP SHALL serialize active filters, sort order, and page number in the query string so refresh and shared links preserve listing state. Supplier filters SHALL use query parameter `supplier` (repeatable or CSV).

#### Scenario: Shared URL restores brand and supplier filters

- **WHEN** a user opens `/c/escritura?brand=BIC&supplier=Distrisantiago&inStockToday=1&sort=price-asc`
- **THEN** the sidebar and grid reflect those filters and sort without manual re-selection

#### Scenario: Shared URL restores filters

- **WHEN** a user opens `/c/escritura?brand=bic&inStockToday=1&sort=price-asc`
- **THEN** the sidebar and grid reflect those filters and sort without manual re-selection

### Requirement: Sorting options on PLP

The PLP SHALL support sort by relevance (default in category context), price ascending, price descending, name A–Z, and rating when rating data exists.

#### Scenario: Price ascending sort

- **WHEN** a user selects "Precio: menor a mayor"
- **THEN** products are ordered by resolved display price ascending

### Requirement: Quick view from product card

Each product card on the PLP SHALL offer a quick-view action opening a modal or drawer with product summary, dual price display, stock badge, and add-to-cart without navigating away.

#### Scenario: Quick view opens from card

- **WHEN** a user activates quick view on a product card
- **THEN** a modal shows the product name, reference, price presentation, and add-to-cart control

### Requirement: Add to cart from PLP respects pack unit

Add-to-cart from the PLP SHALL add quantity in multiples of the product `packUnit` (CA-PRECIOS-005 baseline on listing).

#### Scenario: Default quantity uses pack unit

- **WHEN** a user adds a product with `packUnit` 12 from the PLP card
- **THEN** the cart receives quantity 12 (or increments by 12)

### Requirement: Search route reuses PLP shell

The `/search` route SHALL reuse the same faceted listing shell when a query parameter `q` is present, resolving product candidates via storefront vector search (Qdrant + public catalog hydration) per `storefront-predictive-search`, then applying existing facet filters and pagination on that candidate set.

#### Scenario: Search with query shows faceted results

- **WHEN** a user navigates to `/search?q=boligrafo` and Qdrant returns matching public products
- **THEN** the page shows a faceted product grid scoped to vector-matched public products

#### Scenario: Vector miss shows empty state

- **WHEN** a user navigates to `/search?q=zzznomatch` and vector search returns no public SKUs
- **THEN** the page shows the empty search state without demo catalog injection in production

### Requirement: PLP pagination preserves filters

The PLP SHALL paginate results (default page size 48) with page links that preserve active filter and sort query parameters including `supplier`.

#### Scenario: Page two keeps brand and supplier filters

- **WHEN** a user is on page 1 with `brand=BIC` and `supplier=Distrisantiago` and follows the link to `page=2`
- **THEN** page 2 results remain filtered by brand BIC and supplier Distrisantiago

#### Scenario: Page two keeps filters

- **WHEN** a user is on page 1 with `brand=bic` and follows the link to `page=2`
- **THEN** page 2 results remain filtered by brand BIC

### Requirement: PLP add to cart updates minicart US-03 CA3

Add-to-cart actions from PLP product cards and quick-view modal SHALL update the client cart store and open or refresh the header minicart with updated subtotal without leaving the listing page.

#### Scenario: Card add to cart opens minicart

- **WHEN** a user adds a product from a PLP product card
- **THEN** the minicart opens showing the added line and updated subtotal

#### Scenario: Quick view add to cart opens minicart

- **WHEN** a user adds a product from the PLP quick-view dialog
- **THEN** the minicart opens and the listing page remains visible underneath

### Requirement: PLP product cards show catalog image

Each `PlpProductRow` and product card on category, subcategory, and search PLP routes SHALL include `imageUrl` resolved via `resolveCatalogImage` from CMS `ownImage` and `providerImageUrl`, rendering a real image when present or the design-system glyph placeholder when absent (RF-024).

#### Scenario: Card shows own image

- **WHEN** a listed product has `ownImage` with a public URL
- **THEN** the product card displays that image

#### Scenario: Card shows provider URL

- **WHEN** a listed product has only `providerImageUrl`
- **THEN** the product card displays the provider image URL

#### Scenario: Card without image shows glyph

- **WHEN** a listed product has no catalog image sources
- **THEN** the product card shows the glyph placeholder consistent with PDP

### Requirement: Quick view shows catalog image

The PLP quick-view modal SHALL display the same `imageUrl` as the product card for the selected product.

#### Scenario: Quick view image matches card

- **WHEN** a user opens quick view on a product with a provider image URL
- **THEN** the modal shows that image

### Requirement: PLP product cards offer compare control US-06 CA1

Each product card on faceted PLP routes (`/c/*` category, subcategory, and family listings) and on `/search` with an active query SHALL expose a visible compare control (checkbox or labeled button "Comparar") that toggles the product SKU in the client compare store.

#### Scenario: Compare control visible on category PLP

- **WHEN** a user views a product card on `/c/escritura`
- **THEN** the card shows a compare control labeled or implied as "Comparar"

#### Scenario: Compare control on search PLP

- **WHEN** a user views a product card on `/search?q=boligrafo`
- **THEN** the card shows the same compare control as category PLP cards

#### Scenario: Compare control reflects selection state

- **WHEN** a user selects compare on a product card
- **THEN** the control shows selected state (`aria-checked` or `aria-pressed` true)
- **AND** a compare action bar appears or updates with the selection count

#### Scenario: Compare bar offers navigation to comparison page

- **WHEN** at least two products are selected for comparison
- **THEN** the compare action bar provides a control to open `/comparar` with the selected SKUs in the query string
