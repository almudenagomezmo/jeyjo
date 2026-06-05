## MODIFIED Requirements

### Requirement: ERP documents read port is defined for future use

The system SHALL expose an `ErpDocumentsReader` interface in `@jeyjo/erp-ports` covering invoices, delivery notes, due payments, form 347 summary, ERP quotes, and original PDF retrieval, with customer-scoped list methods and typed DTOs (**RF-016**, **RF-017**, change #37).

#### Scenario: Documents port lists invoices by customer

- **WHEN** a consumer calls `listInvoicesByCustomer` with a valid `customerErpCode` on the active adapter
- **THEN** the method resolves to invoice list items without throwing `ERP_NOT_IMPLEMENTED` in stub mode

#### Scenario: Documents port returns PDF bytes

- **WHEN** a consumer calls `getDocumentPdf` with a document owned by the given `customerErpCode`
- **THEN** the method resolves to PDF bytes and metadata
- **AND** cross-customer access is rejected with `ERP_VALIDATION`

#### Scenario: Delivery notes available by customer

- **WHEN** a consumer calls `listDeliveryNotesByCustomer` in stub mode
- **THEN** delivery note items are returned with status `issued` or `preparing`

## ADDED Requirements

### Requirement: Document type enumeration

The package SHALL export `ErpDocumentType` with values at minimum `invoice`, `delivery_note`, `form_347`, and `erp_quote` for use by `getDocumentPdf` and storage paths.

#### Scenario: Invoice type used in PDF fetch

- **WHEN** `getDocumentPdf` is called with `type: 'invoice'`
- **THEN** adapters route to invoice PDF resolution logic

### Requirement: Extended invoice list item shape

`ErpInvoiceListItem` SHALL include portal fields `invoiceNumber`, `netAmount`, `grossAmount`, and `status` in addition to existing notification fields `id`, `issuedAt`, `totalAmount`, `currency`, and `customerErpCode`. `totalAmount` MAY mirror `grossAmount` for backward compatibility with invoice sync (#28).

#### Scenario: Invoice sync consumer still reads totalAmount

- **WHEN** invoice notification sync (#28) reads stub invoices by customer
- **THEN** `totalAmount` remains populated for diff detection
