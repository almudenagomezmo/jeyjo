## ADDED Requirements

### Requirement: PLP cards show stock semaphore from CMS indicator

Product cards on PLP routes SHALL display the public stock semaphore (`available`, `low`, `limited`) using `stockIndicator` from CMS or `getStockIndicator`, with labels per RF-005, without numeric quantities.

#### Scenario: Available indicator on card

- **WHEN** a listed product has `stockIndicator` `available`
- **THEN** the card shows the available-level badge label (e.g. "Disponible")

#### Scenario: Limited indicator on card

- **WHEN** a listed product has `stockIndicator` `limited`
- **THEN** the card shows the limited-level label without showing stock numbers

### Requirement: In-stock-for-shipment-today facet uses available level

The PLP facet "En stock para envío hoy" SHALL match only products whose public indicator level is `available`.

#### Scenario: Shipment-today filter excludes low stock

- **WHEN** a user enables "En stock para envío hoy"
- **THEN** products with indicator level `low` or `limited` are excluded from the grid

#### Scenario: Shipment-today filter includes available

- **WHEN** a product has indicator level `available`
- **THEN** it remains visible when the shipment-today facet is active

### Requirement: Batch stock read for PLP page SKUs

The storefront SHALL resolve stock indicators for all SKUs on the current PLP page in a server-side batch with caching consistent with single-SKU TTL (~60s) to avoid per-card CMS round-trips.

#### Scenario: Page render does not N+1 CMS per card

- **WHEN** a PLP page renders 24 products
- **THEN** stock indicators for those SKUs are loaded via a batched server path (verified by test mock call count ≤ 2)
