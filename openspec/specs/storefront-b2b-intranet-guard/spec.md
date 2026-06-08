# Storefront B2B intranet guard

## Purpose

Authenticated B2B empresa area (`/cuenta/empresa/*`), access guards for B2C and pending users, and optional MFA recommendation banner (US-07, CA-AUTH-003/005).

## Requirements

### Requirement: B2B intranet route shell

The storefront SHALL expose `/cuenta/empresa/*` as the authenticated B2B empresa area for validated customers (`customer_group` 2, 3, or 4), integrated within the unified `/cuenta` layout with a dedicated Empresa sidebar section, Contabilidad sub-navigation, and navigation matching US-07 menu labels.

#### Scenario: B2B user lands on cuenta after login

- **WHEN** a validated B2B user completes login
- **THEN** the default route is `/cuenta`
- **AND** the account area shows company `commercial_name` and `tax_id` when applicable

#### Scenario: Empresa section pages use structured scaffolds

- **WHEN** a B2B user opens a non-implemented empresa section
- **THEN** the UI shows a structured scaffold with section title and roadmap-oriented empty state
- **AND** does not expose financial documents or ERP transactional data without authorization

### Requirement: B2C users cannot access intranet routes

The storefront SHALL block authenticated B2C users (`customer_group = 1`) from all `/cuenta/empresa/*` paths per CA-AUTH-003 and RF-001.

#### Scenario: B2C direct URL to empresa finances

- **WHEN** a B2C session requests `/cuenta/empresa/contabilidad/facturas` or any `/cuenta/empresa/*` path
- **THEN** the user is redirected to `/cuenta` with a forbidden message
- **AND** no B2B data is rendered

### Requirement: Unvalidated B2B registrants treated as B2C for intranet

Customers with `customer_group` greater than 1 but `validated_at` NULL SHALL NOT access `/cuenta/empresa/*` until staff validation completes.

#### Scenario: Pending B2B registration blocked from empresa

- **WHEN** a user has `role = pending` and staff has not set `validated_at`
- **THEN** navigation to `/cuenta/empresa/*` redirects to `/cuenta` with pending-validation messaging

### Requirement: Optional MFA recommendation banner for B2B superadmin

When `web_profiles.mfa_enabled` is false and `role = b2b_superadmin`, the empresa layout under `/cuenta/empresa/*` SHALL show a non-blocking banner recommending MFA activation per CA-AUTH-005 (client segment).

#### Scenario: B2B without MFA sees recommendation

- **WHEN** a validated B2B superadmin with `mfa_enabled = false` loads `/cuenta/empresa/pedidos`
- **THEN** a banner recommends enabling MFA from profile
- **AND** access is granted without TOTP challenge in this change

### Requirement: Intranet access respects B2B section permissions

In addition to B2C and pending validation guards, `/cuenta/empresa/*` routes SHALL enforce section permissions from `storefront-b2b-permissions` for `b2b_subuser` sessions (RF-003).

#### Scenario: Subuser blocked from forbidden section

- **WHEN** a `b2b_subuser` with `finance: false` navigates to `/cuenta/empresa/contabilidad/facturas`
- **THEN** the user is redirected away with a forbidden message
- **AND** no B2B financial section content is rendered as authorized access

#### Scenario: Deactivated B2B user cannot access empresa

- **WHEN** a user with `is_active = false` attempts to load `/cuenta/empresa/pedidos`
- **THEN** the session is cleared or rejected
- **AND** the user is redirected to `/login` with an account-disabled message

### Requirement: B2B subuser uses same intranet shell with filtered menu

Validated `b2b_subuser` users SHALL access `/cuenta/empresa/*` with portal shell but with Empresa navigation filtered per their permissions.

#### Scenario: Subuser lands on cuenta after login

- **WHEN** a validated active subuser completes login
- **THEN** the default route is `/cuenta`
- **AND** the account area shows the company `commercial_name`
