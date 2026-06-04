## ADDED Requirements

### Requirement: Denied access attempts are audited

When staff access control denies read, update, or delete on a collection, the CMS SHALL append an `audit_log` row with `entity_type` `security`, action `ACCESS_DENIED`, actor metadata, requested collection slug, and source IP when available.

#### Scenario: Catalog user denied orders logs event

- **WHEN** a catalog-only staff user attempts to open orders admin
- **THEN** an `audit_log` row exists with action `ACCESS_DENIED` and metadata including collection `orders`

### Requirement: Security-sensitive user changes are audited

Changes to `staffRoles`, password, MFA enrollment, and MFA reset on the `users` collection SHALL generate `audit_log` entries with `entity_type` `security` or `user` and appropriate action codes (`ROLE_CHANGED`, `PASSWORD_CHANGED`, `MFA_ENROLLED`, `MFA_RESET`).

#### Scenario: Role change recorded

- **WHEN** superadmin changes a staff user from `catalogo` to `administracion`
- **THEN** `audit_log` contains previous and new role arrays in `previous_value` and `new_value`

### Requirement: Failed staff login attempts are auditable

The CMS SHALL record repeated failed login attempts for staff accounts in `audit_log` with action `LOGIN_FAILED` including identifier attempted (email) without storing password values.

#### Scenario: Failed login after wrong password

- **WHEN** a staff email receives a failed authentication due to invalid password
- **THEN** an audit row with `LOGIN_FAILED` is inserted
