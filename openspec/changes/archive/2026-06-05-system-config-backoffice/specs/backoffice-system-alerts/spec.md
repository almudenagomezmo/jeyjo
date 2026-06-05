## MODIFIED Requirements

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
