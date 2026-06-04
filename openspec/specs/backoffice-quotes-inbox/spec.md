# Backoffice quotes inbox

## Purpose

Payload admin bandeja for web presupuestos (RF-015): filters, staff status transitions, convert-to-order, and email failure visibility.

## Requirements

### Requirement: Quotes inbox displays presupuestos with operational columns

The Payload admin SHALL expose a dedicated quotes inbox view listing quotes with columns: quote number, created date, customer label (guest email or resolved commercial name), total amount, `status`, and segment (b2c or b2b).

#### Scenario: Staff opens quotes inbox

- **WHEN** a user with `administracion` or `superadmin` opens `/admin/quotes`
- **THEN** quotes are listed with all operational columns populated

#### Scenario: Guest quote shows email as customer label

- **WHEN** a quote has `guestEmail` and no resolvable `customerRef`
- **THEN** the customer column displays the guest email

### Requirement: Quotes inbox supports operational filters

The quotes inbox SHALL provide filters for date range, `status`, segment, and search by quote number or customer email.

#### Scenario: Filter by status requested

- **WHEN** staff sets status filter to `requested`
- **THEN** only quotes with `status` `requested` are shown

#### Scenario: Filter by segment b2b

- **WHEN** staff sets segment filter to `b2b`
- **THEN** only b2b segment quotes are shown

### Requirement: Staff may transition quote status from inbox RF-015

Staff with quotes write access SHALL change quote `status` along allowed transitions: `requested` to `in_review` or `cancelled`; `in_review` to `sent` or `cancelled`; `sent` to `accepted` or `cancelled`; `accepted` to `ordered` or `cancelled`.

#### Scenario: Move requested to in review

- **WHEN** staff sets a `requested` quote to `in_review`
- **THEN** the quote persists `status` `in_review`
- **AND** an audit log entry records the status change

#### Scenario: Invalid transition rejected

- **WHEN** staff attempts to set `sent` directly from `requested`
- **THEN** the operation is rejected with a clear error

### Requirement: Staff converts accepted quote to order

Staff SHALL convert a quote in `accepted` status to a Payload order, setting quote `status` to `ordered` and linking `convertedOrderRef`. The created order SHALL use B2C `pending_payment` or B2B `pending_confirmation` per quote segment and copy line and delivery snapshots from the quote.

#### Scenario: B2C accepted quote becomes pending payment order

- **WHEN** staff converts an accepted b2c quote
- **THEN** a new order exists with `jeyjoStatus` `pending_payment`
- **AND** quote `status` is `ordered`

#### Scenario: B2B accepted quote becomes pending confirmation order

- **WHEN** staff converts an accepted b2b quote
- **THEN** a new order exists with `jeyjoStatus` `pending_confirmation`
- **AND** quote `status` is `ordered`

#### Scenario: Convert rejected from non-accepted status

- **WHEN** staff attempts conversion from `sent`
- **THEN** the operation is rejected

### Requirement: Email send failure visible in inbox

When quote request confirmation email fails, the inbox row SHALL show a warning indicator if `emailSentAt` is null after creation.

#### Scenario: Failed email shows warning

- **WHEN** a quote was created but confirmation email failed
- **THEN** the inbox displays a warning badge on that row
