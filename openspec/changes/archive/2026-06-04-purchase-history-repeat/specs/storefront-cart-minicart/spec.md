## ADDED Requirements

### Requirement: Cart supports batch add from purchase history repeat

The cart store SHALL expose an action to add multiple products by CMS `productId` and quantity in one call, used after a successful purchase history repeat API response, preserving merge-by-product semantics of `addItem`.

#### Scenario: Batch add merges with existing lines

- **WHEN** the cart already contains product slug `bic-cristal-azul` with quantity 2
- **AND** batch add includes the same product with quantity 12
- **THEN** the line quantity becomes 14

#### Scenario: Batch add opens minicart feedback

- **WHEN** purchase history repeat returns two valid additions and the UI invokes batch add
- **THEN** the minicart MAY open to confirm items were added
- **AND** line prices are refreshed via existing batch pricing hooks
