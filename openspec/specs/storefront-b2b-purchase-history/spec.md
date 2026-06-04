# Storefront B2B purchase history

## Purpose

B2B intranet purchase history at `/intranet/pedidos` with current pricing, filters, and repeat-to-cart (RF-018, US-10, change #23).

## Requirements

### Requirement: B2B purchase history page replaces pedidos scaffold

The storefront SHALL render a production purchase history view at `/intranet/pedidos` titled **Histórico de pedidos** with subsection **Datos histórico**, replacing the portal scaffold empty state for validated B2B customers.

#### Scenario: Validated B2B user sees history table

- **WHEN** a validated B2B user opens `/intranet/pedidos`
- **THEN** a filter panel and a list of purchase history lines are shown
- **AND** the "Próximamente" scaffold badge is not displayed

#### Scenario: Unauthenticated user cannot access history API

- **WHEN** a request hits `/api/intranet/purchase-history` without a validated B2B session
- **THEN** the response status is 401 or 403

### Requirement: History lines show product identity and usual quantity

Each aggregated history line SHALL display a large product image, SKU reference, description, usual quantity, and current recommended sale price for the authenticated company (US-10 CA1).

#### Scenario: Line shows large image and reference

- **WHEN** purchase history loads a line for SKU REF-010 with a CMS product image
- **THEN** the row shows an image at least 64px wide, reference REF-010, and product description

#### Scenario: Usual quantity reflects last purchase

- **WHEN** the customer last bought SKU REF-010 with quantity 24 on the most recent purchase date
- **THEN** the line shows usual quantity 24

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

The purchase history view SHALL provide filters for date from, date to, article reference (text), CMS category, and optional department or site when the data source provides it (US-10 CA4).

#### Scenario: Date range narrows results

- **WHEN** the user sets date from 2026-01-01 and date to 2026-03-31 and applies filters
- **THEN** only lines whose last purchase falls within that range are returned

#### Scenario: Reference filter matches SKU

- **WHEN** the user enters reference text REF-01
- **THEN** only lines whose SKU contains REF-01 (case-insensitive) are shown

#### Scenario: Category filter uses CMS category

- **WHEN** the user selects category Escritura
- **THEN** only lines whose product belongs to that category tree are shown

#### Scenario: Department filter hidden when unavailable

- **WHEN** the customer has no department values in merged history data
- **THEN** the department filter control is not shown

### Requirement: Multi-select repeat order adds lines to cart at current prices

The user SHALL select one or more history lines and activate **Añadir al carrito** to add those products to the client cart using current pricing resolution (US-10 CA2, CA-B2B-004).

#### Scenario: Repeat single line

- **WHEN** the user selects one line for SKU REF-010 with usual quantity 12 and clicks **Añadir al carrito**
- **THEN** the cart gains or increments a line for the CMS product slug with quantity 12
- **AND** cart pricing uses the current price quote not the historical 5.00 EUR

#### Scenario: Repeat multiple lines

- **WHEN** the user selects two valid lines and clicks **Añadir al carrito**
- **THEN** both products are added with their respective usual quantities

#### Scenario: Unavailable catalog SKU cannot be repeated

- **WHEN** a history line has no published non-wildcard CMS product
- **THEN** its checkbox is disabled
- **AND** a tooltip explains the article is not available in the catalog

#### Scenario: Server validates repeat payload

- **WHEN** the client POSTs repeat items to `/api/intranet/purchase-history/repeat`
- **THEN** the server rejects wildcard or unpublished SKUs with 400
- **AND** returns product slugs and quantities only for valid items

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

The API and UI SHALL paginate results with a default page size of 25 lines to keep pricing batch resolution bounded.

#### Scenario: Second page loads next slice

- **WHEN** the user navigates to page 2
- **THEN** the next page of lines is fetched with filters unchanged
