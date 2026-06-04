# Storefront stock read

## Purpose

Server-side stock indicator resolution for the storefront without exposing internal numeric stock quantities.

## Requirements

### Requirement: Storefront resolves stock indicator by SKU server-side

The storefront SHALL expose `getStockIndicator(sku)` as a server-only function that loads the product from CMS, applies wildcard and publication filters from catalog read (#7), and returns `{ level, label, isStale, allowOrderWithoutStock }` or `null` when the product is not publicly visible.

#### Scenario: Published product returns indicator without quantities

- **WHEN** `getStockIndicator` is called for a published non-wildcard SKU with synced indicator `available`
- **THEN** the result includes `level=available` and `label="Disponible"` and does not include numeric stock fields

#### Scenario: Wildcard SKU returns null

- **WHEN** `getStockIndicator` is called for SKU `9000000001` marked wildcard
- **THEN** the result is `null`

#### Scenario: Draft product returns null

- **WHEN** the SKU exists only as a draft product
- **THEN** the result is `null`

### Requirement: Stock indicator read is cached

`getStockIndicator` SHALL use server-side caching (e.g. `unstable_cache` ~60s per SKU) to limit CMS load (RNF-003).

#### Scenario: Repeated reads use cache within TTL

- **WHEN** the same SKU is requested twice within the cache TTL
- **THEN** the second call does not require a fresh CMS round-trip (verified via test mock call counts)

### Requirement: Optional public stock API omits internal quantities

If exposed as `GET /api/stock/[sku]`, the JSON response SHALL include only public indicator fields (`level`, `label`, `isStale`, `allowOrderWithoutStock`) and MUST NOT expose `erpStock`, `distrisantiagoStock`, or `arnoiaStock`.

#### Scenario: API response shape

- **WHEN** a client calls the stock API for a valid published SKU
- **THEN** the JSON body contains indicator fields only with no numeric stock properties

### Requirement: Design tokens for semaphore levels are defined

The storefront SHALL define CSS custom properties in `globals.css` for stock indicator colors (`--stock-available`, `--stock-low`, `--stock-limited`) for consumption by UI components in change #11.

#### Scenario: Tokens present in globals

- **WHEN** inspecting `apps/storefront/src/app/globals.css`
- **THEN** the three stock color tokens are declared under `:root`

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
