# RMA request confirmation email

## Purpose

Transactional email when a B2B customer submits an RMA request (US-13 CA2, CA-B2B-005, RI-009).

## ADDED Requirements

### Requirement: RMA request sends confirmation email US-13 CA2

When an RMA incident is successfully created with `status` `requested`, the CMS SHALL send a transactional email to the B2B account email containing the assigned `rmaNumber`, article reference, delivery note number, reason label, and a reminder that no return is accepted without prior authorization.

#### Scenario: Customer receives confirmation with RMA number CA-B2B-005

- **WHEN** customer `empresa@test.com` successfully submits an RMA that becomes `RMA-2026-0042`
- **THEN** an email is sent to the account email
- **AND** the email body includes `RMA-2026-0042`
- **AND** the email includes article reference and delivery note from the request

#### Scenario: Email includes authorization reminder

- **WHEN** confirmation email is sent
- **THEN** the body reminds that no return is accepted without prior Jeyjo authorization

### Requirement: RMA email uses configured transactional transport

RMA confirmation emails SHALL use the same Payload email transport as other transactional mail: Mailpit in development and Resend SMTP in production when configured.

#### Scenario: Development uses Mailpit

- **WHEN** `NODE_ENV` is development and Resend is not configured
- **THEN** the RMA confirmation message is captured by Mailpit

#### Scenario: Production uses Resend when configured

- **WHEN** `RESEND_API_KEY` is set in production
- **THEN** RMA confirmation is sent via Resend SMTP using `RESEND_FROM_EMAIL`

### Requirement: Email failure does not roll back incident

When RMA creation succeeds but email delivery fails, the incident document SHALL remain persisted, `emailSentAt` SHALL not be set, and the error SHALL be logged for staff follow-up.

#### Scenario: Email failure keeps incident

- **WHEN** incident creation succeeds but email delivery fails
- **THEN** the rma-incident document remains persisted
- **AND** `emailSentAt` is null
- **AND** the error is logged

### Requirement: Status change emails deferred

The system SHALL NOT send customer emails on staff status transitions (`in_review`, `authorized`, `rejected`) in this change; those belong to the notifications center roadmap item.

#### Scenario: Authorization does not email customer in v1

- **WHEN** staff sets an incident to `authorized`
- **THEN** no customer email is sent in this change
- **AND** the status transition is still persisted
