## ADDED Requirements

### Requirement: Products store multisource wholesale stock fields

The CMS `products` collection SHALL include read-only fields `distrisantiagoStock`, `arnoiaStock`, `stockIndicator` (enum: `available`, `low`, `limited`), `syncDistrisantiagoAt`, and `syncArnoiaAt`, grouped with ERP stock fields. Numeric wholesale stock fields SHALL only change via authorized stock sync operations (`stockSync` request context) or ERP catalog sync recalculation paths, not through staff manual edits.

#### Scenario: Admin views multisource stock fields

- **WHEN** a staff user opens a product ERP/stock tab
- **THEN** fields `erpStock`, `distrisantiagoStock`, `arnoiaStock`, `stockIndicator`, and per-source sync timestamps are visible and read-only

#### Scenario: Staff cannot edit stock sync fields manually

- **WHEN** a staff user attempts to save changes to `distrisantiagoStock`, `arnoiaStock`, or `stockIndicator` via the admin UI
- **THEN** the save is rejected or the fields remain unchanged until a stock sync or recalculation updates them

#### Scenario: Stock sync updates wholesale fields and indicator

- **WHEN** the stock sync orchestrator applies snapshots for a product with `stockSync` context
- **THEN** matching wholesale stock fields and sync timestamps update and `stockIndicator` reflects the semaphore resolver output

### Requirement: ERP stock field remains ERP-sourced

The existing `erpStock` field SHALL continue to update only via `ErpCatalogSyncService` with `erpSync` context; stock sync MUST NOT overwrite `erpStock`.

#### Scenario: Wholesale sync does not mutate erpStock

- **WHEN** `runStockSync()` updates `distrisantiagoStock` for a product
- **THEN** `erpStock` remains unchanged from the last ERP catalog sync
