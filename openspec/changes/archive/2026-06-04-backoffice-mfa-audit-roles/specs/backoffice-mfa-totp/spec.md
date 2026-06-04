## ADDED Requirements

### Requirement: Staff cannot access admin without MFA enrolled

The CMS SHALL require TOTP second factor for every staff user before granting access to the Payload admin UI. A staff user with valid email and password but without completed TOTP enrollment SHALL NOT reach any admin collection view.

#### Scenario: Login blocked without MFA setup

- **WHEN** a staff user authenticates with correct password and has no active TOTP secret configured
- **THEN** the system presents the TOTP enrollment flow (QR compatible with Google Authenticator)
- **AND** does not render the admin dashboard

#### Scenario: Login succeeds with valid TOTP

- **WHEN** a staff user provides correct password and a valid current TOTP code
- **THEN** the system issues an authenticated session with access to admin routes allowed by their staff roles

### Requirement: TOTP is mandatory for all staff roles including superadmin

The CMS SHALL NOT provide any configuration flag, role exemption, or environment bypass that allows staff admin access without MFA in production.

#### Scenario: Superadmin requires TOTP

- **WHEN** a user with role `superadmin` logs in without TOTP configured
- **THEN** the enrollment flow is shown identically to other staff roles

### Requirement: Superadmin can reset staff MFA

A user with staff role `superadmin` SHALL be able to reset another staff user's TOTP secret, forcing re-enrollment on next login.

#### Scenario: MFA reset after device loss

- **WHEN** superadmin triggers MFA reset for `trabajador@jeyjo.es`
- **THEN** the target user's TOTP secret is invalidated
- **AND** an `audit_log` entry records action `MFA_RESET` with actor and target user id

### Requirement: Non-staff users are out of MFA scope

Users without any `staffRoles` value (e.g. legacy `customer` role only) SHALL NOT be subject to backoffice MFA rules and SHALL NOT access admin.

#### Scenario: Customer template user unchanged

- **WHEN** a user has only role `customer` and no staff roles
- **THEN** MFA enrollment for backoffice is not required
- **AND** admin access remains denied
