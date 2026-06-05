# storefront-b2b-notification-preferences

## Purpose

B2B notification channel preferences in mi cuenta (US-21 CA3, changes #28 and #35).

## Requirements

### Requirement: Mi cuenta exposes notification preferences US-21 CA3

The page `/intranet/mi-cuenta` SHALL replace its scaffold with a form allowing the user to set channel per category: Facturas, Pedidos, Presupuestos, and Avisos de stock, each with options Email y portal, Solo portal, or Desactivado.

#### Scenario: User selects portal only for invoices

- **WHEN** the user saves Facturas as Solo portal
- **THEN** `invoice_channel` is persisted as `portal`
- **AND** a success message is shown

#### Scenario: Disabled category blocks dispatch

- **WHEN** the user sets Pedidos to Desactivado
- **THEN** `order_channel` is `off`
- **AND** future order status events do not create rows for that profile

#### Scenario: Wishlist channel saved

- **WHEN** the user saves Avisos de stock as Solo portal
- **THEN** `wishlist_channel` is persisted as `portal`
- **AND** future `stock_available` events create portal notifications without email

### Requirement: Preferences API for intranet

The storefront SHALL expose `GET` and `PATCH /api/intranet/notification-preferences` for the session web profile, returning and updating the four channel fields including `wishlist_channel`.

#### Scenario: GET returns effective preferences

- **WHEN** a validated B2B user requests preferences
- **THEN** the response includes `invoice_channel`, `order_channel`, `quote_channel`, and `wishlist_channel`

### Requirement: Bounce warning displayed

When `email_disabled_at` is set, the mi cuenta page SHALL show a non-blocking warning that email delivery is disabled for this account and only portal notifications will be attempted.

#### Scenario: Bounced user sees warning

- **WHEN** `email_disabled_at` is not null
- **THEN** the preferences page explains email is disabled due to delivery failure
