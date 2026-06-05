# Quote request confirmation email

## Purpose

Transactional email on presupuesto request (US-05 CA4, RI-009) via Payload email transport.

## Requirements

### Requirement: Quote request sends confirmation email US-05 CA4 RI-009

When a quote is successfully created with `status` `requested`, the CMS SHALL send a transactional email to the guest email or customer account email containing the assigned `quoteNumber` and a brief summary of the request.

#### Scenario: Guest receives confirmation with quote number

- **WHEN** an anonymous user successfully requests a quote with email `cliente@example.com`
- **THEN** an email is sent to `cliente@example.com`
- **AND** the email body includes the assigned quote number

#### Scenario: Registered customer receives confirmation

- **WHEN** a logged-in customer successfully requests a quote
- **THEN** an email is sent to the customer account email
- **AND** the email includes the quote number

#### Scenario: Email failure does not roll back quote

- **WHEN** quote creation succeeds but email delivery fails
- **THEN** the quote document remains persisted
- **AND** `emailSentAt` is not set
- **AND** the error is logged for staff follow-up

### Requirement: Quote email uses configured transactional transport

Quote confirmation emails SHALL use the same Payload email transport as other transactional mail: Mailpit in development and Resend SMTP in production when configured.

#### Scenario: Development uses Mailpit

- **WHEN** `NODE_ENV` is development and Resend is not configured
- **THEN** the quote confirmation message is captured by Mailpit

#### Scenario: Production uses Resend when configured

- **WHEN** `RESEND_API_KEY` is set in production
- **THEN** quote confirmation is sent via Resend SMTP using `RESEND_FROM_EMAIL`

### Requirement: Quote status change sends customer email when enabled

When staff transitions a B2B-linked quote to `sent`, `accepted`, or `cancelled`, the CMS SHALL send a transactional email to the customer contact (profile email or `guestEmail`) if quote notification channel is `email`, using the same transport as quote request confirmation.

#### Scenario: Sent status emails B2B customer

- **WHEN** staff moves quote P-2026-00005 to `sent` for customerRef with email channel
- **THEN** an email is sent including quote number and status Enviado
- **AND** the quote document update is not rolled back on email failure

#### Scenario: Portal-only skips email on status change

- **WHEN** the customer profile has `quote_channel` `portal`
- **THEN** no status change email is sent
- **AND** in-app notification is still created
