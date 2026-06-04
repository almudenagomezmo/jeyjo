## ADDED Requirements

### Requirement: PLP lists public products from CMS by category

The storefront SHALL render category and subcategory PLP routes using server-fetched published, non-wildcard products from Payload CMS for the active category slug(s), replacing the demo `lib/data/products.ts` source on `/c/*` routes.

#### Scenario: Category page shows CMS products

- **WHEN** a user opens `/c/escritura` and Payload has published products linked to that category slug
- **THEN** the PLP displays those products in the grid with a total count matching the filtered public set

#### Scenario: Empty category shows empty state

- **WHEN** no published products match the category slug
- **THEN** the PLP shows an empty-state message without throwing

### Requirement: Faceted filters are cumulative per RF-010

The PLP SHALL provide accumulative sidebar filters for brand/manufacturer, color, material, price range, in-stock-for-shipment-today, eco-label, and contextual category, such that applying two filters simultaneously shows only products matching both.

#### Scenario: Two filters narrow results

- **WHEN** a user selects brand "BIC" and enables "En stock para envío hoy"
- **THEN** the product grid contains only products that match both conditions

#### Scenario: Clearing filters restores full candidate set

- **WHEN** a user clears all active filters
- **THEN** the grid returns to the full public candidate set for the current category or search context

### Requirement: Facet option counts shown before applying

Each facet value in the sidebar SHALL display the number of products that would match if that value were selected, given all other currently active filters (RF-010).

#### Scenario: Brand facet shows count

- **WHEN** filters restrict the candidate set to 12 products and brand "Pilot" would match 4 of them if selected
- **THEN** the "Pilot" facet option displays count 4 before the user selects it

#### Scenario: Zero-count options are disabled or hidden

- **WHEN** a facet value would match zero products under the current filter context
- **THEN** that option is not selectable (disabled or omitted)

### Requirement: Filter and sort state is shareable via URL

The PLP SHALL serialize active filters, sort order, and page number in the query string so refresh and shared links preserve listing state.

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

The `/search` route SHALL reuse the same faceted listing shell when a query parameter `q` is present, filtering candidates by text match on catalog fields until predictive search (#14) replaces the mechanism.

#### Scenario: Search with query shows faceted results

- **WHEN** a user navigates to `/search?q=boligrafo`
- **THEN** the page shows a faceted product grid scoped to text-matched public products

### Requirement: PLP pagination preserves filters

The PLP SHALL paginate results (default page size 48) with page links that preserve active filter and sort query parameters.

#### Scenario: Page two keeps filters

- **WHEN** a user is on page 1 with `brand=bic` and follows the link to `page=2`
- **THEN** page 2 results remain filtered by brand BIC
