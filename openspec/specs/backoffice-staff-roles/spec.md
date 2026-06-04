# Backoffice staff roles

## Purpose

Functional role-based access control for Jeyjo staff users in Payload CMS, defining permissions per business area.

## Requirements

### Requirement: Staff roles define functional areas

The `users` collection SHALL expose `staffRoles` as a multi-select with values: `superadmin`, `administracion`, `catalogo`, `personalizacion`, `mantenimiento`. Staff membership is defined as having at least one `staffRoles` entry. Roles SHALL be stored in the JWT (`saveToJWT: true`) for access checks without extra DB reads.

#### Scenario: New employee assigned catalog role only

- **WHEN** superadmin creates a user with `staffRoles: ['catalogo']`
- **THEN** the user can authenticate as staff
- **AND** JWT includes `catalogo` for subsequent requests

### Requirement: Superadmin manages staff accounts and roles

Only users with `superadmin` in `staffRoles` SHALL create, update, or delete `staffRoles` on other users. Users SHALL NOT elevate their own roles.

#### Scenario: Non-superadmin cannot grant superadmin

- **WHEN** a user with only `catalogo` attempts to add `superadmin` to their own account
- **THEN** the operation is rejected with forbidden semantics

### Requirement: OMS custom admin routes restricted to administration roles

Custom Payload admin routes for OMS (`/admin/oms`, `/admin/oms/eva`) and their backing API endpoints SHALL be accessible only to users with `superadmin` or `administracion` in `staffRoles`.

#### Scenario: Administracion opens OMS inbox route

- **WHEN** an administracion staff user navigates to `/admin/oms`
- **THEN** the OMS inbox view loads successfully

#### Scenario: Catalog role denied OMS route

- **WHEN** a catalogo-only staff user navigates to `/admin/oms` or calls OMS export API
- **THEN** access is denied with 403 semantics
- **AND** a security audit event is recorded per backoffice-security-events

### Requirement: Catalog role cannot access orders

Users with only `catalogo` (and not `superadmin` or `administracion`) SHALL NOT have read or write access to the `orders` collection, order admin navigation, or any OMS custom views and order export endpoints.

#### Scenario: Direct URL to orders returns forbidden

- **WHEN** a catalog-only staff user requests the orders list or REST API for orders
- **THEN** access is denied (403 or equivalent Payload forbidden)
- **AND** no order data is returned in the response body

#### Scenario: Direct URL to OMS inbox returns forbidden

- **WHEN** a catalog-only staff user requests `/admin/oms` or `/api/orders/export-avansuite`
- **THEN** access is denied (403)
- **AND** no order data is returned

### Requirement: Administration role accesses orders not catalog write

Users with `administracion` (without `catalogo` or `superadmin`) SHALL read and update `orders` but SHALL NOT create, update, or delete `products`, `categories`, or `suppliers`.

#### Scenario: Admin area user views orders

- **WHEN** an administracion staff user opens the orders admin view
- **THEN** order data is visible per existing collection permissions

#### Scenario: Admin area user cannot edit products

- **WHEN** an administracion staff user attempts to PATCH a product
- **THEN** the operation is forbidden

### Requirement: Personalization role accesses content not orders or catalog

Users with only `personalizacion` SHALL manage content collections (e.g. `pages`, `media` for marketing) and SHALL NOT access `orders` or catalog collections.

#### Scenario: Personalization user edits pages

- **WHEN** a personalizacion staff user updates a page document
- **THEN** the save succeeds if page access rules allow personalization role

### Requirement: Maintenance role accesses audit and limited user read

Users with `mantenimiento` SHALL read the audit console and have read-only access to staff user listings without changing `staffRoles` or passwords.

#### Scenario: Maintenance views audit log

- **WHEN** a mantenimiento staff user opens the audit log view
- **THEN** filtered audit entries are displayed
