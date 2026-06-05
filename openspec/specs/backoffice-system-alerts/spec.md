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

When a product SKU ranks in the top sellers by units sold over the configured window (default 30 days) and available stock falls below the configured threshold (default 5 units), the dashboard SHALL show a warning alert naming the product and linking to its admin document.

#### Scenario: Top seller below threshold alerts

- **WHEN** SKU `REF-001` is in the top 10 sellers for the window and available stock is 3
- **THEN** a warning alert lists `REF-001` with current stock
- **AND** the alert links to the product in Payload admin

#### Scenario: Top seller above threshold silent

- **WHEN** a top seller SKU has available stock at or above the threshold
- **THEN** no low-stock alert is generated for that SKU

### Requirement: Pending customer registrations generate dashboard alert

When one or more `customers` rows have `validated_at` NULL, the dashboard SHALL show a warning alert with the pending count and link to the pending customers staff view.

#### Scenario: Pending registrations counted

- **WHEN** three customers await validation
- **THEN** a warning alert states pending count 3
- **AND** the alert links to `/admin/pending-customers`

#### Scenario: No pending registrations

- **WHEN** all customers have `validated_at` set
- **THEN** no pending-customer alert appears

### Requirement: Alert visibility respects staff roles

ERP sync alerts SHALL be visible to `superadmin`, `administracion`, and `mantenimiento`. Pending-customer alerts SHALL be visible to `superadmin` and `administracion` only. Top-sales stock alerts SHALL be visible to `superadmin`, `administracion`, and `catalogo`.

#### Scenario: Mantenimiento does not see pending customer alert

- **WHEN** a `mantenimiento` user loads the dashboard with pending customers
- **THEN** the pending-customer alert is omitted
- **AND** ERP sync alerts may still appear
