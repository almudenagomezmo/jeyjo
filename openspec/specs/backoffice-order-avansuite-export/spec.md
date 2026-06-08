# Backoffice order Avansuite export

## Purpose

Excel export of web orders for manual import into Avansuite ERP (RI-002, CA-BACKEND-004).

## Requirements

### Requirement: Export single order to Avansuite-compatible Excel

When `systemSettings.webNativeMode` is false, staff with orders access SHALL download an Excel file from the order detail or OMS inbox that conforms to the Avansuite albarán import template documented for Jeyjo (RI-002). When `webNativeMode` is true, export actions and the `POST /export-avansuite` endpoint SHALL be hidden or disabled and SHALL respond with HTTP 410 if invoked.

#### Scenario: Export confirmed order from detail in ERP mode

- **WHEN** `webNativeMode` is false and staff clicks Exportar para Avansuite on order PED-2026-0050 in status `confirmed`
- **THEN** the browser downloads an `.xlsx` file with line items per the export schema

#### Scenario: Export blocked in web-native mode

- **WHEN** `webNativeMode` is true and staff attempts Avansuite export
- **THEN** the operation is rejected with HTTP 410 or UI disabled state explaining ERP export is unavailable

#### Scenario: Export blocked for non-exportable status in ERP mode

- **WHEN** `webNativeMode` is false and staff attempts export on an order in `pending_payment`
- **THEN** the operation is rejected with an error explaining eligible statuses

### Requirement: EVA orders export only after validation

Orders with `origin` eva SHALL be exportable only when `validatedEva` is true.

#### Scenario: Unvalidated EVA export denied

- **WHEN** staff attempts export on an EVA order with `validatedEva` false
- **THEN** export is rejected

### Requirement: Bulk export of selected orders

When `webNativeMode` is false, the OMS inbox SHALL support exporting up to 50 selected eligible orders in one download. When `webNativeMode` is true, bulk export SHALL be unavailable.

#### Scenario: Bulk export two orders in ERP mode

- **WHEN** `webNativeMode` is false and staff selects two confirmed orders and chooses bulk export
- **THEN** one downloadable file contains data for both orders

#### Scenario: Bulk export unavailable in web-native mode

- **WHEN** `webNativeMode` is true and staff selects orders for bulk export
- **THEN** bulk export control is not available

### Requirement: Pre-export validation prevents malformed Excel

The export pipeline SHALL validate required fields (customer ERP code or CIF, line SKU, positive quantity) before generating the file.

#### Scenario: Missing customer ERP identifier

- **WHEN** an order lacks both resolvable customer ERP code and CIF for export
- **THEN** export fails with a validation message listing the missing field
- **AND** no file is generated

### Requirement: Export timestamp recorded on order

After a successful export, the system SHALL set `exportedToErpAt` on each exported order without preventing subsequent re-exports.

#### Scenario: First export sets timestamp

- **WHEN** export succeeds for an order without prior `exportedToErpAt`
- **THEN** `exportedToErpAt` is set to the export time
