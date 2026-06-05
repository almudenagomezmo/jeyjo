# ERP documents read adapter

## Purpose

Extended `ErpDocumentsReader` DTOs and customer-scoped list methods for B2B Contabilidad (RF-016, RF-017, US-08, US-09).

## Requirements

### Requirement: Extended invoice list DTO for portal

`ErpInvoiceListItem` SHALL include fields required by **US-08**: `invoiceNumber`, `issuedAt`, `netAmount`, `grossAmount`, `currency`, `status` (only values equivalent to ERP "Factura a cliente actualizada"), and `customerErpCode`. List methods SHALL exclude draft or non-updated invoice states.

#### Scenario: Stub invoice exposes US-08 columns

- **WHEN** `listInvoicesByCustomer('B2B-EMPRESA1')` runs in stub mode
- **THEN** each item includes `invoiceNumber`, `netAmount`, `grossAmount`, and `status` `updated`
- **AND** no item has status `draft`

#### Scenario: Five-year window enforced server-side

- **WHEN** a consumer lists invoices for a customer with a fixture dated more than five years ago
- **THEN** that invoice is not returned

### Requirement: Delivery notes list with ERP status

`ErpDocumentsReader` SHALL expose `listDeliveryNotesByCustomer(customerErpCode, options?)` returning `ErpDeliveryNoteListItem` with at least `id`, `deliveryNoteNumber`, `issuedAt`, `status` (`issued` | `preparing`), and `customerErpCode`.

#### Scenario: Stub returns issued and preparing albaranes

- **WHEN** `listDeliveryNotesByCustomer('B2B-EMPRESA1')` runs in stub mode
- **THEN** at least one item has `status` `issued`
- **AND** at least one item has `status` `preparing`

### Requirement: Due payments list for vencimientos

The documents port SHALL expose `listDuePaymentsByCustomer(customerErpCode, options?)` returning `ErpDuePaymentListItem` with `invoiceNumber`, `invoiceDate`, `dueDate`, `outstandingAmount`, `currency`, and `isOverdue` derived from due date versus current date in `Europe/Madrid`.

#### Scenario: CA-B2B-003 overdue flag

- **WHEN** stub data includes FAC-2024-001 with due date in the past and positive outstanding amount
- **THEN** the item has `isOverdue` true
- **AND** a future-due invoice has `isOverdue` false

#### Scenario: Total outstanding is sum of items

- **WHEN** two stub due payments have outstanding 150.00 and 300.00 EUR
- **THEN** consumers can compute total 450.00 EUR from the returned list

### Requirement: Form 347 annual summary

The documents port SHALL expose `getForm347Summary(customerErpCode, fiscalYear)` returning `ErpForm347Summary` with `fiscalYear`, `totalOperationsAmount`, `currency`, and optional breakdown metadata sufficient to render the Contabilidad > Cifra 347 page.

#### Scenario: Stub returns 347 for test company

- **WHEN** `getForm347Summary('B2B-EMPRESA1', 2025)` is called in stub mode
- **THEN** a summary with positive `totalOperationsAmount` and `currency` EUR is returned

### Requirement: ERP quotes list for Contabilidad presupuestos

The documents port SHALL expose `listErpQuotesByCustomer(customerErpCode, options?)` returning `ErpErpQuoteListItem` with `quoteNumber`, `issuedAt`, `validUntil`, `netAmount`, `grossAmount`, `status` (`active` | `expired`), and `customerErpCode`. This list is distinct from Payload web `quotes` collection.

#### Scenario: Stub includes active and expired ERP quotes

- **WHEN** `listErpQuotesByCustomer('B2B-EMPRESA1')` runs in stub mode
- **THEN** at least one quote has `status` `active`
- **AND** at least one quote has `status` `expired`

### Requirement: Original PDF bytes from ERP

`ErpDocumentsReader` SHALL expose `getDocumentPdf(input: { type: ErpDocumentType; documentId: string; customerErpCode: string })` returning `{ bytes: Uint8Array; contentType: 'application/pdf'; fileName: string }`. The bytes SHALL be the ERP-original document, not a web-regenerated layout (**US-08 CA4**).

#### Scenario: Stub returns PDF for invoice id

- **WHEN** `getDocumentPdf` is called for a stub invoice id belonging to `B2B-EMPRESA1`
- **THEN** the response content type is `application/pdf`
- **AND** the byte length is greater than zero

#### Scenario: Cross-customer PDF denied

- **WHEN** `getDocumentPdf` is called with `customerErpCode` A for a document id owned by customer B in stub data
- **THEN** the operation rejects with `ErpIntegrationError` code `ERP_VALIDATION`

### Requirement: Customer-scoped list methods never leak cross-tenant data

All `*ByCustomer` methods SHALL filter strictly by `customerErpCode` (**CA-B2B-002**, **RNF-009**).

#### Scenario: empresa-a does not see empresa-b invoices

- **WHEN** `listInvoicesByCustomer('B2B-EMPRESA1')` and `listInvoicesByCustomer('B2B-EMPRESA2')` run in stub mode
- **THEN** no invoice id appears in both result sets
