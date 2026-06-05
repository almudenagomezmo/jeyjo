## ADDED Requirements

### Requirement: Account stock watches page for authenticated customers

The route `/cuenta/avisos-stock` SHALL list the signed-in profile stock watches using the same enriched item shape as the intranet page (SKU, title, stock indicator, dates, PDP link, remove action), available to any authenticated customer including B2C.

#### Scenario: B2C user sees watched products in cuenta

- **WHEN** a validated B2C user with watches opens `/cuenta/avisos-stock`
- **THEN** watched products render with stock indicator labels

### Requirement: Account stock watches API

The storefront SHALL expose `GET /api/account/stock-watches` for any authenticated session, returning the same enriched watch items as the intranet API without requiring B2B validation.

#### Scenario: B2C user lists watches via account API

- **WHEN** a validated B2C user requests `GET /api/account/stock-watches`
- **THEN** the response includes their watch items with `stockIndicator` and `href`

### Requirement: Stock watches discoverable from cuenta area

Authenticated customers SHALL be able to reach their stock watches from the `/cuenta` sidebar and dashboard without using the B2B intranet URL. Validated B2B users MAY also use `/intranet/stock`.

#### Scenario: Navigation from cuenta sidebar

- **WHEN** an authenticated user clicks **Avisos de stock** in the `/cuenta` sidebar
- **THEN** the browser navigates to `/cuenta/avisos-stock`
- **AND** the stock watches list page loads

#### Scenario: Navigation from cuenta dashboard card

- **WHEN** an authenticated user clicks the quick-access link on `/cuenta`
- **THEN** the browser navigates to `/cuenta/avisos-stock`
