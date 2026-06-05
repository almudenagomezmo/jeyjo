## ADDED Requirements

### Requirement: Newsletter subscribers persist in Supabase

The system SHALL store newsletter subscriptions in Supabase table `newsletter_subscribers` with fields: normalized `email` (unique), `status` (`pending` | `confirmed` | `unsubscribed`), `confirm_token`, `unsubscribe_token`, `consent_at`, `confirmed_at`, `unsubscribed_at`, `source` (`footer` | `account`), optional `web_profile_id` FK, optional `esp_contact_id`, `esp_synced_at`, and `created_at` / `updated_at`.

#### Scenario: New subscription creates pending row

- **WHEN** a visitor submits a valid email with marketing consent via the subscribe API
- **THEN** a row exists with `status` `pending`
- **AND** `confirm_token` and `unsubscribe_token` are non-empty
- **AND** `consent_at` is set to the submission time

#### Scenario: Duplicate email while pending refreshes token

- **WHEN** the same normalized email submits again while `status` is `pending`
- **THEN** at most one row exists for that email
- **AND** a new confirmation email MAY be sent without creating a duplicate row

#### Scenario: Confirmed email cannot duplicate

- **WHEN** an email with `status` `confirmed` submits again
- **THEN** the API returns success without creating a second row
- **AND** no duplicate confirmation email is required

### Requirement: Subscriber state machine

The newsletter subscriber lifecycle SHALL follow: `pending` → `confirmed` on valid confirm token; `confirmed` → `unsubscribed` on valid unsubscribe token; `unsubscribed` → `pending` on re-subscribe with fresh consent.

#### Scenario: Confirm transitions to confirmed

- **WHEN** a user opens `/newsletter/confirm?token=` with a valid unexpired token for a `pending` row
- **THEN** `status` becomes `confirmed`
- **AND** `confirmed_at` is set

#### Scenario: Unsubscribe transitions to unsubscribed

- **WHEN** a user opens `/newsletter/unsubscribe?token=` with a valid token for a `confirmed` row
- **THEN** `status` becomes `unsubscribed`
- **AND** `unsubscribed_at` is set

#### Scenario: Re-subscribe after unsubscribe

- **WHEN** a previously `unsubscribed` email submits with consent again
- **THEN** the row returns to `pending` with new tokens
- **AND** a confirmation email is sent

### Requirement: RLS restricts subscriber data

Public and authenticated storefront users SHALL NOT read arbitrary subscriber rows via Supabase client. Staff operations and subscribe/confirm/unsubscribe flows SHALL use server-side service role or dedicated API routes only.

#### Scenario: Anonymous client cannot list subscribers

- **WHEN** an unauthenticated Supabase client queries `newsletter_subscribers`
- **THEN** zero rows are returned
