# Storefront customer account

## Purpose

Authenticated B2C customer account area (`/cuenta`), pending-validation messaging, profile summary, and legacy route aliases for acceptance tests.

## Requirements

### Requirement: B2C customer account layout

The storefront SHALL replace the `/cuenta` placeholder with an authenticated account layout including sidebar navigation (Mi cuenta, Mis pedidos placeholder, Direcciones) and a main content area, preserving the global TopBar, Header, and Footer from the root shell.

#### Scenario: Account layout requires authentication

- **WHEN** an authenticated B2C or pending user opens `/cuenta`
- **THEN** the sidebar and dashboard content render inside the account layout
- **AND** global shell navigation remains visible

#### Scenario: Pending validation banner

- **WHEN** the logged-in customer has `validated_at` IS NULL
- **THEN** a prominent banner explains that the account is pending Jeyjo validation and purchases use B2C conditions until approved

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

### Requirement: Profile summary read-only in v1

The account area SHALL expose a profile section that displays registration fields from `customers` and allows logout; editable profile fields and password change beyond Supabase reset flow are deferred.

#### Scenario: Profile shows registration address

- **WHEN** the user opens the profile section
- **THEN** billing address fields stored at registration are displayed read-only

### Requirement: Legacy route alias for acceptance tests

The storefront SHALL redirect `/mi-cuenta` and `/mi-cuenta/*` to `/cuenta` equivalents with HTTP 308 so CA-AUTH-001 paths remain testable.

#### Scenario: mi-cuenta alias redirects

- **WHEN** a client requests `/mi-cuenta`
- **THEN** the response redirects to `/cuenta`

### Requirement: Customer shipping addresses management

The storefront account area SHALL provide `/cuenta/direcciones` for authenticated customers to list, create, edit, and delete shipping addresses stored in `customer_addresses`, and mark one address as default for checkout preselection.

#### Scenario: List addresses

- **WHEN** an authenticated user opens `/cuenta/direcciones`
- **THEN** saved addresses render with label, recipient, and formatted address

#### Scenario: Create address

- **WHEN** the user submits a valid new address form
- **THEN** a row is inserted linked to their `customer_id`
- **AND** the new address appears in the list

#### Scenario: Set default address

- **WHEN** the user marks an address as default
- **THEN** exactly one address per customer has `is_default` true

#### Scenario: Delete address

- **WHEN** the user deletes a non-default address
- **THEN** the row is removed
- **AND** checkout no longer offers that address

### Requirement: Account sidebar includes direcciones link

The account sidebar navigation SHALL include an active link to `/cuenta/direcciones` replacing the direcciones placeholder.

#### Scenario: Sidebar shows direcciones

- **WHEN** an authenticated user views any `/cuenta/*` page
- **THEN** the sidebar includes "Direcciones" pointing to `/cuenta/direcciones`

### Requirement: Account area lists customer presupuestos US-05 CA2

The storefront account area SHALL provide `/cuenta/presupuestos` for authenticated customers to view quotes linked to their `customerRef`, showing quote number, request date, Spanish status label, and total amount.

#### Scenario: Sidebar includes presupuestos link

- **WHEN** an authenticated user opens the account layout
- **THEN** sidebar navigation includes **Mis presupuestos** linking to `/cuenta/presupuestos`

#### Scenario: Presupuestos page lists quotes

- **WHEN** a customer with two quotes opens `/cuenta/presupuestos`
- **THEN** both quotes render with number, date, status, and total

#### Scenario: Empty presupuestos state

- **WHEN** a customer has no quotes
- **THEN** the page shows an empty-state message and link to the catalog

#### Scenario: Unauthenticated access redirected

- **WHEN** an anonymous user opens `/cuenta/presupuestos`
- **THEN** the user is redirected to login

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
