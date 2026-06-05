# b2b-notification-service

## Purpose

Supabase-backed B2B notification persistence, preferences, and server-side dispatch (RF-022, changes #28 and #35).

## Requirements

### Requirement: Notifications persist per web profile

The system SHALL store in-app notifications in Supabase table `notifications` linked to `web_profiles.id` and denormalized `customer_id`, with fields `type`, `title`, `body`, `payload` (jsonb), `read_at`, `email_sent_at`, `idempotency_key`, and `created_at`.

#### Scenario: Notification row created for B2B profile

- **WHEN** a dispatch event targets customer uuid `C1` with two B2B web profiles
- **THEN** two notification rows exist, one per profile
- **AND** each row has the same `type` and distinct `idempotency_key` suffix per profile

#### Scenario: Duplicate dispatch is idempotent

- **WHEN** the same `idempotency_key` is submitted twice for the same profile
- **THEN** at most one notification row exists for that key

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

### Requirement: Dispatch respects email disabled flag

When `notification_preferences.email_disabled_at` is set (hard bounce), the system SHALL NOT send email to that profile but MAY still create portal notifications when channel is not `off`.

#### Scenario: Bounced profile receives portal only

- **WHEN** `email_disabled_at` is set and `invoice_channel` is `email`
- **THEN** an in-app notification is created
- **AND** no email is attempted

### Requirement: Notification types for RF-022 v1

Supported `type` values SHALL include `invoice_new`, `order_status`, `quote_status`, `quote_expiring`, and `stock_available`.

#### Scenario: Invoice type payload

- **WHEN** type is `invoice_new`
- **THEN** `payload` includes `invoiceId`, `amount`, `currency`, and `href` pointing to `/intranet/contabilidad/facturas`

#### Scenario: Stock available type listed

- **WHEN** a notification row has type `stock_available`
- **THEN** it is a valid RF-022 notification type for portal display and email dispatch

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

### Requirement: RLS restricts notification access

Authenticated users SHALL read and update only their own notifications and preferences via Supabase RLS. Inserts SHALL use service role or a security definer function invoked from trusted server code only.

#### Scenario: User cannot read another profile notifications

- **WHEN** user A queries notifications for user B profile id
- **THEN** zero rows are returned
