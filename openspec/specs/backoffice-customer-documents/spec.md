# Backoffice customer documents

## Purpose

Staff-managed B2B financial documents (invoices, delivery notes, due payments, form 347, ERP quotes) with PDF storage in web-native mode.

## Requirements

### Requirement: Customer documents collection exists in Payload

The CMS SHALL expose a `customerDocuments` collection (admin group **Clientes B2B** or **Contabilidad**) for staff to manage B2B financial documents with fields: `customerId` (Supabase UUID, required), `documentType` (enum: `invoice`, `delivery_note`, `due_payment`, `form_347`, `erp_quote`), `documentNumber`, `issuedAt`, optional `netAmount`, `grossAmount`, optional `dueDate`, optional `outstandingAmount`, `status` (type-specific), and `pdf` file upload.

#### Scenario: Administracion creates invoice document

- **WHEN** staff with role `administracion` creates a document with type `invoice`, customer UUID, number F-2026-0001, amounts, and PDF file
- **THEN** the document is saved and listed in admin
- **AND** the PDF is stored under `private-documents/{customerId}/` in Supabase Storage

#### Scenario: Catalog role cannot create documents

- **WHEN** a user with only role `catalogo` attempts to create a customer document
- **THEN** access is denied per RF-030

### Requirement: Invoice documents trigger invoice_new notification

When staff publishes a new `customerDocuments` row with `documentType=invoice` for a customer, the CMS SHALL enqueue or emit the existing `invoice_new` proactive notification flow for that customer (**RF-022**, #28).

#### Scenario: New invoice notifies B2B users

- **WHEN** staff saves a new invoice document for customer C1 with finance-enabled profiles
- **THEN** eligible B2B users receive an `invoice_new` notification referencing the document

#### Scenario: Duplicate invoice number per customer rejected

- **WHEN** staff attempts to save a second invoice with the same `documentNumber` for the same `customerId`
- **THEN** validation fails

### Requirement: Due payment documents support outstanding metadata

Documents with `documentType=due_payment` SHALL require `outstandingAmount` and `dueDate`. Status SHALL be computed or stored to support overdue styling in intranet (**RF-017**).

#### Scenario: Overdue due payment flagged

- **WHEN** staff saves a due payment with `dueDate` in the past and positive `outstandingAmount`
- **THEN** intranet vencimientos list marks the row as vencida

### Requirement: Staff can update and replace PDF

Staff with document write access SHALL update document metadata and replace the PDF file; prior PDF object MAY be overwritten in Storage.

#### Scenario: PDF replacement

- **WHEN** staff uploads a new PDF on an existing invoice document
- **THEN** subsequent intranet download serves the new PDF bytes
