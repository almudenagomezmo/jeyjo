## ADDED Requirements

### Requirement: Audit log is readable from backoffice

The CMS SHALL provide an admin-only audit log view that queries Supabase `audit_log` via a server endpoint using the service role. The view SHALL be read-only; no create, update, or delete actions on audit rows from the UI.

#### Scenario: Superadmin filters audit by date range

- **WHEN** a user with `superadmin` or `mantenimiento` sets filters for operator email, entity type `product`, and last 7 days
- **THEN** the view lists matching rows ordered by `created_at` descending
- **AND** each row shows actor name, action, entity type, entity id, timestamps, and source IP when present

### Requirement: Audit view respects role permissions

Only staff roles `superadmin` and `mantenimiento` SHALL access the audit log view and API. Other staff roles SHALL receive forbidden when opening the view or calling the API.

#### Scenario: Catalog user denied audit UI

- **WHEN** a catalog-only staff user navigates to the audit log route
- **THEN** access is denied and no audit rows are returned

### Requirement: Optional CSV export for audits

Superadmin SHALL export the current filtered result set as CSV with a maximum of 10,000 rows per export.

#### Scenario: Export filtered audit

- **WHEN** superadmin clicks export on a filtered audit list under the row limit
- **THEN** the browser downloads a CSV containing the visible columns

### Requirement: Price change visible in audit detail

Audit entries for product price updates SHALL include `previous_value` and `new_value` JSON sufficient to satisfy CA-BACKEND-005 (e.g. `p1Price` before and after).

#### Scenario: Price update appears in console

- **WHEN** superadmin changes product P1 price and opens audit console filtered to that product
- **THEN** an entry with action indicating price update shows prior and new price fields
