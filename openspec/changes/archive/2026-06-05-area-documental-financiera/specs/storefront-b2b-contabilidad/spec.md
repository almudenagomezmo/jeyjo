## ADDED Requirements

### Requirement: Contabilidad pages replace scaffolds

The storefront SHALL render operational pages at `/intranet/contabilidad/facturas`, `/albaranes`, `/vencimientos`, `/cifra-347`, and `/presupuestos` with data tables, filters where specified, PDF download actions, and Spanish copy aligned to **US-07** Contabilidad menu. Scaffold placeholders referencing roadmap #37 SHALL be removed.

#### Scenario: Facturas page lists downloadable rows

- **WHEN** `empresa@test.com` with finance permission opens `/intranet/contabilidad/facturas`
- **THEN** the page shows invoice rows with number, date, net, gross, and download control
- **AND** no "fase documental" banner is shown

#### Scenario: Vencimientos shows overdue styling

- **WHEN** stub data includes an overdue invoice for the logged-in company
- **THEN** that row is visually highlighted as vencida
- **AND** a footer or summary shows total saldo pendiente (**CA-B2B-003**)

### Requirement: Invoice filters US-08 CA2

The facturas view SHALL support filtering by year, month, invoice number substring, and gross amount range. Filters SHALL apply server-side via query parameters on the list API.

#### Scenario: Year filter reduces rows

- **WHEN** the user selects fiscal year 2026 on facturas
- **THEN** only invoices with `issuedAt` in 2026 are returned

#### Scenario: Invoice number search

- **WHEN** the user searches partial number `0001`
- **THEN** matching invoice numbers containing `0001` are returned

### Requirement: Intranet document list APIs

The storefront SHALL expose authenticated B2B APIs:

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

#### Scenario: Due payments API returns total

- **WHEN** `GET /api/intranet/documents/due-payments` succeeds for empresa@test.com
- **THEN** the JSON includes `items` and `totalOutstandingAmount`
- **AND** `totalOutstandingAmount` equals the sum of item outstanding amounts

#### Scenario: PDF download under five seconds CA-B2B-001

- **WHEN** an authorized user downloads a stub invoice PDF in staging
- **THEN** the first byte arrives within five seconds under normal load

### Requirement: Cross-customer access blocked on APIs

Document APIs SHALL bind list and download operations to the authenticated customer's `erp_customer_code` and Supabase `customer_id`. Path or query manipulation SHALL NOT access another tenant's documents (**CA-B2B-002**).

#### Scenario: Invoice id from another company returns 404 or 403

- **WHEN** `empresa-a@test.com` requests PDF for an invoice id belonging to `B2B-EMPRESA2`
- **THEN** the response status is 404 or 403
- **AND** no PDF bytes are returned

### Requirement: Albaranes status labels in Spanish

The albaranes table SHALL display human-readable labels for ERP status: `issued` → "Emitido", `preparing` → "En preparación".

#### Scenario: Status column visible

- **WHEN** the albaranes page loads with stub data
- **THEN** each row shows one of the Spanish status labels

### Requirement: Form 347 year selector

The cifra 347 page SHALL allow selecting fiscal year (default: previous calendar year) and display total operations amount with download PDF action.

#### Scenario: Year change refetches summary

- **WHEN** the user selects fiscal year 2024 on cifra 347
- **THEN** the summary amount updates from `GET /api/intranet/documents/form-347?year=2024`

### Requirement: ERP presupuestos vigente caducado badges

The presupuestos page SHALL show badge **Vigente** or **Caducado** from ERP quote `status` and allow PDF download per row.

#### Scenario: Expired quote labeled

- **WHEN** stub includes an ERP quote with `status` `expired`
- **THEN** the row shows badge **Caducado**
