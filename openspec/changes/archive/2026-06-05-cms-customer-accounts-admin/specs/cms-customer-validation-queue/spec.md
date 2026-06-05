## MODIFIED Requirements

### Requirement: Staff queue for pending customer registrations

The CMS application SHALL provide a staff-only **Customers** admin view at `/admin/customers` listing all `customers` rows from Supabase with default filter `validated_at` IS NULL (pending), sorted by `created_at` descending. Staff SHALL filter by validation status (pending, validated, all), `customer_group` (1–4), and search by email or `tax_id`. The list SHALL show commercial name, email, tax id, phone, customer group, validation status, and registration timestamp per RF-004.

#### Scenario: New registration appears in pending filter

- **WHEN** a storefront registration completes successfully
- **THEN** the customer row appears in the admin list with pending filter within one minute without manual refresh beyond normal admin navigation

#### Scenario: Validated customer appears in validated filter

- **WHEN** staff has validated a customer
- **THEN** the row no longer appears under the default pending filter
- **AND** appears when staff filters by validated status

#### Scenario: Legacy pending URL redirects

- **WHEN** staff navigates to `/admin/pending-customers`
- **THEN** the browser is redirected to `/admin/customers` with pending filter applied

### Requirement: Validate customer assigns group and role

Staff with roles `superadmin` or `administracion` and valid MFA session SHALL validate a pending customer only when the linked Supabase Auth user has a confirmed email address. Validation SHALL assign `customer_group` (1–4) via an explicit selector with business labels: 1 B2C particular, 2 B2B empresa, 3 B2B colegio/instituto, 4 B2B concurso público; set `validated_at` to the current timestamp; and update linked `web_profiles.role` to `b2c` when group is 1 or `b2b_superadmin` when group is 2–4.

#### Scenario: Validate blocked when email not confirmed

- **WHEN** staff attempts to validate a customer whose Supabase Auth email is not confirmed
- **THEN** the validate action is rejected with an error
- **AND** no `customers` or `web_profiles` row is updated

#### Scenario: Validate B2B company enables intranet access

- **WHEN** staff validates a pending company with `customer_group = 2`
- **THEN** `validated_at` is set
- **AND** `web_profiles.role` becomes `b2b_superadmin`
- **AND** the next login for that user redirects to `/intranet`

#### Scenario: Validate B2C keeps group 1

- **WHEN** staff validates a consumer registration with `customer_group = 1`
- **THEN** `validated_at` is set
- **AND** `web_profiles.role` becomes `b2c`

#### Scenario: Validate school group 3 enables intranet

- **WHEN** staff validates a pending registration with `customer_group = 3`
- **THEN** `validated_at` is set
- **AND** `web_profiles.role` becomes `b2b_superadmin`
- **AND** the next login redirects to `/intranet`

#### Scenario: Validate public tender group 4 enables intranet

- **WHEN** staff validates a pending registration with `customer_group = 4`
- **THEN** `validated_at` is set
- **AND** `web_profiles.role` becomes `b2b_superadmin`
- **AND** the next login redirects to `/intranet`

## ADDED Requirements

### Requirement: Customer detail read-only view

The CMS SHALL provide a staff-only customer detail view showing read-only `customers` registration fields (commercial name, email, phone, tax id, is_company, billing address, customer_group, validated_at, erp_code when present) and linked `web_profiles` rows (email, role, is_active, last_login_at, display_name). Staff SHALL NOT edit those fields in v1 except through the validate action on pending rows.

#### Scenario: Staff opens customer detail

- **WHEN** staff selects a customer from the admin list
- **THEN** the detail view shows customer and profile data from Supabase
- **AND** shows whether Supabase Auth email is confirmed

### Requirement: Approval email on validation

When staff successfully validates a customer, the CMS SHALL send a transactional email via Payload email transport (Mailpit in development, Resend SMTP in production) to the customer email. The email SHALL state that Jeyjo has approved the account, include assigned customer group and tax id when present, and link to `/cuenta` for group 1 or `/intranet` for groups 2–4. B2B templates SHALL vary copy by group (empresa, colegio/instituto, concurso público).

#### Scenario: B2C approval email sent

- **WHEN** staff validates a customer with `customer_group = 1` and email transport is configured
- **THEN** an approval email is sent to the customer address
- **AND** the email contains a link to the storefront account area

#### Scenario: B2B approval email sent for group 3

- **WHEN** staff validates a customer with `customer_group = 3`
- **THEN** an approval email is sent mentioning centro educativo / catálogo escolar context
- **AND** the email contains a link to `/intranet`

#### Scenario: Email failure does not roll back validation

- **WHEN** validation succeeds but SMTP fails
- **THEN** `validated_at` and `web_profiles.role` remain updated
- **AND** the error is logged server-side

### Requirement: Dashboard alert links to customers admin

The dashboard system alert for pending customers SHALL link to `/admin/customers` with pending filter instead of the legacy pending-customers path.

#### Scenario: Alert navigates to filtered list

- **WHEN** staff clicks the pending customers dashboard alert
- **THEN** the Customers admin opens with pending filter active
