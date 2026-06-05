# Storefront B2B permissions

## Purpose

Granular section permissions for B2B subusers enforced in navigation, routes, and intranet APIs (RF-003, change #26).

## Requirements

### Requirement: B2B permissions model in web profiles

The application layer SHALL interpret `web_profiles.permissions` as typed section flags: `finance`, `orders`, `account`, and `ordersRequireApproval`, with documented defaults for new subusers (RF-003).

#### Scenario: Superadmin has implicit full access

- **WHEN** `resolveEffectivePermissions` runs for `role = b2b_superadmin`
- **THEN** all section flags evaluate to allowed
- **AND** `ordersRequireApproval` is ignored

#### Scenario: Subuser defaults on create

- **WHEN** a subuser is created without explicit permission overrides
- **THEN** defaults are `finance: false`, `orders: true`, `account: false`, `ordersRequireApproval: false`

### Requirement: Intranet navigation filtered by permissions

The portal sidebar and Contabilidad sub-navigation SHALL hide sections the authenticated user is not allowed to access (RF-003).

#### Scenario: Subuser without finance sees no Contabilidad

- **WHEN** a subuser with `finance: false` loads `/intranet`
- **THEN** the Contabilidad menu item and its children are not rendered
- **AND** other permitted sections remain visible

#### Scenario: Superadmin sees full US-07 menu

- **WHEN** a B2B superadmin loads `/intranet`
- **THEN** all primary navigation items from US-07 are visible

### Requirement: Server-side section guards on intranet routes

Direct navigation to a forbidden intranet URL SHALL be blocked server-side even if the user knows the path (RF-003 verification criterion).

#### Scenario: Finance URL blocked without permission

- **WHEN** a subuser with `finance: false` requests `/intranet/contabilidad/facturas`
- **THEN** the response redirects to `/intranet` with a forbidden message
- **AND** no financial scaffold content implying access is rendered as authorized

#### Scenario: Orders API returns 403 without permission

- **WHEN** a subuser with `orders: false` calls `/api/intranet/purchase-history`
- **THEN** the response status is 403

### Requirement: Intranet APIs enforce section permissions

All existing and future `/api/intranet/*` routes SHALL validate the required section permission via `requireB2bApiSession({ section })` in addition to B2B validation.

#### Scenario: Quick order API requires orders permission

- **WHEN** a subuser with `orders: false` posts to `/api/intranet/quick-order/add`
- **THEN** the response status is 403

#### Scenario: Custom tariffs API requires orders permission

- **WHEN** a subuser with `orders: false` calls `/api/intranet/custom-tariffs`
- **THEN** the response status is 403
