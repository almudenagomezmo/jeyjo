## ADDED Requirements

### Requirement: Intranet access respects B2B section permissions

In addition to B2C and pending validation guards, `/intranet/*` routes SHALL enforce section permissions from `storefront-b2b-permissions` for `b2b_subuser` sessions (RF-003).

#### Scenario: Subuser blocked from forbidden section

- **WHEN** a `b2b_subuser` with `finance: false` navigates to `/intranet/contabilidad/facturas`
- **THEN** the user is redirected away with a forbidden message
- **AND** no B2B financial section content is rendered as authorized access

#### Scenario: Deactivated B2B user cannot access intranet

- **WHEN** a user with `is_active = false` attempts to load `/intranet`
- **THEN** the session is cleared or rejected
- **AND** the user is redirected to `/login` with an account-disabled message

### Requirement: B2B subuser uses same intranet shell with filtered menu

Validated `b2b_subuser` users SHALL access `/intranet` with the production portal shell but with navigation filtered per their permissions.

#### Scenario: Subuser lands on intranet after login

- **WHEN** a validated active subuser completes login
- **THEN** the default route is `/intranet`
- **AND** the intranet header shows the company `commercial_name`
