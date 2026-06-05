# Backoffice KPI dashboard

## Purpose

Admin landing dashboard in Payload CMS with sales KPIs, conversion, realtime visitors/carts, recent orders, and EVA monitoring preview (RF-026, US-19).

## Requirements

### Requirement: Admin landing displays sales KPI cards

The Payload admin landing (`beforeDashboard`) SHALL display KPI cards for the selected period: order count, total revenue, average ticket, conversion rate (unique visitors to completed orders), active visitors (last 5 minutes), and active carts (non-empty cart activity in last 30 minutes), per **RF-026** and **US-19** CA1.

#### Scenario: Superadmin opens admin home today

- **WHEN** a user with `superadmin` opens `/admin` with default period `today`
- **THEN** KPI cards show order count and revenue for orders created today excluding cancelled and failed-payment orders
- **AND** average ticket equals revenue divided by order count when order count is greater than zero

#### Scenario: No orders in period shows zero revenue

- **WHEN** no qualifying orders exist in the selected period
- **THEN** order count and revenue display zero
- **AND** average ticket displays zero or an em dash without error

### Requirement: Dashboard supports preset and custom date ranges

The dashboard SHALL provide period presets `today`, `yesterday`, `week`, `month`, and `custom` with inclusive `from`/`to` dates for custom mode, per **US-19** CA4.

#### Scenario: Switch to this week preset

- **WHEN** staff selects period `week`
- **THEN** all sales KPIs and conversion denominator recalculate for the current calendar week in timezone `Europe/Madrid`

#### Scenario: Custom range applied

- **WHEN** staff selects `custom` with `from=2026-06-01` and `to=2026-06-03`
- **THEN** KPIs include only data whose timestamps fall within that inclusive range

### Requirement: Dashboard lists the five most recent orders

The dashboard SHALL show the five most recent qualifying web orders with order number, created timestamp, customer label, total amount, `origin`, and `jeyjoStatus`, with each row linking to the order in admin.

#### Scenario: Recent orders section populated

- **WHEN** at least five orders exist in the system
- **THEN** the recent orders table shows exactly five rows sorted by `createdAt` descending

#### Scenario: Order row links to detail

- **WHEN** staff clicks a recent order row link
- **THEN** the browser navigates to that order document in Payload admin

### Requirement: EVA monitoring panel is visible on dashboard

The dashboard SHALL include an "Monitorización EVA" panel showing active conversation count and a short list of unresolved items requiring human attention, per **US-19** CA2.

#### Scenario: EVA panel shows pending validation orders

- **WHEN** orders exist with `origin` eva and `validatedEva` false
- **THEN** at least one unresolved item appears in the EVA panel referencing those orders

#### Scenario: EVA panel labels preview mode before SKAI integration

- **WHEN** SKAI live conversation data is not configured
- **THEN** the panel displays a visible preview label and does not error

### Requirement: Financial KPIs restricted by staff role

Users without `superadmin` or `administracion` roles SHALL NOT see revenue, conversion, or recent order financial columns on the dashboard; `mantenimiento` SHALL see technical alerts only; `catalogo` and `personalizacion` SHALL see a minimal welcome without sales figures, per **RF-030**.

#### Scenario: Catalog role sees minimal dashboard

- **WHEN** a user with only `catalogo` opens `/admin`
- **THEN** sales revenue and order tables are hidden
- **AND** a minimal welcome or non-financial widgets may still appear

#### Scenario: Administracion sees full sales KPIs

- **WHEN** a user with `administracion` opens `/admin`
- **THEN** all sales KPI cards and recent orders are visible
