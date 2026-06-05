# ERP integration ports

## Purpose

Shared `@jeyjo/erp-ports` package interfaces for catalog read/write and ERP document read operations, with typed integration errors independent of Payload or Avansuite.

## Requirements

### Requirement: ERP catalog read port exists

The system SHALL expose an `ErpCatalogReader` interface in the shared `@jeyjo/erp-ports` package with methods to list and fetch normalized catalog entities without referencing Payload or Avansuite types.

#### Scenario: Reader returns product by SKU

- **WHEN** a consumer calls `getProductBySku` with a SKU that exists in the active adapter
- **THEN** the method resolves to an `ErpProductDto` or `null` if not found

#### Scenario: Reader lists suppliers

- **WHEN** a consumer calls `listSuppliers` with pagination options
- **THEN** the method returns a page of `ErpSupplierDto` records and a continuation cursor or equivalent pagination metadata

### Requirement: ERP catalog write port exists

The system SHALL expose an `ErpCatalogWriter` interface for idempotent upsert operations keyed by `skuErp` (products) and `erpCode` (suppliers).

#### Scenario: Writer upserts product

- **WHEN** a consumer calls `upsertProduct` with a valid `ErpProductDto`
- **THEN** the active adapter acknowledges success with a stable external reference or confirmation payload defined by the port contract

#### Scenario: Writer rejects invalid product

- **WHEN** a consumer calls `upsertProduct` without `skuErp`
- **THEN** the adapter rejects the operation with an `ErpIntegrationError` coded `ERP_VALIDATION`

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

### Requirement: Integration errors are typed

All ERP adapters SHALL throw or return failures using `ErpIntegrationError` with machine-readable `code` values including at minimum `ERP_UNAVAILABLE`, `ERP_TIMEOUT`, `ERP_VALIDATION`, and `ERP_NOT_IMPLEMENTED`.

#### Scenario: Simulated ERP outage in tests

- **WHEN** the stub adapter is configured to simulate unavailability
- **THEN** read operations reject with `ERP_UNAVAILABLE` and do not mutate internal stub state inconsistently
