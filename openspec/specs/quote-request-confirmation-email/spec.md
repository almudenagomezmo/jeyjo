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

### Requirement: Status change email hook deferred

The system MAY expose an internal hook or function to send emails on quote status changes, but v1 SHALL NOT send customer emails on status transitions beyond the initial request confirmation.

#### Scenario: Status change to sent does not email in v1

- **WHEN** staff moves a quote from `in_review` to `sent`
- **THEN** no customer email is sent in this change
- **AND** the transition is still persisted
