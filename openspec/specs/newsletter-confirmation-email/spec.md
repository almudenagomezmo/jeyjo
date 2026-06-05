# newsletter-confirmation-email

## Purpose

Double opt-in confirmation and unsubscribe transactional emails and pages (RI-009, change newsletter-subscription).

## Requirements

### Requirement: Double opt-in confirmation email RI-009

When a subscriber row is created or reset to `pending`, the system SHALL send a transactional confirmation email to that address containing a link to `/newsletter/confirm?token=<confirm_token>`. The email SHALL use the configured Payload/Resend transport (Mailpit in development, Resend SMTP in production).

#### Scenario: Pending subscribe triggers confirmation email

- **WHEN** a new `pending` subscriber is created
- **THEN** a confirmation email is sent to that address
- **AND** the subject is `Confirma tu suscripción a la newsletter de Jeyjo`

#### Scenario: Development captures in Mailpit

- **WHEN** `NODE_ENV` is development and Resend is not configured
- **THEN** the confirmation message appears in Mailpit

#### Scenario: Email failure does not delete subscriber

- **WHEN** the row is persisted but email delivery fails
- **THEN** the subscriber remains `pending`
- **AND** the error is logged for staff follow-up

### Requirement: Confirmation page activates subscription

The storefront route `/newsletter/confirm` SHALL validate the token, reject expired tokens (default 7 days from `created_at` or last re-subscribe), transition the row to `confirmed`, trigger ESP sync, and render a success page within the global layout.

#### Scenario: Valid token confirms subscription

- **WHEN** the user opens `/newsletter/confirm?token=` with a valid token for a `pending` row
- **THEN** `status` becomes `confirmed`
- **AND** a success page explains the subscription is active

#### Scenario: Expired token shows error

- **WHEN** the confirm token is older than seven days
- **THEN** the page explains the link expired
- **AND** offers a link to subscribe again

#### Scenario: Invalid token shows error

- **WHEN** the token does not match any `pending` row
- **THEN** the page shows a generic invalid-link message without revealing whether the email exists

### Requirement: Unsubscribe page and link

Every confirmation and marketing email footer SHALL include an unsubscribe link to `/newsletter/unsubscribe?token=<unsubscribe_token>`. The unsubscribe route SHALL mark the subscriber `unsubscribed`, sync removal to ESP when configured, and show confirmation.

#### Scenario: Valid unsubscribe token

- **WHEN** the user opens `/newsletter/unsubscribe?token=` for a `confirmed` subscriber
- **THEN** `status` becomes `unsubscribed`
- **AND** a confirmation page states they will no longer receive marketing emails

#### Scenario: Repeat unsubscribe is idempotent

- **WHEN** the user opens the same unsubscribe link twice
- **THEN** the page still shows success without error
