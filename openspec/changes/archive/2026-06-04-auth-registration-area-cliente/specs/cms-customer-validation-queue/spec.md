## ADDED Requirements

### Requirement: Staff queue for pending customer registrations

The CMS application SHALL provide a staff-only view listing `customers` where `validated_at` IS NULL, sorted by `created_at` descending, showing commercial name, email, tax id, phone, and registration timestamp per RF-004.

#### Scenario: New registration appears in queue

- **WHEN** a storefront registration completes successfully
- **THEN** the customer row appears in the pending queue within one minute without manual refresh beyond normal admin navigation

### Requirement: Validate customer assigns group and role

Staff with appropriate Payload role SHALL validate a pending customer by assigning `customer_group` (1–4), setting `validated_at` to the current timestamp, and updating the linked `web_profiles.role` to `b2c` when group is 1 or `b2b_superadmin` when group is 2–4.

#### Scenario: Validate B2B company enables intranet access

- **WHEN** staff validates a pending company with `customer_group = 2`
- **THEN** `validated_at` is set
- **AND** `web_profiles.role` becomes `b2b_superadmin`
- **AND** the next login for that user redirects to `/intranet`

#### Scenario: Validate B2C keeps group 1

- **WHEN** staff validates a consumer registration with `customer_group = 1`
- **THEN** `validated_at` is set
- **AND** `web_profiles.role` becomes `b2c`

### Requirement: Validation action is audited

Each validation action SHALL append an immutable `audit_log` record with staff user id, customer id, previous and new `customer_group`, and timestamp.

#### Scenario: Audit log on validation

- **WHEN** staff validates customer id C-123
- **THEN** `audit_log` contains an entry with entity type customer and the group change details

### Requirement: Validation endpoint is staff-authenticated only

The validate action SHALL require an authenticated Payload staff session with permission to manage customers; anonymous and storefront JWT MUST NOT call the validation endpoint successfully.

#### Scenario: Storefront JWT cannot validate

- **WHEN** a storefront customer JWT calls the validation endpoint
- **THEN** the response is 401 or 403
- **AND** no customer row is updated
