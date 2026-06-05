# storefront-newsletter-subscribe

## Purpose

Footer newsletter signup UI and public subscribe API with GDPR consent (alcance §1.12/§1.14, change newsletter-subscription).

## Requirements

### Requirement: Footer exposes newsletter subscription form alcance §1.12

The storefront `Footer` SHALL include a newsletter block with email input, mandatory marketing consent checkbox linked to the privacy policy, submit control, and inline feedback for loading, success, and error states. Copy SHALL be in Spanish and use design tokens from `globals.css`.

#### Scenario: Footer form visible on public pages

- **WHEN** any public page loads
- **THEN** the footer displays the newsletter subscription form above the copyright bar

#### Scenario: Submit without consent is rejected

- **WHEN** the user submits the form without checking consent
- **THEN** inline validation explains consent is required
- **AND** no API call creates a subscriber row

#### Scenario: Successful submit shows pending message

- **WHEN** the user submits a valid email with consent
- **THEN** the form shows a success message instructing the user to confirm via email
- **AND** the email field is cleared or disabled until reset

### Requirement: Public subscribe API

The storefront SHALL expose `POST /api/newsletter/subscribe` accepting `{ email, consent: true, source?: "footer" | "account" }`. The endpoint SHALL validate email format, require explicit consent, normalize email to lowercase, apply rate limiting, and return generic success for unknown emails to avoid enumeration.

#### Scenario: Valid subscribe returns 200

- **WHEN** `POST /api/newsletter/subscribe` receives `{ email: "Cliente@Example.com", consent: true }`
- **THEN** the response status is 200 with a generic success message
- **AND** a `pending` subscriber row exists for `cliente@example.com`

#### Scenario: Invalid email returns 400

- **WHEN** the request body contains a malformed email
- **THEN** the response status is 400 with a validation message

#### Scenario: Rate limit exceeded returns 429

- **WHEN** more than five subscribe attempts from the same IP or email occur within one hour
- **THEN** the response status is 429

### Requirement: Logged-in users link profile without auto-subscribe

When a session exists, the footer form SHALL pre-fill the account email but SHALL NOT subscribe without explicit consent submission. On successful subscribe, the row SHALL store `web_profile_id` of the active profile.

#### Scenario: Authenticated footer pre-fills email

- **WHEN** a logged-in user views the footer
- **THEN** the email field is pre-filled with the profile email
- **AND** consent remains unchecked by default

#### Scenario: Subscribe associates web profile

- **WHEN** an authenticated user completes subscribe with consent
- **THEN** the subscriber row includes their `web_profile_id`
