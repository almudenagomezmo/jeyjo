# Abandoned cart recovery emails

## Purpose

Transactional emails and cron job for abandoned cart recovery (US-23, RI-009, RF-027, change #31).

## Requirements

### Requirement: First recovery email at configured delay US-23 CA1

The cron job SHALL send a first abandoned cart email to registered B2C customers when `now - last_activity_at >= firstEmailDelayMinutes`, snapshot `status` is `active`, lines are non-empty, and `first_email_sent_at` is null.

#### Scenario: First email subject and link

- **WHEN** the first email is sent
- **THEN** the subject is "Tienes artículos esperándote en Jeyjo"
- **AND** the body contains a signed link to restore the cart
- **AND** `first_email_sent_at` is set on the snapshot

### Requirement: Second recovery email includes discount US-23 CA2

When `now - last_activity_at >= secondEmailDelayMinutes`, the first email was already sent, `second_email_sent_at` is null, and the cart is still not converted, the system SHALL send a second email including a discount coupon code (auto-generated single-use or configured fixed coupon).

#### Scenario: Second email includes coupon code

- **WHEN** the second email is dispatched
- **THEN** the email body contains a coupon code and discount percent from `secondEmailDiscountPercent` or linked coupon
- **AND** `second_email_sent_at` is set

#### Scenario: Auto-generated recovery coupon is single use

- **WHEN** no fixed recovery coupon is configured
- **THEN** the system creates a Payload coupon with `source` recovery, `maxUses` 1, and 7-day validity

### Requirement: Second email cancelled when order completes US-23 CA3

If the snapshot becomes `converted` before the second email is sent, the cron MUST NOT send the second email.

#### Scenario: Conversion before 24h skips second email

- **WHEN** the customer completes checkout 20 hours after abandonment
- **THEN** `second_email_sent_at` remains null
- **AND** no second email is sent

### Requirement: Recovery emails use transactional transport RI-009

Abandoned cart emails SHALL be sent via the existing Resend/Mailpit transport with retry logging consistent with RI-009.

#### Scenario: Dev uses Mailpit

- **WHEN** `NODE_ENV` is development
- **THEN** recovery emails are captured by Mailpit

#### Scenario: Send failure logged

- **WHEN** email delivery fails after retries
- **THEN** the error is logged
- **AND** the corresponding `*_email_sent_at` field is not set
