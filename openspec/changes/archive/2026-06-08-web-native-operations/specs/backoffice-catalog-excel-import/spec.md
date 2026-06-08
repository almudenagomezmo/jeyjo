## MODIFIED Requirements

### Requirement: Staff can import catalog from Excel via admin UI

The CMS SHALL expose the catalog import admin view with parse and apply steps for `ImportacionArticulos.xlsx` format. When `webNativeMode` is true, apply SHALL write commercial product fields directly to Payload without requiring `ERP_ADAPTER=excel` preload or `ErpCatalogReader` as intermediary.

#### Scenario: Parse validates rows before apply

- **WHEN** staff uploads an Excel file with one blocking validation error
- **THEN** parse returns `canApply: false` and lists the error with line number

#### Scenario: Apply updates commercial fields in web-native mode

- **WHEN** `webNativeMode` is true and staff applies a valid import with updated P2 prices
- **THEN** matching products reflect new P2 values in Payload
- **AND** no ERP catalog sync orchestrator runs

#### Scenario: Apply requires staff authentication

- **WHEN** an unauthenticated request posts to catalog import apply
- **THEN** the response status is 401
