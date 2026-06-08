## MODIFIED Requirements

### Requirement: Customer login with email and password

The storefront SHALL provide `/login` with a form that authenticates via Supabase Auth email/password and, on success, loads `web_profiles` joined to `customers` to determine redirect target per RF-001.

#### Scenario: B2C login redirects to account area (CA-AUTH-001)

- **WHEN** a user with `customer_group = 1` and valid credentials submits the login form
- **THEN** the system creates a session and redirects to `/cuenta`
- **AND** the header account control shows the customer `commercial_name`

#### Scenario: B2B login redirects to account area (CA-AUTH-002)

- **WHEN** a user with `customer_group` in (2, 3, 4), `validated_at` IS NOT NULL, and valid credentials submits the login form
- **THEN** the system redirects to `/cuenta`
- **AND** the B2B empresa section is available in the account sidebar

#### Scenario: Failed login increments lock counter (CA-AUTH-004)

- **WHEN** a user submits incorrect credentials five consecutive times
- **THEN** the sixth attempt returns a message that the account is temporarily locked for 15 minutes
- **AND** authentication is not attempted until `locked_until` has passed

## MODIFIED Requirements

### Requirement: B2B subuser login redirects to intranet

The login flow SHALL treat validated `b2b_subuser` the same as B2B superadmin for redirect purposes (RF-001).

#### Scenario: Subuser login redirects to cuenta

- **WHEN** a user with `role = b2b_subuser`, `is_active = true`, validated company, and valid credentials submits login
- **THEN** the system redirects to `/cuenta`
- **AND** loads effective permissions for navigation

#### Scenario: Deactivated subuser login blocked

- **WHEN** a user with `is_active = false` submits valid credentials
- **THEN** the system does not establish a persistent session
- **AND** returns a message that the account has been deactivated by the company administrator
