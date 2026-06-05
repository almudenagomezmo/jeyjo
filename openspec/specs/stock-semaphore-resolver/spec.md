# Stock semaphore resolver

## Purpose

Pure multi-source stock indicator resolution for public-safe storefront display without exposing numeric quantities.

## Requirements

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

The CMS and storefront SHALL read the global low-stock threshold from CMS `systemSettings` via `GET /api/system/config`, falling back to `STOCK_LOW_THRESHOLD` environment variable with default **5** for semaphore resolution (CA-ERP-001).

#### Scenario: Custom threshold applied from CMS

- **WHEN** `systemSettings.stockLowThreshold` is 8 and `erpStock=6`
- **THEN** the resolved indicator level is `low`

#### Scenario: Env fallback when CMS unavailable

- **WHEN** `systemSettings` cannot be loaded and `STOCK_LOW_THRESHOLD=10` and `erpStock=8`
- **THEN** the resolved indicator level is `low`

#### Scenario: Default threshold when neither CMS nor env set

- **WHEN** no CMS value and no env override exist and `erpStock=4`
- **THEN** the resolved indicator level is `low` using default threshold 5

### Requirement: Stale source flag supports RNF-007 degradation

When a wholesale source failed in the latest sync run, `resolveStockIndicator` output consumed by storefront SHALL include `isStale=true` if any contributing source has not synced within the configured staleness window or failed in the last run.

#### Scenario: Distrisantiago outage marks stale

- **WHEN** the latest `stock_sync_runs` row shows Distrisantiago failure and ERP data is served from cache
- **THEN** storefront indicator includes `isStale=true` without changing the computed level from last known quantities
