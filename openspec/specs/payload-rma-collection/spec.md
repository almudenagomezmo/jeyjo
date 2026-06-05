# Payload RMA collection

## Purpose

Payload `rma-incidents` collection for B2B return authorization requests (RF-021, US-13).

## Requirements

### Requirement: RMA incidents collection models web requests

The CMS SHALL expose an `rma-incidents` collection with fields: unique `rmaNumber`, `status`, `customerRef` (Supabase customer uuid), `articleSku`, `deliveryNoteNumber`, `reason` (`wrong_item`, `defective`, `wrong_qty`, `other`), `observations`, optional `emailSentAt`, and automatic `createdAt`.

#### Scenario: Incident created with requested status

- **WHEN** a storefront RMA request succeeds
- **THEN** an rma-incident document exists with `status` `requested`
- **AND** `rmaNumber` is assigned before persist

#### Scenario: Incident linked to B2B customer

- **WHEN** a logged-in B2B customer submits an RMA
- **THEN** `customerRef` stores their Supabase customer uuid

### Requirement: RMA number format

`rmaNumber` SHALL be assigned automatically in format `RMA-{YYYY}-{seq}` with zero-padded sequence per calendar year, unique across all documents.

#### Scenario: Sequential numbering per year

- **WHEN** the last incident of 2026 is `RMA-2026-0041`
- **AND** a new incident is created in 2026
- **THEN** `rmaNumber` is `RMA-2026-0042`

### Requirement: RMA status lifecycle RF-021

RMA `status` SHALL follow: `requested` → `in_review` → `authorized` or `rejected`. Labels in admin UI SHALL display Spanish equivalents (Solicitada, En revisión, Autorizada, Rechazada). `authorized` and `rejected` are terminal in v1.

#### Scenario: Initial status is requested

- **WHEN** a new RMA is created from the storefront
- **THEN** `status` is `requested`

#### Scenario: Authorized is terminal

- **WHEN** an incident reaches `authorized`
- **THEN** further status changes are rejected in v1

### Requirement: RMA incidents are staff-only in admin read

Only authenticated Payload staff users with `superadmin` or `administracion` in `staffRoles` SHALL have read and update access to rma-incidents in admin and inbox views. Storefront creation SHALL use the storefront API key only.

#### Scenario: Staff lists incidents

- **WHEN** an administracion user opens the RMA collection or RMA inbox
- **THEN** incidents are listed with rma number, date, status, customer label, SKU, and delivery note

#### Scenario: Catalog-only staff denied RMA admin

- **WHEN** a catalogo-only staff user requests rma-incidents admin or REST API
- **THEN** access is denied with 403 semantics

### Requirement: Staff status transitions are validated

Staff SHALL change `status` only along allowed transitions: `requested` to `in_review`; `in_review` to `authorized` or `rejected`. Invalid transitions MUST be rejected with a clear error.

#### Scenario: Move to in review

- **WHEN** staff sets a `requested` incident to `in_review`
- **THEN** the document persists `status` `in_review`

#### Scenario: Invalid skip rejected

- **WHEN** staff attempts to set `authorized` directly from `requested`
- **THEN** the operation is rejected

#### Scenario: Status change writes audit log

- **WHEN** staff transitions an incident from `in_review` to `authorized`
- **THEN** an audit log entry records the status change
