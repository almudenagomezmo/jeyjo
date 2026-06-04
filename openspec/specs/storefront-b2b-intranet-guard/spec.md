# Storefront B2B intranet guard

## Purpose

Authenticated B2B intranet shell (`/intranet`), access guards for B2C and pending users, and optional MFA recommendation banner (US-07, CA-AUTH-003/005).

## Requirements

### Requirement: B2B intranet route shell

The storefront SHALL expose `/intranet` as an authenticated area for validated B2B customers (`customer_group` 2, 3, or 4) with a placeholder dashboard and navigation skeleton matching US-07 menu labels (Mi cuenta, Contabilidad, Histórico de pedidos, Pedido rápido, Precios especiales, RMA, Avisos de stock, Descargas, Contacto).

#### Scenario: B2B user lands on intranet after login

- **WHEN** a validated B2B user completes login
- **THEN** the default route is `/intranet` (or `/intranet/dashboard` as child)
- **AND** the intranet header shows company `commercial_name` and `tax_id`

#### Scenario: Intranet menu entries are placeholders in v1

- **WHEN** a B2B user opens a non-dashboard intranet section link
- **THEN** the UI shows a “Próximamente” state without ERP data
- **AND** does not expose financial documents (deferred to change #37)

### Requirement: B2C users cannot access intranet routes

The storefront SHALL block authenticated B2C users (`customer_group = 1`) from all `/intranet/*` paths per CA-AUTH-003 and RF-001.

#### Scenario: B2C direct URL to intranet finances

- **WHEN** a B2C session requests `/intranet/facturas` or any `/intranet/*` path
- **THEN** the user is redirected to `/cuenta` with a forbidden message
- **AND** no B2B data is rendered

### Requirement: Unvalidated B2B registrants treated as B2C for intranet

Customers with `customer_group` greater than 1 but `validated_at` NULL SHALL NOT access `/intranet` until staff validation completes.

#### Scenario: Pending B2B registration blocked from intranet

- **WHEN** a user has `role = pending` and staff has not set `validated_at`
- **THEN** navigation to `/intranet` redirects to `/cuenta` with pending-validation messaging

### Requirement: Optional MFA recommendation banner for B2B superadmin

When `web_profiles.mfa_enabled` is false and `role = b2b_superadmin`, the intranet shell SHALL show a non-blocking banner recommending MFA activation per CA-AUTH-005 (client segment).

#### Scenario: B2B without MFA sees recommendation

- **WHEN** a validated B2B superadmin with `mfa_enabled = false` loads `/intranet`
- **THEN** a banner recommends enabling MFA from profile
- **AND** access is granted without TOTP challenge in this change
