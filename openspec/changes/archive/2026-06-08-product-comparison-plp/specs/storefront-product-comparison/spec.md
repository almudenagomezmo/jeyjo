## ADDED Requirements

### Requirement: Compare selection limited to three products US-06 CA2

The storefront SHALL allow a visitor to select between 2 and 3 products for comparison. The compare store SHALL reject a fourth selection and display the message **"Solo puedes comparar hasta 3 productos a la vez"** without altering the existing three selections.

#### Scenario: Fourth product rejected

- **WHEN** a user already has three products selected for comparison and toggles compare on a fourth PLP card
- **THEN** the fourth product is not added
- **AND** the user sees the message "Solo puedes comparar hasta 3 productos a la vez"

#### Scenario: Toggle removes product from selection

- **WHEN** a user toggles compare off on a product already in the compare store
- **THEN** that SKU is removed from the selection

#### Scenario: Compare action requires at least two products

- **WHEN** only one product is selected and the user activates the compare bar primary action
- **THEN** navigation to the comparison page does not occur
- **AND** the UI indicates that at least two products are required

### Requirement: Comparison page shows side-by-side attributes US-06 CA3

The storefront SHALL provide a comparison page at `/comparar` that renders selected public products in parallel columns with rows for resolved dual price, brand, supplier, color, material, pack unit (labeled as packaging unit), stock availability indicator, and short description.

#### Scenario: Two products compared

- **WHEN** a user opens `/comparar?skus=SKU-A,SKU-B` and both SKUs are published non-wildcard products
- **THEN** the page shows two columns with side-by-side values for price, brand, supplier, color, material, pack unit, availability, and short description

#### Scenario: Three products compared

- **WHEN** a user opens `/comparar?skus=SKU-A,SKU-B,SKU-C` with three valid public SKUs
- **THEN** the page shows three comparison columns preserving the URL SKU order

#### Scenario: Invalid or unpublished SKU omitted

- **WHEN** a user opens `/comparar?skus=SKU-A,INVALID` and only SKU-A is public
- **THEN** the page shows a warning that fewer than two valid products remain
- **AND** does not render a single-column comparison table as success state

#### Scenario: Missing attribute shows placeholder

- **WHEN** a compared product has no `facetColor` value
- **THEN** the color row displays an em dash or equivalent empty placeholder for that column

### Requirement: Add to cart from comparison page US-06 CA4

Each product column on the comparison page SHALL offer add-to-cart that adds quantity in multiples of `packUnit`, updates the cart store, and opens the header minicart without leaving the comparison page.

#### Scenario: Add from comparison column

- **WHEN** a user adds a product with `packUnit` 6 from the comparison page
- **THEN** the cart receives quantity 6 (or increments by 6)
- **AND** the minicart opens

#### Scenario: Out of stock without allow-order blocks add

- **WHEN** a compared product stock indicator is `limited` and `allowOrderWithoutStock` is false
- **THEN** the add-to-cart control for that column is disabled

### Requirement: Compare selection persists during browsing

The compare selection SHALL persist in browser storage so navigating between PLP pages retains selected SKUs and reflected compare toggles until the user clears the selection or completes a session reset.

#### Scenario: Selection survives PLP navigation

- **WHEN** a user selects two products on `/c/escritura` and navigates to `/c/papel`
- **THEN** both products remain selected and the compare bar still shows count 2

#### Scenario: Clear all removes selection

- **WHEN** a user activates clear on the compare bar
- **THEN** all compare toggles reset and the bar hides

### Requirement: Comparison page uses resolved catalog prices and stock

The comparison page SHALL resolve display prices via the same pricing batch mechanism as PLP (RF-011) and stock via public stock indicators (RF-005), respecting the header B2C/B2B price mode toggle.

#### Scenario: Dual price on comparison

- **WHEN** a compared product has a list price higher than net unit price
- **THEN** the price row shows dual price presentation consistent with PLP cards

#### Scenario: Stock semaphore on comparison

- **WHEN** a compared product is available for shipment today
- **THEN** the availability row shows the same public stock indicator badge as PLP
