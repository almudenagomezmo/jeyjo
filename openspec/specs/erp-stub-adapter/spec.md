# ERP stub adapter

## Purpose

Development and test stub implementation of ERP catalog ports with deterministic data and optional failure simulation.

## Requirements

### Requirement: Stub adapter provides deterministic catalog data

The stub implementation of `ErpCatalogReader` SHALL return a fixed set of sample products and suppliers suitable for local development and automated tests, aligned with Jeyjo seed SKUs where applicable.

#### Scenario: List products in stub mode

- **WHEN** `ERP_ADAPTER=stub` and a consumer calls `listProducts`
- **THEN** at least two products are returned with distinct `skuErp` values and valid `p1Price` / `p2Price`

#### Scenario: Get missing SKU returns null

- **WHEN** `getProductBySku` is called with a SKU not in the stub dataset
- **THEN** the result is `null` without throwing

### Requirement: Stub writer records upserts in memory

The stub `ErpCatalogWriter` SHALL apply upserts to an in-memory store so repeated reads reflect writes within the same process.

#### Scenario: Idempotent product upsert

- **WHEN** `upsertProduct` is called twice with the same `skuErp` and different `p2Price`
- **THEN** a subsequent `getProductBySku` returns the latest `p2Price` exactly once per SKU

### Requirement: Stub can simulate ERP failure

The stub adapter SHALL support a test-only configuration to simulate `ERP_UNAVAILABLE` for resilience tests (RNF-007 preparation).

#### Scenario: Simulated outage

- **WHEN** failure simulation is enabled and a read method is invoked
- **THEN** the call rejects with `ErpIntegrationError` code `ERP_UNAVAILABLE`

### Requirement: Stub includes CA-PRECIOS fixture SKUs

The stub `ErpCatalogReader` dataset SHALL include products REF-001, REF-002, REF-003, and REF-004 with P1/P2/vatRate values aligned to CA-PRECIOS-001..004 documentation.

#### Scenario: REF-003 present with offer-compatible base prices

- **WHEN** `getProductBySku('REF-003')` is called in stub mode
- **THEN** the DTO includes p1Price 12, p2Price 10, and vatRate 21

#### Scenario: REF-004 present for special price scenario

- **WHEN** `getProductBySku('REF-004')` is called in stub mode
- **THEN** the DTO includes p1Price 10 and p2Price 8 with vatRate 21

### Requirement: Stub includes wildcard reference SKU

The stub catalog dataset SHALL include SKU 9000000001 with `isWildcard: true` for RF-006 sync and exclusion tests (CA-BACKEND-002 preparation).

#### Scenario: Wildcard SKU in listProducts

- **WHEN** `listProducts` is called in stub mode
- **THEN** an item with `skuErp` 9000000001 and `isWildcard: true` is included

### Requirement: Stub pricing reader aligns with catalog fixtures

The stub `ErpPricingReader` SHALL return special prices and group offers consistent with REF-001..004 catalog fixtures when pricing sync runs.

#### Scenario: Group offer targets REF-003

- **WHEN** `listGroupOffers` is called in stub mode
- **THEN** an active offer for skuErp REF-003 with net price 8.00 is returned

### Requirement: Stub documents reader implements full Contabilidad surface

The stub `ErpDocumentsReader` SHALL implement `listDeliveryNotesByCustomer`, `listDuePaymentsByCustomer`, `getForm347Summary`, `listErpQuotesByCustomer`, and `getDocumentPdf` with deterministic fixtures for `B2B-EMPRESA1` and `B2B-EMPRESA2` aligned to **CA-B2B-001..003**. `listDeliveryNotes` without customer filter MAY delegate to aggregated stub data for admin tooling.

#### Scenario: listDeliveryNotes no longer throws in stub

- **WHEN** `listDeliveryNotesByCustomer('B2B-EMPRESA1')` is called with `ERP_ADAPTER=stub`
- **THEN** the call succeeds without `ERP_NOT_IMPLEMENTED`

#### Scenario: CA-B2B-003 fixture invoices present

- **WHEN** `listDuePaymentsByCustomer('B2B-EMPRESA1')` runs in stub mode
- **THEN** items include FAC-2024-001 overdue and FAC-2026-050 pending with outstanding amounts 150.00 and 300.00 EUR

### Requirement: Stub invoice fixtures include US-08 metadata

Stub invoices for `B2B-EMPRESA1` SHALL include at least three invoices spanning multiple years within five years, with `invoiceNumber`, `netAmount`, `grossAmount`, and downloadable PDF ids including INV-2026-0001 used by invoice notification sync (#28).

#### Scenario: Notification sync invoice remains listable

- **WHEN** invoice sync (#28) references id INV-2026-0001 for B2B-EMPRESA1
- **THEN** the same id appears in portal invoice list with full US-08 columns

#### Scenario: Five-year exclusion fixture

- **WHEN** stub includes an invoice dated six years ago for B2B-EMPRESA1
- **THEN** `listInvoicesByCustomer('B2B-EMPRESA1')` excludes that invoice

### Requirement: Stub PDF generator produces valid application/pdf

For development, stub `getDocumentPdf` SHALL return minimal valid PDF bytes (may include visible `[STUB]` watermark text) without calling external services.

#### Scenario: PDF magic header present

- **WHEN** stub `getDocumentPdf` is invoked for any owned document id
- **THEN** the first bytes of `bytes` start with `%PDF-`
