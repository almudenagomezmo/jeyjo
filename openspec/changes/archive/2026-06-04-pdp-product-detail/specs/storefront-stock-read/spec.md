## ADDED Requirements

### Requirement: PDP buy box shows stock semaphore from indicator

The PDP buy box SHALL display the public stock indicator using `StockIndicatorBadge` or equivalent semaphore UI driven by `getStockIndicator` or CMS `stockIndicator`, not numeric `product.stock`.

#### Scenario: Indicator replaces numeric stock on PDP

- **WHEN** the PDP renders for a product with indicator level `low`
- **THEN** the buy box shows the low-stock label without a numeric quantity

### Requirement: PDP add-to-cart respects allowOrderWithoutStock

The PDP add-to-cart control SHALL enable ordering when `allowOrderWithoutStock` is true even if indicator level is `limited`, and SHALL disable ordering when level is `limited` and the flag is false (US-03 CA4).

#### Scenario: Allow order without stock enables button

- **WHEN** indicator level is `limited` and `allowOrderWithoutStock` is true
- **THEN** the add-to-cart button is enabled

#### Scenario: Limited without flag disables button

- **WHEN** indicator level is `limited` and `allowOrderWithoutStock` is false
- **THEN** the add-to-cart button is disabled with an out-of-stock or limited label

### Requirement: PDP shows pending validation message for backorder

When a user adds a limited-stock product with `allowOrderWithoutStock` enabled, the PDP SHALL display the US-03 CA4 message referencing the product SKU or reference.

#### Scenario: Backorder message on add

- **WHEN** the user adds to cart a product with `allowOrderWithoutStock` true and limited indicator
- **THEN** the UI shows that the order is pending stock validation for that reference

### Requirement: Batch stock read for PDP related SKUs

The storefront SHALL resolve stock indicators for related product SKUs on the PDP in a server-side batch consistent with PLP batch semantics and ~60s cache TTL.

#### Scenario: Related cards do not N+1 CMS

- **WHEN** the PDP renders eight related products
- **THEN** stock indicators for those SKUs load via a batched server path (verified by test mock call count ≤ 2)
