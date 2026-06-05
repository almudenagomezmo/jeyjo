## MODIFIED Requirements

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

## ADDED Requirements

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
