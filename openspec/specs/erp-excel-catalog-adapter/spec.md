# ERP Excel catalog adapter

## Purpose

`ErpCatalogReader` and `ErpCatalogWriter` implementations backed by Avansuite Excel files when `ERP_ADAPTER=excel`.

## Requirements

### Requirement: Excel adapter implements ErpCatalogReader

The CMS Excel adapter SHALL implement `ErpCatalogReader` by reading catalog data from a configured Excel file path or from an in-memory DTO set produced by the import UI.

#### Scenario: List products from configured file

- **WHEN** `ERP_ADAPTER=excel` and `ERP_EXCEL_CATALOG_PATH` points to a valid `ImportaciónArticulos.xlsx`
- **THEN** `listProducts` returns paginated `ErpProductDto` items parsed from that file
- **AND** pagination uses cursor semantics consistent with other adapters

#### Scenario: Get product by SKU from parsed file

- **WHEN** the configured Excel file contains `Referencia=REF-012`
- **THEN** `getProductBySku('REF-012')` resolves to the matching DTO or `null` if absent

### Requirement: Excel adapter implements ErpCatalogWriter for export buffer

The Excel adapter SHALL implement `ErpCatalogWriter` by accumulating upsert DTOs and flushing them to an in-memory workbook via `@jeyjo/erp-excel`.

#### Scenario: Writer upsert accumulates products

- **WHEN** a consumer calls `upsertProduct` twice with distinct `skuErp` values
- **THEN** both DTOs are retained until `flush()` is invoked
- **AND** `flush()` returns an `.xlsx` buffer containing both products

#### Scenario: Writer rejects product without skuErp

- **WHEN** `upsertProduct` is called without `skuErp`
- **THEN** the adapter rejects with `ErpIntegrationError` coded `ERP_VALIDATION`

### Requirement: Excel adapter does not implement documents read

Document list methods on the Excel bundle SHALL remain unimplemented with `ERP_NOT_IMPLEMENTED`.

#### Scenario: Documents reader unavailable

- **WHEN** a consumer requests invoice list on the Excel adapter bundle
- **THEN** the operation fails with `ERP_NOT_IMPLEMENTED`
