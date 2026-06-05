## ADDED Requirements

### Requirement: Newsletter settings global in Marketing group

The CMS SHALL expose a Payload global `newsletter-settings` under the existing Marketing admin group with fields: `enabled` (default true), `headline`, `description`, `privacyPolicyUrl`, `brevoListId` (override env default), and `confirmationEmailEnabled`.

#### Scenario: Staff updates footer copy

- **WHEN** marketing staff updates `headline` and `description` in newsletter settings
- **THEN** the storefront footer newsletter block reflects the new copy on next fetch

#### Scenario: Disabled global blocks new signups

- **WHEN** `enabled` is false
- **THEN** `POST /api/newsletter/subscribe` returns 503 with a maintenance message
- **AND** the footer form is hidden or shows disabled state

### Requirement: Staff subscriber list and export

The CMS SHALL provide a staff-only view listing `newsletter_subscribers` with filters by `status` and date range, columns email, status, source, confirmed_at, esp_synced_at, and actions: resend confirmation (pending only), manual ESP resync (confirmed), and CSV export of filtered rows.

#### Scenario: Staff filters confirmed subscribers

- **WHEN** staff filters status `confirmed`
- **THEN** only confirmed rows appear in the list

#### Scenario: CSV export

- **WHEN** staff clicks export on the filtered list
- **THEN** a CSV downloads with email, status, source, confirmed_at, and web_profile_id

#### Scenario: Resend confirmation for pending

- **WHEN** staff resends confirmation for a `pending` row
- **THEN** a new confirmation email is sent
- **AND** `confirm_token` MAY be rotated

### Requirement: Staff access only

Newsletter admin views and resync actions SHALL require the same staff roles allowed for Marketing settings (marketing staff update access).

#### Scenario: Non-staff denied

- **WHEN** a non-staff user attempts to access the subscriber admin view
- **THEN** access is denied
