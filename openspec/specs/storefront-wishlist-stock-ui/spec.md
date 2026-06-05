# storefront-wishlist-stock-ui

## Purpose

B2B intranet stock watches page, catalog wishlist sync, and alert subscription UX (US-07 CA2, change #35).

## Requirements

### Requirement: Intranet stock page lists watched products US-07

The route `/intranet/stock` SHALL replace its scaffold with a page listing the signed-in B2B-validated profile stock watches, showing SKU, product title, current stock indicator badge, watch date, link to PDP, and action to remove the watch.

#### Scenario: B2B user sees watched products

- **WHEN** a validated B2B user with two watches opens `/intranet/stock`
- **THEN** both products appear with current stock indicator labels
- **AND** no roadmap scaffold placeholder is shown

#### Scenario: Empty state guides user

- **WHEN** the profile has no watches
- **THEN** the page shows guidance to mark products with the heart icon when out of stock
- **AND** includes a link to the public catalog

### Requirement: Stock watches intranet API

The storefront SHALL expose `GET /api/intranet/stock-watches` returning watches for the session profile enriched with current `stockIndicator` from catalog read, requiring validated B2B session (401 guest, 403 non-B2B or non-validated).

#### Scenario: Validated B2B lists watches with indicators

- **WHEN** a validated B2B user requests the stock-watches API
- **THEN** each item includes `sku`, `productTitle`, `stockIndicator`, `createdAt`, and `href`

### Requirement: Catalog heart syncs to server when authenticated

`ProductCard` and `ProductBuyBox` SHALL call wishlist APIs on toggle when the user has an authenticated session, while continuing localStorage persistence for anonymous users.

#### Scenario: Logged-in toggle persists server-side

- **WHEN** an authenticated user adds a product to wishlist from PDP
- **THEN** a `stock_watches` row is created for that profile and SKU

#### Scenario: Anonymous toggle stays local only

- **WHEN** an anonymous user toggles wishlist on PLP
- **THEN** only localStorage is updated
- **AND** no server watch row is created

### Requirement: PDP confirms alert subscription for B2B validated users

When a validated B2B user adds a product with stock indicator `limited` to the wishlist from PDP, the UI SHALL show a non-blocking confirmation that they will be notified when stock is available.

#### Scenario: Limited stock add shows confirmation

- **WHEN** a validated B2B user hearts a limited-stock product on PDP
- **THEN** a confirmation message states they will be notified when stock is available

#### Scenario: Available stock add has no alert promise

- **WHEN** a user hearts a product with indicator `available`
- **THEN** no stock-alert subscription message is shown

### Requirement: Navigation entry is no longer scaffold

The intranet navigation entry for Avisos de stock SHALL point to the operational `/intranet/stock` page without `scaffold` metadata.

#### Scenario: Menu item opens live page

- **WHEN** the user clicks Avisos de stock in the B2B menu
- **THEN** the stock watches page loads instead of `IntranetScaffoldPage`

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
