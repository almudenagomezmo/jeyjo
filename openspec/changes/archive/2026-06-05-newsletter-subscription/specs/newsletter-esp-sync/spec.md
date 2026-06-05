## ADDED Requirements

### Requirement: Newsletter ESP port adapter

The CMS SHALL define a `NewsletterEspPort` interface with `upsertContact({ email, attributes })` and `removeContact({ email })`. Production SHALL use a Brevo implementation when `BREVO_API_KEY` and `BREVO_NEWSLETTER_LIST_ID` are set. Development or missing credentials SHALL use a noop adapter that logs operations without external calls.

#### Scenario: Confirmed subscriber syncs to Brevo

- **WHEN** a subscriber transitions to `confirmed` and Brevo is configured
- **THEN** `upsertContact` is called with normalized email and attributes `SOURCE` and optional `SEGMENT` (`b2b` | `b2c`)
- **AND** `esp_contact_id` and `esp_synced_at` are stored on success

#### Scenario: Unsubscribe removes from Brevo list

- **WHEN** a `confirmed` subscriber becomes `unsubscribed` and Brevo is configured
- **THEN** `removeContact` is called for that email
- **AND** `esp_synced_at` is updated

#### Scenario: Noop adapter in development

- **WHEN** `BREVO_API_KEY` is unset
- **THEN** sync operations log at info level
- **AND** subscriber state transitions still succeed locally

### Requirement: ESP sync failures do not block confirmation

When Brevo sync fails after a successful local state transition, the subscriber row SHALL remain in the new status and the failure SHALL be logged with retry metadata. Staff MAY trigger manual re-sync from CMS.

#### Scenario: Brevo timeout keeps confirmed status

- **WHEN** confirmation succeeds but Brevo API times out
- **THEN** `status` remains `confirmed`
- **AND** `esp_synced_at` is null or stale
- **AND** an error is logged

#### Scenario: Staff manual resync

- **WHEN** staff triggers resync for a `confirmed` row from CMS admin
- **THEN** `upsertContact` runs again
- **AND** `esp_synced_at` updates on success
