# Backoffice OMS inbox

## Purpose

Operational order inbox in Payload CMS for Jeyjo staff (RF-025, US-17): list, filter, transition statuses, and stock warnings for web orders.

## Requirements

### Requirement: OMS inbox displays web orders with US-17 columns

The Payload admin SHALL expose a dedicated OMS inbox view listing web orders with columns: order number, created date, customer label (guest email or resolved commercial name), total amount, `jeyjoStatus`, and `origin` (b2c, b2b, eva).

#### Scenario: Staff opens OMS inbox

- **WHEN** a user with `administracion` or `superadmin` opens the OMS inbox view
- **THEN** orders are listed with all US-17 columns populated from Payload order documents

#### Scenario: Guest B2C order shows email as customer label

- **WHEN** an order has `guestEmail` and no resolvable `customerRef`
- **THEN** the customer column displays the guest email

### Requirement: OMS inbox supports operational filters

The OMS inbox SHALL provide filters for date range, `jeyjoStatus`, `origin`, and customer search (order number, email, or customer ref).

#### Scenario: Filter by B2B origin

- **WHEN** staff sets origin filter to `b2b`
- **THEN** only orders with `origin` b2b are shown

#### Scenario: Filter by status confirmed

- **WHEN** staff sets status filter to `confirmed`
- **THEN** only orders with `jeyjoStatus` confirmed are shown

### Requirement: Staff may transition order status from OMS inbox

Staff with orders write access SHALL change `jeyjoStatus` along allowed transitions: `pending_payment` or `pending_confirmation` to `confirmed` or `cancelled`; `confirmed` to `preparing` or `cancelled`; `preparing` to `shipped` or `cancelled`; `shipped` to `delivered`.

#### Scenario: Confirm B2B pending order

- **WHEN** staff sets a `pending_confirmation` order to `confirmed`
- **THEN** the order persists `jeyjoStatus` confirmed
- **AND** an audit log entry records the status change

#### Scenario: Invalid transition rejected

- **WHEN** staff attempts to set `shipped` directly from `pending_payment`
- **THEN** the operation is rejected with a clear error

### Requirement: Manual confirmation of bank transfer B2C orders

Staff SHALL move B2C orders with `gateway` transfer and `paymentStatus` pending from `pending_payment` to `confirmed` after verifying payment offline.

#### Scenario: Transfer order confirmed by staff

- **WHEN** staff confirms a transfer order in `pending_payment`
- **THEN** `jeyjoStatus` becomes `confirmed`
- **AND** `paymentStatus` remains `pending` until a later change explicitly marks settlement if applicable

### Requirement: Stock validation warning visible in inbox

When `stockValidationPending` is true on an order, the OMS inbox SHALL display a visible warning indicator on that row.

#### Scenario: Order with insufficient stock flagged

- **WHEN** stock recheck marks `stockValidationPending` true
- **THEN** the order row shows a stock warning badge in the inbox
