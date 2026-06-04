## ADDED Requirements

### Requirement: Quotes custom admin routes restricted to administration roles

Custom Payload admin routes for quotes (`/admin/quotes`) and their backing API endpoints (`/api/quotes/*` staff operations) SHALL be accessible only to users with `superadmin` or `administracion` in `staffRoles`.

#### Scenario: Administracion opens quotes inbox route

- **WHEN** an administracion staff user navigates to `/admin/quotes`
- **THEN** the quotes inbox view loads successfully

#### Scenario: Catalog role denied quotes route

- **WHEN** a catalogo-only staff user navigates to `/admin/quotes` or calls quote status PATCH API
- **THEN** access is denied with 403 semantics
- **AND** a security audit event is recorded per backoffice-security-events

### Requirement: Catalog role cannot access quotes collection

Users with only `catalogo` (and not `superadmin` or `administracion`) SHALL NOT have read or write access to the `quotes` collection, quotes admin navigation, or quotes inbox and conversion endpoints.

#### Scenario: Direct URL to quotes returns forbidden

- **WHEN** a catalog-only staff user requests the quotes list or REST API for quotes
- **THEN** access is denied (403)
- **AND** no quote data is returned

#### Scenario: Administration role accesses quotes

- **WHEN** an administracion staff user opens the quotes admin view
- **THEN** quote data is visible per collection permissions
