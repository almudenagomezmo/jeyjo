# quote-request-confirmation-email

## REMOVED Requirements

### Requirement: Status change email hook deferred

**Reason**: Implemented in change `notifications-center-email` (#28) as part of RF-022 proactive notifications.

**Migration**: Quote status transitions now dispatch via `payload-quote-collection` and `b2b-proactive-notification-emails`; initial request confirmation behavior unchanged.

## ADDED Requirements

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
