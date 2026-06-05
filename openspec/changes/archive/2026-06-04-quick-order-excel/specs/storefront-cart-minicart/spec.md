## ADDED Requirements

### Requirement: Cart supports batch add from quick order

The cart store `addItems` action SHALL merge quantities when quick order (manual, Excel, or API add) adds a product already present in the cart, and the minicart SHALL refresh prices via existing batch pricing hooks (RF-019).

#### Scenario: Quick order merges quantity on duplicate SKU

- **WHEN** the cart already contains product slug `ref-001` with quantity 2
- **AND** quick order add returns the same product with quantity 5
- **THEN** the cart line quantity becomes 7

#### Scenario: Excel batch add opens minicart feedback

- **WHEN** the user adds multiple valid Excel rows to the cart
- **THEN** the minicart may open or a toast offers navigation to `/cart`
- **AND** line prices are resolved via `/api/pricing/batch`
