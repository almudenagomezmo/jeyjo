## ADDED Requirements

### Requirement: Catalog sync recalculates stock indicator after ERP stock changes

After a successful catalog read sync that updates product `erpStock` values, the catalog orchestrator SHALL invoke stock indicator recalculation for all SKUs updated in that run without re-pulling wholesale sources.

#### Scenario: ERP stock drop triggers indicator recalculation

- **WHEN** catalog sync updates REF-002 `erpStock` from 50 to 2
- **THEN** `stockIndicator` for REF-002 is recalculated to `low` when threshold is 5, without waiting for the next wholesale stock cron

#### Scenario: Catalog sync failure skips indicator recalculation

- **WHEN** catalog sync aborts due to `ERP_UNAVAILABLE` before applying product updates
- **THEN** no stock indicator recalculation runs and existing indicators remain unchanged

### Requirement: Catalog and stock sync compose without clearing wholesale data

Catalog read sync failures SHALL NOT clear wholesale stock fields; stock sync failures SHALL NOT clear ERP catalog fields populated by catalog sync.

#### Scenario: ERP outage preserves wholesale stock

- **WHEN** catalog sync fails with `ERP_UNAVAILABLE`
- **THEN** `distrisantiagoStock`, `arnoiaStock`, and previously computed `stockIndicator` remain unchanged
