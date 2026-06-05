## ADDED Requirements

### Requirement: Manual Excel import runs persist sync metadata

When catalog sync is triggered from the PIM Excel import apply action, the system SHALL persist an `erp_sync_runs` row and audit log entry with `source=excel_import` and adapter `excel`.

#### Scenario: Excel import run recorded

- **WHEN** staff applies a catalog Excel import that updates 120 products with 0 fatal errors
- **THEN** `erp_sync_runs` contains a row with `adapter=excel`, `source=excel_import`, and `status=success` or `partial`
- **AND** `finished_at` is set

#### Scenario: Failed Excel parse does not create sync run

- **WHEN** dry-run reports blocking workbook errors and staff has not applied
- **THEN** no `erp_sync_runs` row is created
- **AND** Payload ERP fields remain unchanged

### Requirement: Excel import triggers stock indicator recalculation for updated SKUs

After a successful Excel import apply that updates `erpStock` values, the system SHALL recalculate stock indicators for all SKUs updated in that run using the same post-sync hook as scheduled catalog sync.

#### Scenario: Stock indicator updated after Excel import

- **WHEN** Excel import updates `REF-002` `erpStock` from 50 to 2
- **THEN** `stockIndicator` for `REF-002` is recalculated without waiting for the next wholesale stock cron
