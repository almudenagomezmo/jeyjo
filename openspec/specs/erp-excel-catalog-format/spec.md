# ERP Excel catalog format

## Purpose

Parse and serialize Avansuite `ImportaciónArticulos.xlsx` workbooks into normalized `@jeyjo/erp-ports` DTOs for catalog import/export (US-15, RD-004).

## Requirements

### Requirement: ImportacionArticulos parser validates workbook structure

The `@jeyjo/erp-excel` package SHALL expose `parseImportacionArticulos` accepting an `.xlsx` buffer and returning parsed rows, row-level errors, and normalized `ErpProductDto` candidates.

#### Scenario: Valid workbook with header row

- **WHEN** the first sheet contains a header row matching column `Referencia` and at least 50 data rows with valid `skuErp`, `p1Price`, and `p2Price`
- **THEN** the parser returns 50 DTO candidates with zero blocking errors
- **AND** each DTO includes `skuErp` as a non-empty string

#### Scenario: Missing mandatory column

- **WHEN** the workbook lacks any column matching `(?i)referencia`
- **THEN** the parser returns a blocking workbook-level error
- **AND** zero DTO candidates are produced

#### Scenario: Row with invalid price

- **WHEN** row 12 has `PrecioP1` set to a non-numeric value
- **THEN** the parser includes a row error for line 12 coded `INVALID_PRICE`
- **AND** that row is excluded from DTO candidates

### Requirement: Wildcard SKUs are flagged during parse

The parser SHALL accept a configurable list of wildcard SKU values and set `isWildcard=true` on matching DTOs (RF-006).

#### Scenario: Known wildcard reference in file

- **WHEN** wildcard list contains `9000000001` and row 5 has `Referencia=9000000001`
- **THEN** the DTO for row 5 has `isWildcard=true`
- **AND** the parse summary counts one wildcard

### Requirement: Serializer produces Avansuite-compatible export workbook

The package SHALL expose `serializeImportacionArticulos` that generates an `.xlsx` workbook with the same column headers documented for import (RD-004).

#### Scenario: Export two products

- **WHEN** `serializeImportacionArticulos` receives two complete `ErpProductDto` records
- **THEN** the output buffer is a valid `.xlsx` file
- **AND** the first data row after headers contains both SKUs in the `Referencia` column

### Requirement: EAN validation on parse

When an EAN column is present, the parser SHALL validate EAN-13 or EAN-8 check digits per RD-005 before accepting the row.

#### Scenario: Invalid EAN check digit

- **WHEN** row 8 has `CodigoEAN` with an invalid check digit
- **THEN** the parser returns row error `INVALID_EAN` for line 8
- **AND** the row is excluded unless configured as warning-only in apply step
