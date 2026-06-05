# Backoffice system alerts

## Purpose

Operational alert tray on the Payload admin dashboard for ERP sync failures, top-sales low stock, and pending customer validations (RF-026, US-19 CA3).

## Requirements

### Requirement: System alerts tray on admin dashboard

The dashboard SHALL include a system alerts tray listing operational issues with severity, title, description, timestamp, and action link, per **RF-026** and **US-19** CA3.

#### Scenario: Alerts tray renders when empty

- **WHEN** no alert conditions are met
- **THEN** the tray displays a neutral empty state without error

#### Scenario: Multiple alerts sorted by severity

- **WHEN** ERP sync failure and pending customer alerts coexist
- **THEN** error-severity alerts appear before warning-severity alerts

### Requirement: ERP sync failure generates dashboard alert

When the latest ERP catalog sync run within 24 hours has status `failed` or `partial`, or an `audit_log` entry with ERP sync error exists within 24 hours, the dashboard SHALL surface an error alert with summary text and link to diagnostic context.

#### Scenario: Failed erp_sync_runs triggers alert

- **WHEN** the most recent `erp_sync_runs` row within 24 hours has status `failed`
- **THEN** an error alert appears describing the sync failure
- **AND** the alert includes `error_summary` when present

#### Scenario: Successful sync within 24 hours clears ERP error alert

- **WHEN** the latest `erp_sync_runs` within 24 hours has status `success` and no recent `error_erp` audit entries exist
- **THEN** no ERP sync error alert is shown

### Requirement: Top sales low stock generates dashboard alert

When a product SKU ranks in the top sellers by units sold over the configured window from CMS `systemSettings` (default 30 days, env `TOP_SALES_WINDOW_DAYS` fallback) and available stock falls below the configured threshold from CMS `systemSettings` (default 5 units, env `DASHBOARD_LOW_STOCK_THRESHOLD` fallback), the dashboard SHALL show a warning alert naming the product and linking to its admin document.

#### Scenario: Top seller below threshold alerts

- **WHEN** SKU `REF-001` is in the top 10 sellers for the window and available stock is 3
- **THEN** a warning alert lists `REF-001` with current stock
- **AND** the alert links to the product in Payload admin

#### Scenario: Top seller above threshold silent

- **WHEN** a top seller SKU has available stock at or above the threshold
- **THEN** no low-stock alert is generated for that SKU

#### Scenario: Staff-configured window and threshold applied

- **WHEN** `systemSettings.topSalesWindowDays` is 14 and `systemSettings.dashboardLowStockThreshold` is 8
- **AND** SKU `REF-002` ranks top seller in 14 days with stock 6
- **THEN** no low-stock alert is generated for `REF-002`

#### Scenario: Staff lowers threshold triggers alert

- **WHEN** `systemSettings.dashboardLowStockThreshold` is 10
- **AND** a top seller SKU has stock 8
- **THEN** a warning alert is generated for that SKU

### Requirement: Pending customer registrations generate dashboard alert

When one or more `customers` rows have `validated_at` NULL, the dashboard SHALL show a warning alert with the pending count and link to the pending customers staff view.

#### Scenario: Pending registrations counted

- **WHEN** three customers await validation
- **THEN** a warning alert states pending count 3
- **AND** the alert links to `/admin/customers?status=pending`

#### Scenario: No pending registrations

- **WHEN** all customers have `validated_at` set
- **THEN** no pending-customer alert appears

### Requirement: Alert visibility respects staff roles

ERP sync alerts SHALL be visible to `superadmin`, `administracion`, and `mantenimiento`. Pending-customer alerts SHALL be visible to `superadmin` and `administracion` only. Top-sales stock alerts SHALL be visible to `superadmin`, `administracion`, and `catalogo`.

#### Scenario: Mantenimiento does not see pending customer alert

- **WHEN** a `mantenimiento` user loads the dashboard with pending customers
- **THEN** the pending-customer alert is omitted
- **AND** ERP sync alerts may still appear

### Requirement: Search index health alert in system alerts tray

The admin dashboard system alerts tray SHALL surface a warning when `search_events` has `error` count greater than zero or oldest pending age exceeds 300 seconds, and an error alert when `error` count is at least 10 or oldest pending age exceeds 900 seconds, with action link to search queue diagnostics context, per **RF-009** operational criteria.

#### Scenario: Pending backlog warning

- **WHEN** the oldest pending search event is 400 seconds old and error count is zero
- **THEN** a warning alert appears in the system alerts tray describing search index lag

#### Scenario: Accumulated errors trigger error alert

- **WHEN** `search_events` has 10 or more rows with `status = 'error'`
- **THEN** an error-severity alert appears before warning-severity alerts from other sources at the same severity tier

#### Scenario: Healthy queue shows no search alert

- **WHEN** pending count is zero, error count is zero, and no stale processing rows exist
- **THEN** no search-index alert is shown in the tray
