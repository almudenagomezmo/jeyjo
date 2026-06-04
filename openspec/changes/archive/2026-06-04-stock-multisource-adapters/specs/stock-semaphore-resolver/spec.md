## ADDED Requirements

### Requirement: Semaphore resolver aggregates multi-source stock without public quantities

The system SHALL expose a pure function `resolveStockIndicator` that accepts internal quantities from ERP and wholesale sources plus a configurable low-stock threshold, and returns a public-safe indicator with levels `available`, `low`, or `limited` and Spanish labels per RF-005, never exposing numeric quantities in the return value.

#### Scenario: ERP or wholesaler stock yields available

- **WHEN** `erpStock=100`, wholesale sources are null or zero, and threshold is 5
- **THEN** the indicator level is `available` with label "Disponible"

#### Scenario: ERP low stock yields low indicator

- **WHEN** `erpStock=2`, `distrisantiagoStock=100`, threshold is 5
- **THEN** the indicator level is `low` with label "Últimas unidades"

#### Scenario: No source data yields limited

- **WHEN** `erpStock`, `distrisantiagoStock`, and `arnoiaStock` are all null or undefined
- **THEN** the indicator level is `limited` with label "Disponibilidad limitada según fabricante"

#### Scenario: Zero across known sources yields limited

- **WHEN** all sources report explicit zero quantity
- **THEN** the indicator level is `limited`

### Requirement: Low stock threshold is configurable

The CMS and storefront SHALL read `STOCK_LOW_THRESHOLD` from environment with default **5** for semaphore resolution (CA-ERP-001).

#### Scenario: Custom threshold applied

- **WHEN** `STOCK_LOW_THRESHOLD=10` and `erpStock=8`
- **THEN** the resolved indicator level is `low`

### Requirement: Stale source flag supports RNF-007 degradation

When a wholesale source failed in the latest sync run, `resolveStockIndicator` output consumed by storefront SHALL include `isStale=true` if any contributing source has not synced within the configured staleness window or failed in the last run.

#### Scenario: Distrisantiago outage marks stale

- **WHEN** the latest `stock_sync_runs` row shows Distrisantiago failure and ERP data is served from cache
- **THEN** storefront indicator includes `isStale=true` without changing the computed level from last known quantities
