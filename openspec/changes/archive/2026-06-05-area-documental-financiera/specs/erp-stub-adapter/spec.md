## ADDED Requirements

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
