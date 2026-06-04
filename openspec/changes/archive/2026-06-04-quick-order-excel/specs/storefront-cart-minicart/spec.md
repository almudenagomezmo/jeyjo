## ADDED Requirements

### Requirement: Cart supports batch add from quick order

The cart store `addItems` action SHALL be invoked after a successful `POST /api/intranet/quick-order/add-to-cart` response, with the same merge-by-product semantics as purchase history repeat. Non-catalog quick order requests SHALL NOT invoke `addItems`.

#### Scenario: Quick order Excel batch merges quantities

- **WHEN** the cart contains product slug `ref-a` with quantity 2
- **AND** quick order add-to-cart returns `{ productId: ref-a, qty: 10 }`
- **THEN** the line quantity becomes 12

#### Scenario: Quick order opens minicart feedback

- **WHEN** quick order add-to-cart returns at least one addition
- **THEN** the minicart MAY open
- **AND** line prices refresh via existing batch pricing hooks
