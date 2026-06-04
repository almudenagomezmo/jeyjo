## ADDED Requirements

### Requirement: Customer billing address fields for registration

The `public.customers` table SHALL store billing address fields required at registration: `billing_address_line1`, `billing_city`, `billing_postal_code`, and `billing_country` (ISO country code, default `ES`).

#### Scenario: Registration persists billing address

- **WHEN** a new customer registers via the storefront
- **THEN** the inserted `customers` row includes non-null `billing_address_line1`, `billing_city`, and `billing_postal_code`

### Requirement: Login lockout fields on web profiles

The `public.web_profiles` table SHALL include `failed_login_count` (integer, default 0) and `locked_until` (timestamptz, nullable) to enforce CA-AUTH-004 at the application layer.

#### Scenario: Lockout fields initialized on profile creation

- **WHEN** a new `web_profiles` row is created at registration
- **THEN** `failed_login_count` is 0
- **AND** `locked_until` is NULL
