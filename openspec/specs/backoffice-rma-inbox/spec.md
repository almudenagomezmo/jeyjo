# Backoffice RMA inbox

## Purpose

Operational RMA incident inbox in Payload CMS for Jeyjo staff (RF-021): list, filter, and transition return authorization requests within one minute of customer submission.

## Requirements

### Requirement: RMA inbox displays incidents with operational columns

The Payload admin SHALL expose a dedicated RMA inbox view listing incidents with columns: RMA number, created date, customer label (resolved commercial name from `customerRef` when available), article SKU, delivery note number, reason label, and `status`.

#### Scenario: Staff opens RMA inbox

- **WHEN** a user with `administracion` or `superadmin` opens the RMA inbox view
- **THEN** incidents are listed with all operational columns populated

#### Scenario: New incident visible within one minute CA-B2B-005

- **WHEN** a B2B customer submits an RMA at time T
- **THEN** the incident appears in the RMA inbox before T plus one minute

### Requirement: RMA inbox supports operational filters

The RMA inbox SHALL provide filters for date range, `status`, and search by RMA number, article SKU, delivery note number, or customer label.

#### Scenario: Filter by status requested

- **WHEN** staff sets status filter to `requested`
- **THEN** only incidents with `status` `requested` are shown

#### Scenario: Search by RMA number

- **WHEN** staff searches for RMA-2026-0042
- **THEN** the matching incident row is shown

### Requirement: Staff may transition RMA status from inbox

Staff with rma-incidents write access SHALL change `status` from the inbox along allowed transitions defined in the RMA collection lifecycle, with invalid transitions rejected inline.

#### Scenario: Authorize from inbox

- **WHEN** staff sets an `in_review` incident to `authorized` from the inbox
- **THEN** the row updates to status **Autorizada**
- **AND** the change is persisted in Payload

#### Scenario: Reject from inbox

- **WHEN** staff sets an `in_review` incident to `rejected`
- **THEN** the row updates to status **Rechazada**

### Requirement: Email failure indicator in inbox

When RMA confirmation email fails, the inbox row SHALL show a warning indicator if `emailSentAt` is null after creation.

#### Scenario: Missing emailSentAt shows warning

- **WHEN** an incident was created but confirmation email failed
- **THEN** the inbox row displays a visible email warning indicator
