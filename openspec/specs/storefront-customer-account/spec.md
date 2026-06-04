# Storefront customer account

## Purpose

Authenticated B2C customer account area (`/cuenta`), pending-validation messaging, profile summary, and legacy route aliases for acceptance tests.

## Requirements

### Requirement: B2C customer account layout

The storefront SHALL replace the `/cuenta` placeholder with an authenticated account layout including sidebar navigation (Mi cuenta, Mis pedidos placeholder, Direcciones placeholder) and a main content area, preserving the global TopBar, Header, and Footer from the root shell.

#### Scenario: Account layout requires authentication

- **WHEN** an authenticated B2C or pending user opens `/cuenta`
- **THEN** the sidebar and dashboard content render inside the account layout
- **AND** global shell navigation remains visible

#### Scenario: Pending validation banner

- **WHEN** the logged-in customer has `validated_at` IS NULL
- **THEN** a prominent banner explains that the account is pending Jeyjo validation and purchases use B2C conditions until approved

### Requirement: Account dashboard shows customer identity

The account dashboard SHALL display commercial name, email, tax id when present, and customer group label appropriate to validation state.

#### Scenario: Validated B2C dashboard

- **WHEN** a validated B2C user opens `/cuenta`
- **THEN** the dashboard shows their commercial name and account email
- **AND** does not show intranet-only menu entries

### Requirement: Profile summary read-only in v1

The account area SHALL expose a profile section that displays registration fields from `customers` and allows logout; editable profile fields and password change beyond Supabase reset flow are deferred.

#### Scenario: Profile shows registration address

- **WHEN** the user opens the profile section
- **THEN** billing address fields stored at registration are displayed read-only

### Requirement: Legacy route alias for acceptance tests

The storefront SHALL redirect `/mi-cuenta` and `/mi-cuenta/*` to `/cuenta` equivalents with HTTP 308 so CA-AUTH-001 paths remain testable.

#### Scenario: mi-cuenta alias redirects

- **WHEN** a client requests `/mi-cuenta`
- **THEN** the response redirects to `/cuenta`
