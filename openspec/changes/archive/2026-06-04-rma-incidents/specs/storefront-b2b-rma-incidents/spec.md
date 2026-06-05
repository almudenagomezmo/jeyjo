# Storefront B2B RMA incidents

## Purpose

B2B intranet RMA request form, incident list, and APIs at `/intranet/rma` (RF-021, US-13, change #27).

## ADDED Requirements

### Requirement: RMA page replaces intranet scaffold

The storefront SHALL render a production RMA and incidents view at `/intranet/rma` titled **RMA e incidencias**, replacing the portal scaffold empty state for validated B2B customers.

#### Scenario: Validated B2B user sees form and list

- **WHEN** a validated B2B user opens `/intranet/rma`
- **THEN** a normative authorization notice, a request form, and an incidents list are shown
- **AND** the "Próximamente" scaffold badge is not displayed

#### Scenario: Unauthenticated user cannot access RMA API

- **WHEN** a request hits `/api/intranet/rma-incidents` without a validated B2B session
- **THEN** the response status is 401 or 403

### Requirement: RMA request form fields US-13 CA1

The RMA section SHALL provide a form with fields: article reference (`articleSku`), delivery note number (`deliveryNoteNumber`), return reason from a closed list (`wrong_item`, `defective`, `wrong_qty`, `other`), and free-text observations.

#### Scenario: Form shows required fields

- **WHEN** a validated B2B user opens the RMA form
- **THEN** inputs for article reference, delivery note number, reason select, and observations textarea are visible
- **AND** reason options include Artículo incorrecto, Artículo defectuoso, Cantidad incorrecta, and Otro

#### Scenario: Other reason requires observations

- **WHEN** the user selects reason `other` and observations are empty or shorter than 10 characters
- **THEN** submit is rejected with a validation error
- **AND** no incident is created

#### Scenario: Successful submit creates incident

- **WHEN** the user submits articleSku REF-011, deliveryNoteNumber ALB-2026-001, reason `wrong_item`, and observations "Pedí azul, me enviaron rojo"
- **THEN** a new RMA incident is persisted with status `requested`
- **AND** the response includes a unique `rmaNumber`

### Requirement: Prior authorization notice US-13 CA4

The RMA page SHALL display a prominent notice that no return is accepted without prior authorization from Jeyjo.

#### Scenario: Authorization notice visible

- **WHEN** a validated B2B user loads `/intranet/rma`
- **THEN** copy stating that no return is accepted without prior Jeyjo authorization is visible above or beside the form

### Requirement: Customer incident list open and closed US-13 CA3

The portal SHALL list the authenticated company's RMA incidents with tabs or filters for open (`requested`, `in_review`) and closed (`authorized`, `rejected`) states, showing RMA number, date, article reference, delivery note number, reason label, status badge, and truncated observations.

#### Scenario: Open tab shows in-progress incidents

- **WHEN** the customer has an incident with status `requested`
- **THEN** it appears under the open incidents filter
- **AND** status is labeled **Solicitada**

#### Scenario: Closed tab shows terminal incidents

- **WHEN** staff sets an incident to `authorized`
- **THEN** the customer sees it under closed incidents with label **Autorizada**

#### Scenario: List scoped to company

- **WHEN** customer A requests the incident list
- **THEN** only incidents with `customerRef` matching customer A's session are returned

### Requirement: RMA list API pagination

`GET /api/intranet/rma-incidents` SHALL support `status=open|closed|all`, `page`, and `pageSize` with default page size 25, ordered by `createdAt` descending.

#### Scenario: Pagination returns total count

- **WHEN** the customer has 30 incidents and requests page 1 with pageSize 25
- **THEN** the response includes 25 items and `total` 30

### Requirement: Duplicate same-day request guard

The storefront SHALL reject creating a second incident for the same `articleSku` and `deliveryNoteNumber` for the same `customerRef` within 24 hours with HTTP 409.

#### Scenario: Duplicate submit rejected

- **WHEN** an incident for REF-011 and ALB-2026-001 was created in the last 24 hours for the same customer
- **AND** the user submits the same pair again
- **THEN** the API responds with status 409
- **AND** no second incident is created

### Requirement: Optional product title enrichment

When `articleSku` matches a published CMS product, the list MAY show the product title alongside the SKU; when no product exists, only the SKU is shown.

#### Scenario: Unknown SKU shows reference only

- **WHEN** articleSku does not match a CMS product
- **THEN** the list row shows the SKU without blocking the incident display
