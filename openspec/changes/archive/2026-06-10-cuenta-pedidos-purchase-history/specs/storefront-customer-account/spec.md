## ADDED Requirements

### Requirement: Account area lists customer orders with repeat-to-cart

The storefront account area SHALL provide `/cuenta/pedidos` titled **Mis pedidos** for authenticated customers, reusing the purchase history panel with order grouping, filters, line selection, and repeat-to-cart at current prices (RF-018, US-10, #20, #23, #55).

#### Scenario: Sidebar includes mis pedidos link

- **WHEN** an authenticated user opens the account layout
- **THEN** sidebar navigation includes **Mis pedidos** linking to `/cuenta/pedidos`

#### Scenario: Mis pedidos shows filter panel and order cards

- **WHEN** a customer with web orders opens `/cuenta/pedidos`
- **THEN** a filter panel and collapsible order cards are shown
- **AND** the page is not a static summary table only

#### Scenario: Customer repeats line to cart from mis pedidos

- **WHEN** the customer selects a repeatable line and clicks **Añadir al carrito**
- **THEN** the product is added to the cart at current pricing via `/api/account/purchase-history/repeat`

#### Scenario: Unauthenticated mis pedidos redirected

- **WHEN** an anonymous user opens `/cuenta/pedidos`
- **THEN** the user is redirected to login

### Requirement: Account purchase history API

The storefront SHALL expose `GET /api/account/purchase-history` and `POST /api/account/purchase-history/repeat` for any authenticated active customer session, returning the same paginated order shape as the B2B purchase history API without requiring B2B validation or subuser `orders` permission.

#### Scenario: Authenticated B2C customer loads purchase history

- **WHEN** an authenticated B2C user requests `/api/account/purchase-history`
- **THEN** the response status is 200 with `{ orders, total, page, pageSize, departments }`

#### Scenario: Guest cannot access account purchase history API

- **WHEN** an unauthenticated request hits `/api/account/purchase-history`
- **THEN** the response status is 401

#### Scenario: Account repeat validates SKUs server-side

- **WHEN** the client POSTs repeat items to `/api/account/purchase-history/repeat`
- **THEN** the server rejects wildcard or unpublished SKUs with 400
- **AND** returns product slugs and quantities only for valid items

## MODIFIED Requirements

### Requirement: B2C customer account layout

The storefront SHALL replace the `/cuenta` placeholder with an authenticated account layout including sidebar navigation (Mi cuenta, Mis pedidos, Direcciones) and a main content area, preserving the global TopBar, Header, and Footer from the root shell.

#### Scenario: Account layout requires authentication

- **WHEN** an authenticated B2C or pending user opens `/cuenta`
- **THEN** the sidebar and dashboard content render inside the account layout
- **AND** global shell navigation remains visible

#### Scenario: Pending validation banner

- **WHEN** the logged-in customer has `validated_at` IS NULL
- **THEN** a prominent banner explains that the account is pending Jeyjo validation and purchases use B2C conditions until approved
