# Backoffice order Avansuite export

## Purpose

Excel export of web orders for manual import into Avansuite ERP (RI-002, CA-BACKEND-004).

## Requirements

### Requirement: Export single order to Avansuite-compatible Excel

Staff with orders access SHALL download an Excel file from the order detail or OMS inbox that conforms to the Avansuite albarán import template documented for Jeyjo (RI-002).

#### Scenario: Export confirmed order from detail

- **WHEN** staff clicks Exportar para Avansuite on order PED-2026-0050 in status `confirmed` with three line items
- **THEN** the browser downloads an `.xlsx` file
- **AND** the workbook contains one row per line with ERP reference, quantity, and unit price columns defined in the export schema

#### Scenario: Export blocked for non-exportable status

- **WHEN** staff attempts export on an order in `pending_payment`
- **THEN** the operation is rejected with an error explaining eligible statuses

### Requirement: EVA orders export only after validation

Orders with `origin` eva SHALL be exportable only when `validatedEva` is true.

#### Scenario: Unvalidated EVA export denied

- **WHEN** staff attempts export on an EVA order with `validatedEva` false
- **THEN** export is rejected

### Requirement: Bulk export of selected orders

The OMS inbox SHALL support exporting up to 50 selected eligible orders in one download (single workbook with one sheet per order or equivalent documented format).

#### Scenario: Bulk export two orders

- **WHEN** staff selects two confirmed orders and chooses bulk export
- **THEN** one downloadable file contains data for both orders
- **AND** each order's lines are distinguishable in the file structure

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
