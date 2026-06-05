## ADDED Requirements

### Requirement: B2B quick order page replaces pedido-rapido scaffold

The storefront SHALL render a production quick order view at `/intranet/pedido-rapido` titled **Pedido rápido**, replacing the portal scaffold empty state for validated B2B customers (US-11, RF-019).

#### Scenario: Validated B2B user sees quick order form

- **WHEN** a validated B2B user opens `/intranet/pedido-rapido`
- **THEN** a reference input, quantity input, Excel upload area, and add-to-cart actions are shown
- **AND** the "Próximamente" scaffold badge is not displayed

#### Scenario: Unauthenticated user cannot access quick order APIs

- **WHEN** a request hits `/api/intranet/quick-order/lookup` without a validated B2B session
- **THEN** the response status is 401 or 403

### Requirement: Single reference lookup with live preview

The quick order section SHALL allow entering a reference (Jeyjo SKU, OEM, or EAN) and quantity, resolving the product server-side and showing name, image, and current B2B price before add-to-cart (US-11 CA1–CA2).

#### Scenario: SKU lookup shows preview

- **WHEN** the user enters reference REF-001 and quantity 6 and the product is published
- **THEN** the UI shows product title, image, and current net price with label **Precio actual**
- **AND** an add-to-cart control is enabled

#### Scenario: OEM reference resolves to catalog product

- **WHEN** the user enters an OEM code that matches `oemRef` on a published product
- **THEN** the preview shows that product with matched reference type indicated
- **AND** add-to-cart uses the canonical CMS slug for the line

#### Scenario: EAN reference resolves to catalog product

- **WHEN** the user enters an EAN that matches `ean` on a published product
- **THEN** the preview shows that product
- **AND** the canonical SKU is used for pricing resolution

### Requirement: Excel upload adds multiple lines in one operation

The quick order section SHALL accept an Excel file with columns **Referencia** and **Cantidad**, validate all rows server-side, and allow adding all valid rows to the cart in a single user action (US-11 CA3, RF-019 verification).

#### Scenario: Ten valid references add ten cart lines

- **WHEN** the user uploads an Excel file with 10 rows of valid published references and quantities
- **THEN** the summary shows 10 rows with status ok
- **AND** confirming add-to-cart increases the cart by 10 distinct products (or merged quantities per product) in one operation

#### Scenario: Invalid reference row is reported

- **WHEN** a row contains reference UNKNOWN-999 not in the catalog
- **THEN** that row is marked not found in the import summary
- **AND** it is not added to the cart unless the user uses the uncatalogued flow

#### Scenario: Wildcard SKU row is rejected

- **WHEN** a row references a wildcard catalog SKU excluded from public sale
- **THEN** the row is marked wildcard and excluded from batch add

#### Scenario: Malformed Excel returns error

- **WHEN** the uploaded file has no sheet with Referencia and Cantidad headers
- **THEN** the API returns a descriptive error and no cart mutation occurs

### Requirement: Uncatalogued reference free-text request

When lookup fails, the UI SHALL offer a free-text area to describe an uncatalogued article request with quantity (US-11 CA4). The request MUST NOT add a catalog line to the cart.

#### Scenario: Not found shows uncatalogued form

- **WHEN** lookup returns not_found for a reference
- **THEN** the UI shows a message that the reference is not in the catalog
- **AND** a free-text field and save action for an uncatalogued request

#### Scenario: Uncatalogued requests attach to checkout

- **WHEN** the user saves an uncatalogued request and later completes checkout prepare
- **THEN** the order observations include the uncatalogued request text
- **AND** no cart line is created for that request

### Requirement: Quick order add API validates before client cart mutation

`POST /api/intranet/quick-order/add` SHALL validate each item (published, non-wildcard, resolvable slug), resolve B2B `PriceQuote`, and return additions for client `addItems` without trusting client-side SKU resolution.

#### Scenario: Server rejects wildcard on add

- **WHEN** the add request includes a wildcard SKU
- **THEN** the response excludes that item with error detail
- **AND** other valid items in the same request may still be returned as additions

#### Scenario: Pack quantity rounding matches PDP

- **WHEN** the product has pack unit greater than 1 and the user requests quantity 3
- **THEN** the added quantity is rounded up to the next pack multiple per storefront pack rules

### Requirement: Quick order template download

The quick order page SHALL provide a download link to an example Excel template with headers **Referencia** and **Cantidad**.

#### Scenario: Template download

- **WHEN** the user activates download template
- **THEN** a file with the correct column headers is downloaded
