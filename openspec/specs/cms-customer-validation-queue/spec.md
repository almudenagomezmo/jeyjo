# CMS customer validation queue

## Purpose

Staff-only customer registration queue, full customers admin view, and validate action in Payload CMS (RF-004).

## Requirements

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

### Requirement: Customer detail read-only view

The CMS SHALL provide a staff-only customer detail view showing `customers` registration fields (commercial name, email, phone, tax id, is_company, billing address, customer_group, validated_at, erp_code when present) and linked `web_profiles` rows (email, role, is_active, last_login_at, display_name). Registration and billing fields SHALL remain read-only. For customers with `validated_at` NOT NULL, staff with customer-management permission SHALL see a **Reclasificar** action to change `customer_group` and per-profile `role` as defined in the reclassify requirement. Pending customers (`validated_at` IS NULL) SHALL continue to use only the **Validar** action for group and role assignment.

#### Scenario: Staff opens customer detail

- **WHEN** staff selects a customer from the admin list
- **THEN** the detail view shows customer and profile data from Supabase
- **AND** shows whether Supabase Auth email is confirmed

#### Scenario: Validated customer shows reclassify action

- **WHEN** staff with `superadmin` or `administracion` role and valid MFA opens a validated customer detail
- **THEN** a **Reclasificar** button is visible
- **AND** registration fields remain read-only until the modal is opened

#### Scenario: Pending customer shows validate not reclassify

- **WHEN** staff opens a pending customer detail
- **THEN** the **Validar** action is available
- **AND** **Reclasificar** is not shown

### Requirement: Reclassify validated customer group and profile roles

Staff with roles `superadmin` or `administracion` and valid MFA session SHALL reclassify a customer only when `validated_at` IS NOT NULL. Reclassification SHALL update `customers.customer_group` (1–4) and each linked `web_profiles.role` supplied in the request. Reclassification SHALL NOT modify `validated_at`, registration fields, or `permissions` jsonb.

#### Scenario: Upgrade B2C to B2B empresa

- **WHEN** staff reclassifies a validated customer from `customer_group = 1` to `customer_group = 2` and sets the titular profile role to `b2b_superadmin`
- **THEN** `customers.customer_group` becomes 2
- **AND** the titular `web_profiles.role` becomes `b2b_superadmin`
- **AND** `validated_at` is unchanged
- **AND** the customer's next login redirects to `/intranet`

#### Scenario: Fix desynchronized role on validated B2B customer

- **WHEN** a validated customer has `customer_group = 2` but titular `web_profiles.role = pending`
- **AND** staff reclassifies with group 2 and role `b2b_superadmin`
- **THEN** the titular role is updated to `b2b_superadmin`
- **AND** the customer can access Contabilidad as superadmin on next session

#### Scenario: Reclassify blocked on pending customer

- **WHEN** staff attempts to reclassify a customer with `validated_at` IS NULL
- **THEN** the action is rejected with HTTP 409
- **AND** no row is updated

#### Scenario: Downgrade to B2C blocked when active subusers exist

- **WHEN** staff attempts to reclassify a validated B2B customer to `customer_group = 1`
- **AND** the company has one or more active `b2b_subuser` profiles
- **THEN** the action is rejected with HTTP 409 and an explanatory message
- **AND** no row is updated

#### Scenario: Invalid role for B2B group rejected

- **WHEN** staff attempts to set titular role `b2c` while `customer_group` is 2, 3, or 4
- **THEN** the action is rejected with HTTP 400
- **AND** no row is updated

### Requirement: Reclassify action is audited

Each reclassification action SHALL append an immutable `audit_log` record with staff user id, customer id, previous and new `customer_group`, and previous and new role per affected `web_profiles` row.

#### Scenario: Audit log on reclassify

- **WHEN** staff reclassifies customer id C-456 from group 1 to group 2
- **THEN** `audit_log` contains an entry with action `CUSTOMER_RECLASSIFIED` and group/role change details

### Requirement: Reclassify endpoint is staff-authenticated only

The reclassify action SHALL require an authenticated Payload staff session with roles `superadmin` or `administracion`, valid MFA session, and the same customer-management permission used for validate. Anonymous and storefront JWT MUST NOT call the reclassify endpoint successfully.

#### Scenario: Storefront JWT cannot reclassify

- **WHEN** a storefront customer JWT calls `PATCH /next/customers/:id/reclassify`
- **THEN** the response is 401 or 403
- **AND** no customer or profile row is updated

#### Scenario: Staff without MFA cannot reclassify

- **WHEN** staff with valid role but no MFA session calls the reclassify endpoint
- **THEN** the response is 403
- **AND** no row is updated

### Requirement: Reclassify does not send approval email

Reclassification SHALL NOT trigger the customer approval email template used on initial validation. Staff corrections are silent to the customer in v1.

#### Scenario: No email on reclassify

- **WHEN** staff successfully reclassifies a validated customer
- **THEN** no approval email is sent
- **AND** database updates persist

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
