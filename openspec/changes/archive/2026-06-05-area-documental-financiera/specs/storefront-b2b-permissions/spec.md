## ADDED Requirements

### Requirement: Document intranet APIs require finance section

All routes under `/api/intranet/documents/*` SHALL call `requireB2bApiSession({ section: 'finance' })` before resolving ERP data or storage (**RF-003**, change #37).

#### Scenario: Finance API blocked for orders-only subuser

- **WHEN** a subuser with `finance: false` and `orders: true` calls `GET /api/intranet/documents/invoices`
- **THEN** the response status is 403

#### Scenario: Finance superadmin succeeds

- **WHEN** a B2B superadmin calls `GET /api/intranet/documents/invoices`
- **THEN** the response status is 200 with invoice items
