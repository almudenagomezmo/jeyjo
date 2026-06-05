## ADDED Requirements

### Requirement: Account sidebar links to stock watches

The account sidebar navigation SHALL include **Avisos de stock** linking to `/cuenta/avisos-stock` for any authenticated customer using the `/cuenta` layout.

#### Scenario: Authenticated user sees avisos de stock in sidebar

- **WHEN** an authenticated user opens any `/cuenta/*` page
- **THEN** the sidebar includes **Avisos de stock** pointing to `/cuenta/avisos-stock`

### Requirement: Account dashboard quick access to stock watches

The account dashboard at `/cuenta` SHALL show a quick-access card with title **Avisos de stock**, brief copy explaining that products marked with the heart icon in the catalog appear there, and a link to `/cuenta/avisos-stock`.

#### Scenario: Dashboard shows stock watches card

- **WHEN** an authenticated user opens `/cuenta`
- **THEN** a card with link to `/cuenta/avisos-stock` is visible below the identity summary

### Requirement: Account area lists stock watches

The storefront account area SHALL provide `/cuenta/avisos-stock` for authenticated customers to view their stock watches with SKU, product title, current stock indicator badge, watch date, link to PDP, and action to remove the watch.

#### Scenario: Account stock watches page lists items

- **WHEN** an authenticated customer with two watches opens `/cuenta/avisos-stock`
- **THEN** both products appear with current stock indicator labels

#### Scenario: Empty account stock watches state

- **WHEN** an authenticated customer has no watches
- **THEN** the page shows guidance to mark products with the heart icon in the catalog
- **AND** includes a link to the public catalog

#### Scenario: Unauthenticated account stock watches redirected

- **WHEN** an anonymous user opens `/cuenta/avisos-stock`
- **THEN** the user is redirected to login

### Requirement: Account stock watches API

The storefront SHALL expose `GET /api/account/stock-watches` returning watches for the session profile enriched with current `stockIndicator` from catalog read, requiring authenticated session (401 guest, 403 disabled account).

#### Scenario: Authenticated customer lists watches with indicators

- **WHEN** an authenticated user requests the account stock-watches API
- **THEN** each item includes `sku`, `productTitle`, `stockIndicator`, `createdAt`, and `href`

## MODIFIED Requirements

### Requirement: Account dashboard shows customer identity

The account dashboard SHALL display commercial name, email, tax id when present, and customer group label appropriate to validation state.

#### Scenario: Validated B2C dashboard

- **WHEN** a validated B2C user opens `/cuenta`
- **THEN** the dashboard shows their commercial name and account email
- **AND** may show the stock watches quick-access card linking to `/cuenta/avisos-stock`

#### Scenario: Validated B2B dashboard on cuenta

- **WHEN** a validated B2B user opens `/cuenta`
- **THEN** the dashboard shows their commercial name and account email
- **AND** may show the stock watches quick-access card linking to `/cuenta/avisos-stock`
