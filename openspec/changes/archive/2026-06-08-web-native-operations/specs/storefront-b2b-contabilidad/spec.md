## MODIFIED Requirements

### Requirement: Intranet document list APIs

When `webNativeMode` is true, the storefront SHALL serve document list and PDF download APIs from Payload `customerDocuments` and Supabase Storage `private-documents`, not from `ErpDocumentsReader`. When `webNativeMode` is false, existing ERP reader behavior MAY remain. Routes remain:

| Route | Purpose |
|-------|---------|
| `GET /api/intranet/documents/invoices` | Paginated invoice list with filters |
| `GET /api/intranet/documents/invoices/{id}/pdf` | PDF download for invoice |
| `GET /api/intranet/documents/delivery-notes` | Albaranes list |
| `GET /api/intranet/documents/delivery-notes/{id}/pdf` | PDF download |
| `GET /api/intranet/documents/due-payments` | Vencimientos list + computed total |
| `GET /api/intranet/documents/form-347?year=` | Cifra 347 summary |
| `GET /api/intranet/documents/form-347/{year}/pdf` | PDF download |
| `GET /api/intranet/documents/erp-quotes` | ERP presupuestos list |
| `GET /api/intranet/documents/erp-quotes/{id}/pdf` | PDF download |

All routes SHALL require B2B validated session and `finance` permission.

#### Scenario: Invoice list from CMS documents

- **WHEN** `webNativeMode` is true and staff uploaded invoice F-2026-0001 for customer C1
- **THEN** `GET /api/intranet/documents/invoices` for C1 includes F-2026-0001 with correct amounts

#### Scenario: Due payments API returns total from CMS data

- **WHEN** `GET /api/intranet/documents/due-payments` succeeds for a customer with two due_payment documents
- **THEN** the JSON includes `items` and `totalOutstandingAmount` equal to the sum of `outstandingAmount`

#### Scenario: PDF download under five seconds CA-B2B-001

- **WHEN** an authorized user downloads an uploaded invoice PDF in staging
- **THEN** the first byte arrives within five seconds under normal load

### Requirement: Cross-customer access blocked on APIs

Document APIs SHALL bind list and download operations to the authenticated customer's Supabase `customer_id`. Path or query manipulation SHALL NOT access another tenant's documents (**CA-B2B-002**). Binding SHALL NOT rely solely on `erp_customer_code` when `webNativeMode` is true.

#### Scenario: Invoice id from another company returns 404 or 403

- **WHEN** customer C1 requests PDF for a document id belonging to customer C2
- **THEN** the response status is 404 or 403
- **AND** no PDF bytes are returned
