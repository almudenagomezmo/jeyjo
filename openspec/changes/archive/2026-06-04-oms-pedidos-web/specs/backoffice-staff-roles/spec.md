## ADDED Requirements

### Requirement: OMS custom admin routes restricted to administration roles

Custom Payload admin routes for OMS (`/admin/oms`, `/admin/oms/eva`) and their backing API endpoints SHALL be accessible only to users with `superadmin` or `administracion` in `staffRoles`.

#### Scenario: Administracion opens OMS inbox route

- **WHEN** an administracion staff user navigates to `/admin/oms`
- **THEN** the OMS inbox view loads successfully

#### Scenario: Catalog role denied OMS route

- **WHEN** a catalogo-only staff user navigates to `/admin/oms` or calls OMS export API
- **THEN** access is denied with 403 semantics
- **AND** a security audit event is recorded per backoffice-security-events

## MODIFIED Requirements

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
