# Storefront B2B purchase history

## Purpose

B2B purchase history at `/cuenta/empresa/pedidos` with orders grouped by purchase, current pricing, filters, and repeat-to-cart (RF-018, US-10, changes #23, #52, `purchase-history-order-groups`, `cuenta-pedidos-purchase-history`). The same panel is reused at `/cuenta/pedidos` via account APIs.

## Requirements

### Requirement: B2B purchase history page replaces pedidos scaffold

The storefront SHALL render a production purchase history view at `/cuenta/empresa/pedidos` titled **Histórico de pedidos** with subsection **Datos histórico**, replacing the portal scaffold empty state for validated B2B customers.

#### Scenario: Validated B2B user sees history table

- **WHEN** a validated B2B user opens `/cuenta/empresa/pedidos`
- **THEN** a filter panel and a list of purchase history orders are shown
- **AND** the "Próximamente" scaffold badge is not displayed

#### Scenario: Unauthenticated user cannot access history API

- **WHEN** a request hits `/api/intranet/purchase-history` without a validated B2B session
- **THEN** the response status is 401 or 403

### Requirement: Purchase history is grouped by order with collapsible headers

The purchase history view SHALL list orders (not SKU-aggregated lines) each with a visible header showing order identity, status, purchase date, optional department, and line count. Line items SHALL be hidden by default and toggled per order.

#### Scenario: Order header shows web order metadata

- **WHEN** a web order JW-0042 with status confirmed and two lines is loaded
- **THEN** a card header shows order number JW-0042 linked to `/cuenta/pedidos/42`, status badge, formatted purchase date with time, and "2 artículos"
- **AND** line rows are not visible until the user expands the order

#### Scenario: ERP pseudo-order header without web status

- **WHEN** ERP history lines share date 2026-01-15 and department Sede central
- **THEN** one grouped order header shows purchase date without web status badge (label Histórico ERP)
- **AND** expanding shows all lines from that ERP grouping

#### Scenario: User expands order to see lines

- **WHEN** the user clicks the expand control on an order header
- **THEN** that order's line table or cards become visible
- **AND** other orders remain in their prior expanded or collapsed state

### Requirement: History lines show product identity and purchase quantity

Each order line within a purchase history order SHALL display a large product image, SKU reference, description, quantity from that purchase, and current recommended sale price for the authenticated company (US-10 CA1).

#### Scenario: Line shows large image and reference

- **WHEN** purchase history loads a line for SKU REF-010 with a CMS product image
- **THEN** the row shows an image at least 64px wide, reference REF-010, and product description

#### Scenario: Line quantity reflects that purchase

- **WHEN** the customer bought SKU REF-010 with quantity 12 on order JW-0042
- **THEN** the line within order JW-0042 shows quantity 12

### Requirement: Current price is labeled and authoritative

The list SHALL show the current net unit price from the pricing engine (RF-007) with a visible **Precio actual** label. The historical unit price paid on past delivery notes or orders MUST NOT be presented as the active line price (CA-B2B-004, US-10 CA5).

#### Scenario: Current price label on list

- **WHEN** a line is rendered with current net price 5.50 EUR
- **THEN** the price is shown with label **Precio actual**
- **AND** the displayed active price is 5.50 EUR

#### Scenario: Historical price differs from current

- **WHEN** historical unit price was 5.00 EUR and current net price is 5.50 EUR
- **THEN** the active price shown is 5.50 EUR with **Precio actual**
- **AND** 5.00 EUR is not shown as the price used for add-to-cart

#### Scenario: Special price applies in history list

- **WHEN** the customer has a valid special price for the SKU lower than P2
- **THEN** the current price reflects `appliedRule` special_price
- **AND** the label **Precio actual** remains visible

### Requirement: Filters for date reference category and department

The purchase history view SHALL provide filters for date from, date to, article reference (text), web order status, CMS category (API-supported), and optional department or site when the data source provides it (US-10 CA4).

#### Scenario: Date range narrows results

- **WHEN** the user sets date from 2026-01-01 and date to 2026-03-31 and applies filters
- **THEN** only orders whose purchase date falls within that range are returned

#### Scenario: Reference filter matches SKU

- **WHEN** the user enters reference text REF-01
- **THEN** only orders containing at least one line whose SKU contains REF-01 (case-insensitive) are shown
- **AND** within those orders only matching lines are listed

#### Scenario: Category filter uses CMS category

- **WHEN** the user selects category Escritura
- **THEN** only orders with at least one line whose product belongs to that category tree are shown

#### Scenario: Department filter hidden when unavailable

- **WHEN** the customer has no department values in merged history data
- **THEN** the department filter control is not shown

#### Scenario: Order status filter narrows web orders

- **WHEN** the user selects order status Confirmado and applies filters
- **THEN** only orders with `orderStatus` confirmed are returned
- **AND** ERP-only pseudo-orders without web status are excluded

### Requirement: Multi-select repeat order adds lines to cart at current prices

The user SHALL select one or more order lines and activate **Añadir al carrito** to add those products to the client cart using current pricing resolution (US-10 CA2, CA-B2B-004).

#### Scenario: Repeat single line

- **WHEN** the user selects one line for SKU REF-010 with quantity 12 and clicks **Añadir al carrito**
- **THEN** the cart gains or increments a line for the CMS product slug with quantity 12
- **AND** cart pricing uses the current price quote not the historical 5.00 EUR

#### Scenario: Repeat multiple lines

- **WHEN** the user selects two valid lines and clicks **Añadir al carrito**
- **THEN** both products are added with their respective purchase quantities

#### Scenario: Unavailable catalog SKU cannot be repeated

- **WHEN** a history line has no published non-wildcard CMS product
- **THEN** its checkbox is disabled
- **AND** a tooltip explains the article is not available in the catalog

#### Scenario: Server validates repeat payload

- **WHEN** the client POSTs repeat items to `/api/intranet/purchase-history/repeat`
- **THEN** the server rejects wildcard or unpublished SKUs with 400
- **AND** returns product slugs and quantities only for valid items

### Requirement: Repeat entire order adds all repeatable lines

Each order header with at least one repeatable catalog line SHALL offer **Añadir pedido al carrito** to add all repeatable lines from that order at their purchase quantities using current pricing.

#### Scenario: Repeat full web order

- **WHEN** the user clicks **Añadir pedido al carrito** on an order with two repeatable lines (qty 2 and qty 5)
- **THEN** both products are added to the cart with quantities 2 and 5 at current prices
- **AND** a confirmation toast mentions checkout observations

#### Scenario: Header checkbox selects all repeatable lines in order

- **WHEN** the user checks the order header checkbox
- **THEN** all repeatable lines in that order are selected for the sticky **Añadir al carrito** action

### Requirement: Wildcard SKUs are excluded from purchase history

Lines for wildcard or comodín catalog references (RF-006) SHALL NOT appear in purchase history results.

#### Scenario: Wildcard SKU omitted

- **WHEN** ERP or web order data includes SKU 9000000001 marked wildcard
- **THEN** that SKU does not appear in the purchase history list

### Requirement: Post-repeat guidance for checkout observations

After a successful repeat action, the UI SHALL show a non-blocking message that order observations can be completed at checkout (US-10 CA3 partial; full free-text non-catalog items deferred to quick order change).

#### Scenario: Toast mentions checkout observations

- **WHEN** repeat add-to-cart succeeds
- **THEN** a confirmation message mentions adding observations during checkout

### Requirement: Purchase history supports pagination

The API and UI SHALL paginate results with a default page size of 25 orders to keep pricing batch resolution bounded.

#### Scenario: Second page loads next slice

- **WHEN** the user navigates to page 2
- **THEN** the next page of orders is fetched with filters unchanged

### Requirement: Purchase history panel is reusable in personal account

The storefront SHALL allow `PurchaseHistoryPanel` to be configured with `title`, `subtitle`, and `apiBase` so the same UI serves `/cuenta/empresa/pedidos` (B2B intranet API) and `/cuenta/pedidos` (account API).

#### Scenario: Personal account uses account API base

- **WHEN** `/cuenta/pedidos` renders `PurchaseHistoryPanel` with `apiBase="/api/account/purchase-history"`
- **THEN** list and repeat requests target the account API routes
- **AND** the page title is **Mis pedidos**

#### Scenario: B2B empresa keeps intranet API base

- **WHEN** `/cuenta/empresa/pedidos` renders `PurchaseHistoryPanel` with default `apiBase`
- **THEN** list and repeat requests target `/api/intranet/purchase-history`
- **AND** B2B session and `orders` permission guards remain enforced on those routes
