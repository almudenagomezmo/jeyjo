# erp-invoice-notification-sync

## ADDED Requirements

### Requirement: Stub documents reader lists invoices by customer

The `ErpDocumentsReader` stub SHALL implement `listInvoicesByCustomer(erpCustomerCode, options?)` returning invoice items with at least `id`, `issuedAt`, `totalAmount`, and `currency`, without throwing `ERP_NOT_IMPLEMENTED` for that method.

#### Scenario: Stub returns invoices for test company

- **WHEN** `listInvoicesByCustomer` is called with erp code for empresa@test.com
- **THEN** at least one invoice item is returned for staging demos

#### Scenario: CA-B2B-006 new invoice fixture

- **WHEN** the sync job runs after seeding a new invoice id not in `erp_invoice_sync_state`
- **THEN** the diff includes that invoice for empresa@test.com

### Requirement: Invoice sync state watermark per customer

Supabase table `erp_invoice_sync_state` SHALL store per `customer_id` the set of known ERP invoice ids and `last_synced_at`.

#### Scenario: First sync records all current ids

- **WHEN** a customer has no sync state row
- **THEN** after sync all returned invoice ids are stored
- **AND** notifications are created only for ids not previously stored

#### Scenario: Subsequent sync detects only new ids

- **WHEN** one new invoice id appears in ERP stub results
- **THEN** exactly one `invoice_new` dispatch occurs per affected B2B profile (subject to preferences)

### Requirement: Invoice sync cron runs every five minutes

A secured cron endpoint SHALL run invoice sync for all customers with `erp_customer_code` at an interval not exceeding five minutes in production configuration (CA-B2B-006 SLA).

#### Scenario: Cron requires secret

- **WHEN** `GET /api/cron/invoice-sync` is called without valid `CRON_SECRET`
- **THEN** the response status is 401

#### Scenario: Sync completes within SLA window

- **WHEN** a new invoice is added to the stub between two cron runs five minutes apart
- **THEN** notifications are created before the second run completes
