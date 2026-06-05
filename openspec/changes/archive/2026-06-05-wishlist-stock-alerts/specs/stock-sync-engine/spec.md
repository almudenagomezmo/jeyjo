## ADDED Requirements

### Requirement: Stock sync invokes wishlist alert processing

When `runStockSync()` completes with status `success` or `partial` and `productsUpdated` is greater than zero, the orchestrator SHALL pass updated SKU transition data to wishlist stock alert processing before returning the sync result.

#### Scenario: Successful sync with updates triggers wishlist job

- **WHEN** a stock sync run updates at least one product indicator
- **THEN** wishlist stock alert processing is invoked with the list of SKU transitions

#### Scenario: Zero updates skips wishlist job

- **WHEN** a stock sync run updates zero products
- **THEN** wishlist stock alert processing is not invoked

## MODIFIED Requirements

### Requirement: Stock sync orchestrator pulls wholesale sources and updates products

The CMS SHALL expose `runStockSync()` that reads Distrisantiago and Arnoia via the stock registry, matches snapshots to Payload products by `mainWholesaleRef` with fallback to `skuErp`, updates internal wholesale stock fields under `stockSync` context, recalculates `stockIndicator` per affected product, and records per-SKU previous and new indicators for wishlist alert evaluation.

#### Scenario: Successful wholesale sync updates matched products

- **WHEN** the orchestrator runs with stub adapters and Payload contains products whose `mainWholesaleRef` matches stub snapshots
- **THEN** `distrisantiagoStock` and/or `arnoiaStock` update, sync timestamps refresh, and `stockIndicator` is recalculated

#### Scenario: Unmatched wholesale ref preserves previous stock

- **WHEN** a product has no matching snapshot in a source for the current run
- **THEN** the previous quantity for that source remains unchanged and the run continues for other products
