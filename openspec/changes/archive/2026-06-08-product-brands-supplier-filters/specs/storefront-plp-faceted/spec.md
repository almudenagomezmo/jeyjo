## MODIFIED Requirements

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

### Requirement: PLP pagination preserves filters

The PLP SHALL paginate results (default page size 48) with page links that preserve active filter and sort query parameters including `supplier`.

#### Scenario: Page two keeps brand and supplier filters

- **WHEN** a user is on page 1 with `brand=BIC` and `supplier=Distrisantiago` and follows the link to `page=2`
- **THEN** page 2 results remain filtered by brand BIC and supplier Distrisantiago

#### Scenario: Page two keeps filters

- **WHEN** a user is on page 1 with `brand=bic` and follows the link to `page=2`
- **THEN** page 2 results remain filtered by brand BIC
