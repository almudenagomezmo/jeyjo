# b2b-proactive-notification-emails

## Purpose

Transactional B2B proactive emails via Payload/Resend (RI-009, RF-022, changes #28 and #35).

## Requirements

### Requirement: New invoice email CA-B2B-006

When an `invoice_new` notification is dispatched and the profile channel allows email, the system SHALL send a transactional email with subject `Nueva factura disponible en tu portal Jeyjo` and body including the invoice amount in EUR.

#### Scenario: Invoice email sent to active preference

- **WHEN** a new invoice sync detects invoice total 1250.00 EUR for empresa@test.com
- **AND** the admin profile has `invoice_channel` `email`
- **THEN** an email is sent to the profile email within the sync job SLA window
- **AND** the subject is exactly `Nueva factura disponible en tu portal Jeyjo`

#### Scenario: Email failure retains in-app notification

- **WHEN** invoice notification is created and SMTP fails
- **THEN** the notification row remains
- **AND** `email_sent_at` stays null
- **AND** the error is logged for retry

### Requirement: Order status change email

When `order_status` is dispatched with email channel, the email SHALL include `orderNumber`, Spanish status label, and link to `/intranet/pedidos`.

#### Scenario: Shipped order triggers email

- **WHEN** staff sets order WEB-2026-0100 to `shipped` for a B2B customer with email channel on
- **THEN** the customer receives an email mentioning WEB-2026-0100 and estado Enviado

### Requirement: Quote expiry email RF-022c

When `quote_expiring` is dispatched, the email SHALL state the quote number and that it expires in seven days, with link to intranet presupuestos list.

#### Scenario: Quote seven days before validUntil

- **WHEN** quote P-2026-00042 has `validUntil` in seven days and status `sent`
- **THEN** an expiring notification and optional email are created once per idempotency key

### Requirement: Quote status change email

When staff transitions a B2B quote to `sent`, `accepted`, or `cancelled`, and `quote_status` is dispatched with email enabled, the customer SHALL receive an email with quote number and new status label.

#### Scenario: Quote sent to customer

- **WHEN** staff moves quote P-2026-00010 from `in_review` to `sent` for B2B customerRef
- **THEN** a quote status email is sent if channel is not `off` or portal-only

### Requirement: Stock available email RF-022 wishlist

When `stock_available` is dispatched and the profile `wishlist_channel` allows email, the system SHALL send a transactional email with subject `Ya hay stock de {sku} en Jeyjo` and body including the product title, public stock label, and link to the PDP.

#### Scenario: Stock email sent to active preference

- **WHEN** SKU REF-001 becomes available for a profile with `wishlist_channel` `email`
- **THEN** an email is sent to the profile email
- **AND** the subject is `Ya hay stock de REF-001 en Jeyjo`

#### Scenario: Portal-only wishlist skips stock email

- **WHEN** `wishlist_channel` is `portal` and `stock_available` is dispatched
- **THEN** no stock alert email is sent
- **AND** an in-app notification may still be created

### Requirement: Transactional transport RI-009

Proactive B2B emails SHALL use the same Payload email transport as quote confirmation: Mailpit in development, Resend SMTP in production when `RESEND_API_KEY` is configured. Failed sends SHALL be retried up to three times within twenty-four hours before marking permanent failure on the profile.

#### Scenario: Development captures in Mailpit

- **WHEN** `NODE_ENV` is development and Resend is not configured
- **THEN** proactive emails appear in Mailpit

#### Scenario: Hard bounce disables profile email

- **WHEN** Resend reports a permanent bounce for a profile email
- **THEN** `email_disabled_at` is set on that profile preferences
