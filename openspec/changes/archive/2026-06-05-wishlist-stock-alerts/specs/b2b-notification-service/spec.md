## ADDED Requirements

### Requirement: Wishlist channel preference per profile

The system SHALL store `wishlist_channel` in `notification_preferences` per `web_profile_id` with values `email`, `portal`, or `off`, defaulting to `email`.

#### Scenario: Default wishlist channel on first login

- **WHEN** a B2B profile has no preferences row
- **THEN** the effective `wishlist_channel` is `email`

#### Scenario: Portal-only wishlist skips email

- **WHEN** `wishlist_channel` is `portal` and a `stock_available` notification is dispatched
- **THEN** an in-app notification row is created
- **AND** no email is sent for that profile

### Requirement: Profile-scoped notification dispatch

The system SHALL expose `dispatchProfileNotification` for events tied to a single `web_profile_id` (such as `stock_available`), distinct from company-wide `dispatchNotification` by `customer_id`.

#### Scenario: Stock alert targets one profile

- **WHEN** `stock_available` is dispatched for `web_profile_id` P1
- **THEN** only P1 receives the notification
- **AND** other profiles of the same `customer_id` are not notified

### Requirement: Stock available notification type

Supported `type` values SHALL include `stock_available` for wishlist stock alerts (RF-022 extension).

#### Scenario: Stock available type payload

- **WHEN** type is `stock_available`
- **THEN** `payload` includes `sku`, `productTitle`, `stockLabel`, and `href` pointing to the product PDP

## MODIFIED Requirements

### Requirement: Notification types for RF-022 v1

Supported `type` values SHALL include `invoice_new`, `order_status`, `quote_status`, `quote_expiring`, and `stock_available`.

#### Scenario: Invoice type payload

- **WHEN** type is `invoice_new`
- **THEN** `payload` includes `invoiceId`, `amount`, `currency`, and `href` pointing to `/intranet/contabilidad/facturas`

#### Scenario: Stock available type listed

- **WHEN** a notification row has type `stock_available`
- **THEN** it is a valid RF-022 notification type for portal display and email dispatch

### Requirement: Notification preferences per profile

The system SHALL store `notification_preferences` per `web_profile_id` with channels `invoice_channel`, `order_channel`, `quote_channel`, and `wishlist_channel`, each one of `email`, `portal`, or `off`, defaulting to `email`.

#### Scenario: Default preferences on first login

- **WHEN** a B2B profile has no preferences row
- **THEN** the effective channel for all categories including wishlist is `email`

#### Scenario: Portal-only preference skips email

- **WHEN** `invoice_channel` is `portal` and a new invoice notification is dispatched
- **THEN** an in-app notification row is created
- **AND** no email is sent for that profile

#### Scenario: Off preference skips both channels

- **WHEN** `order_channel` is `off` and an order status changes
- **THEN** no notification row and no email are created for that profile
