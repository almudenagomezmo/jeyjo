# Backoffice catalog Excel import

## Purpose

PIM admin workflow for uploading, validating, and applying Avansuite catalog Excel imports and exporting catalog data (US-15, RF-023 Excel branch).

## Requirements

### Requirement: PIM catalog import area for staff

Staff with roles `superadmin` or `catalogo` SHALL access `/admin/catalog-import` to upload `ImportaciónArticulos.xlsx` files (US-15 CA1).

#### Scenario: Upload valid Excel for dry-run

- **WHEN** a catalogo staff user uploads a valid `.xlsx` file under 15 MB
- **THEN** the UI displays a parse summary with counts of valid rows, errors, and wildcards
- **AND** no Payload catalog fields are mutated until the user confirms apply

#### Scenario: Upload rejected for wrong extension

- **WHEN** staff uploads a `.csv` file
- **THEN** the upload is rejected with a message requiring `.xlsx`

### Requirement: Pre-apply validation lists errors clearly

Before apply, the system SHALL list row-level and workbook-level errors with human-readable messages (US-15 CA2).

#### Scenario: Blocking errors prevent apply

- **WHEN** dry-run reports 3 blocking row errors and 47 valid rows
- **THEN** the Apply button is disabled
- **AND** the error table lists line number, column, and message for each blocking error

#### Scenario: Warnings allow apply with confirmation

- **WHEN** dry-run reports only non-blocking warnings (e.g. unknown category)
- **THEN** staff can confirm apply after acknowledging the warning count

### Requirement: Apply updates catalog commercial fields

Confirmed apply SHALL update product commercial fields from parsed DTOs. When `webNativeMode` is true, apply SHALL write commercial product fields directly to Payload without requiring `ERP_ADAPTER=excel` preload or `ErpCatalogReader` as intermediary. When `webNativeMode` is false, confirmed apply SHALL run `ErpCatalogSyncService` over parsed DTOs and update references, descriptions, P1/P2, VAT, pack units, EAN, and resolved categories (US-15 CA3).

#### Scenario: Apply updates commercial fields in web-native mode

- **WHEN** `webNativeMode` is true and staff applies a valid import with updated P2 prices
- **THEN** matching products reflect new P2 values in Payload
- **AND** no ERP catalog sync orchestrator runs

#### Scenario: Successful apply updates prices in ERP mode

- **WHEN** `webNativeMode` is false and staff applies an import where `REF-001` changes `PrecioP1` from 10.00 to 10.50
- **THEN** the Payload product with `skuErp=REF-001` stores `p1Price=10.50` after apply
- **AND** `syncErpAt` is refreshed

#### Scenario: Apply requires staff authentication

- **WHEN** an unauthenticated request posts to catalog import apply
- **THEN** the response status is 401

### Requirement: Import run is audited

Each successful or partial apply SHALL append an immutable `audit_log` row with actor, timestamp, processed count, error count, and wildcard count (US-15 CA5).

#### Scenario: Audit entry after import

- **WHEN** superadmin applies an import of 200 rows with 2 errors and 1 wildcard
- **THEN** `audit_log` contains `action=IMPORT_CATALOG_EXCEL` with `new_value` summarizing `{ processed: 198, errors: 2, wildcards: 1 }`

### Requirement: Catalog export download from PIM area

Staff SHALL download an Excel export of the current catalog from the same admin view (RD-004).

#### Scenario: Export generates downloadable xlsx

- **WHEN** catalogo staff clicks Exportar catálogo
- **THEN** the browser downloads `ImportaciónArticulos_export_YYYYMMDD.xlsx`
- **AND** the file includes all products with non-empty `skuErp`

### Requirement: Downloadable import template

The import area SHALL provide a link to download a template `.xlsx` with documented column headers.

#### Scenario: Template download

- **WHEN** staff clicks Descargar plantilla
- **THEN** a template file downloads with headers matching `docs/avansuite-catalog-import.md`
