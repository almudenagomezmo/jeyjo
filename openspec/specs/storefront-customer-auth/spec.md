# Storefront customer auth

## Purpose

Supabase Auth integration for customer login, registration, logout, session middleware, and login audit events (RF-001, RF-004, CA-AUTH).

## Requirements

### Requirement: Supabase Auth session in storefront

The storefront SHALL integrate Supabase Auth using `@supabase/ssr` with cookie-based sessions, middleware session refresh on matched routes, and server helpers to read the current `auth.uid()` in Server Components and Route Handlers.

#### Scenario: Middleware refreshes session cookie

- **WHEN** an authenticated user navigates to any matched storefront route
- **THEN** the middleware refreshes the Supabase session without requiring a client-side effect

#### Scenario: Unauthenticated access to protected account route

- **WHEN** an anonymous user requests `/cuenta` or a child path
- **THEN** the browser is redirected to `/login` with a `next` query preserving the intended path

### Requirement: Customer login with email and password

The storefront SHALL provide `/login` with a form that authenticates via Supabase Auth email/password and, on success, loads `web_profiles` joined to `customers` to determine redirect target per RF-001.

#### Scenario: B2C login redirects to account area (CA-AUTH-001)

- **WHEN** a user with `customer_group = 1` and valid credentials submits the login form
- **THEN** the system creates a session and redirects to `/cuenta`
- **AND** the header account control shows the customer `commercial_name`

#### Scenario: B2B login redirects to intranet (CA-AUTH-002)

- **WHEN** a user with `customer_group` in (2, 3, 4), `validated_at` IS NOT NULL, and valid credentials submits the login form
- **THEN** the system redirects to `/intranet`
- **AND** does not redirect to `/cuenta` as the primary landing

#### Scenario: Failed login increments lock counter (CA-AUTH-004)

- **WHEN** a user submits incorrect credentials five consecutive times
- **THEN** the sixth attempt returns a message that the account is temporarily locked for 15 minutes
- **AND** authentication is not attempted until `locked_until` has passed

### Requirement: Customer self-registration with pending validation

The storefront SHALL provide `/registro` where anonymous visitors submit RF-004 minimum fields and the system creates `auth.users`, a `customers` row with `customer_group = 1` and `validated_at` NULL, and a `web_profiles` row with `role = pending`.

#### Scenario: Successful registration creates pending customer

- **WHEN** a visitor submits valid registration data including email, password, commercial name, phone, and billing address
- **THEN** Supabase Auth creates the user
- **AND** `customers.validated_at` remains NULL
- **AND** `web_profiles.role` is `pending`

#### Scenario: Company registration requires tax identifier

- **WHEN** the registrant marks the account as company
- **THEN** `tax_id` (CIF/NIF) is required before submit is accepted

### Requirement: Logout ends session

The storefront SHALL expose logout that clears the Supabase session and redirects to the shop home or login page.

#### Scenario: Logout from account area

- **WHEN** an authenticated user activates logout from `/cuenta`
- **THEN** the session cookie is cleared
- **AND** subsequent requests to `/cuenta` redirect to `/login`

### Requirement: Login audit event

On successful customer login, the system SHALL record an audit event (Supabase `audit_log` insert via service role or equivalent server path) including user id, customer id, and timestamp.

#### Scenario: Login writes audit row

- **WHEN** login succeeds for an active customer
- **THEN** a new immutable row exists in `audit_log` describing the login action
