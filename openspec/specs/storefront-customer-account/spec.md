# Storefront customer account

## Purpose

Authenticated B2C customer account area (`/cuenta`), pending-validation messaging, profile summary, and legacy route aliases for acceptance tests.

## Requirements

### Requirement: B2C customer account layout

The storefront SHALL replace the `/cuenta` placeholder with an authenticated account layout including sidebar navigation (Mi cuenta, Mis pedidos placeholder, Direcciones) and a main content area, preserving the global TopBar, Header, and Footer from the root shell.

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

### Requirement: Customer shipping addresses management

The storefront account area SHALL provide `/cuenta/direcciones` for authenticated customers to list, create, edit, and delete shipping addresses stored in `customer_addresses`, and mark one address as default for checkout preselection.

#### Scenario: List addresses

- **WHEN** an authenticated user opens `/cuenta/direcciones`
- **THEN** saved addresses render with label, recipient, and formatted address

#### Scenario: Create address

- **WHEN** the user submits a valid new address form
- **THEN** a row is inserted linked to their `customer_id`
- **AND** the new address appears in the list

#### Scenario: Set default address

- **WHEN** the user marks an address as default
- **THEN** exactly one address per customer has `is_default` true

#### Scenario: Delete address

- **WHEN** the user deletes a non-default address
- **THEN** the row is removed
- **AND** checkout no longer offers that address

### Requirement: Account sidebar includes direcciones link

The account sidebar navigation SHALL include an active link to `/cuenta/direcciones` replacing the direcciones placeholder.

#### Scenario: Sidebar shows direcciones

- **WHEN** an authenticated user views any `/cuenta/*` page
- **THEN** the sidebar includes "Direcciones" pointing to `/cuenta/direcciones`
