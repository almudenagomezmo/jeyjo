# Storefront B2B quick order

## Purpose

B2B intranet quick order by reference and Excel upload (RF-019, US-11, change #24).

## Requirements

### Requirement: Quick order page replaces intranet scaffold

The storefront SHALL render a production quick order experience at `/intranet/pedido-rapido` for validated B2B customers, including single-reference entry, live preview, Excel import, and non-catalog requests. The page SHALL NOT use `IntranetScaffoldPage` or a "Próximamente" badge once this capability is delivered.

#### Scenario: Validated B2B user sees quick order form

- **WHEN** a validated B2B user opens `/intranet/pedido-rapido`
- **THEN** the page title is "Pedido rápido"
- **AND** inputs for reference and quantity are visible
- **AND** an Excel upload control is visible

#### Scenario: Unauthenticated user cannot access quick order APIs

- **WHEN** `GET /api/intranet/quick-order/lookup` is called without a validated B2B session
- **THEN** the response status is 401 or 403

### Requirement: Reference lookup resolves SKU OEM or EAN

The system SHALL resolve a trimmed reference string against published, non-wildcard Payload products by matching `skuErp`, `oemRef`, or `ean` (RF-013). Lookup SHALL run server-side and return product preview fields and a B2B `PriceQuote` for the session customer.

#### Scenario: Lookup by wholesaler SKU succeeds

- **WHEN** lookup is called with a reference equal to a product `skuErp`
- **THEN** the response includes product name, thumbnail URL, slug, `packUnit`, and current B2B net unit price

#### Scenario: Lookup by OEM reference succeeds

- **WHEN** lookup is called with a reference equal to a product `oemRef` and not the SKU
- **THEN** the same product is returned as for SKU lookup

#### Scenario: Lookup by EAN succeeds

- **WHEN** lookup is called with a reference equal to a product `ean`
- **THEN** the same product is returned as for SKU lookup

#### Scenario: Unknown reference returns not found

- **WHEN** lookup is called with a reference that matches no published non-wildcard product
- **THEN** the response status is 404
- **AND** the UI can offer non-catalog request entry (US-11 CA4)

#### Scenario: Wildcard SKU is not resolvable

- **WHEN** lookup is called with wildcard SKU `9000000001` or a product marked `isWildcard`
- **THEN** the response status is 404

### Requirement: Live preview before add to cart US-11 CA2

The quick order UI SHALL debounce reference input and call lookup to show product name, image, and current B2B price before the user confirms add to cart.

#### Scenario: Preview updates after valid reference

- **WHEN** the user types a valid reference and pauses input
- **THEN** the preview panel shows name, image, and labeled current price
- **AND** the add button is enabled

#### Scenario: Preview clears on empty reference

- **WHEN** the user clears the reference field
- **THEN** the preview panel is hidden or reset

### Requirement: Add single reference line to cart

The user SHALL add a resolved product to the client cart with a chosen quantity. Server validation SHALL mirror purchase-history repeat semantics (published product, non-wildcard, positive quantity, pack rounding on client).

#### Scenario: Add to cart returns slug and opens minicart

- **WHEN** the user submits a valid reference with quantity 12
- **AND** `POST /api/intranet/quick-order/add-to-cart` succeeds
- **THEN** the response lists `{ productId: slug, qty, quote }` additions
- **AND** the client merges lines via `addItems` and MAY open the minicart

#### Scenario: Add rejects invalid quantity

- **WHEN** add-to-cart is called with quantity 0 or negative
- **THEN** the response status is 400

### Requirement: Excel upload adds multiple catalog lines US-11 CA3

The user SHALL upload a spreadsheet with columns **Referencia** and **Cantidad** (header aliases accepted: `Reference`, `Ref`, `Cantidad`, `Qty`, `Quantity`). The server SHALL parse the file, validate each row, and allow adding all valid rows to the cart in one action. Ten valid references in one file SHALL produce ten cart lines when the user confirms (RF-019 verification).

#### Scenario: Valid Excel rows previewed

- **WHEN** the user uploads a file with 10 rows of valid published references and positive quantities
- **AND** `POST /api/intranet/quick-order/validate-batch` is called with the file
- **THEN** the response marks 10 rows as `ok` with resolved slugs
- **AND** rows with unknown references are marked `not_found`

#### Scenario: Batch add merges all valid rows

- **WHEN** the user confirms add from a validate-batch result with 10 `ok` rows
- **AND** `POST /api/intranet/quick-order/add-to-cart` receives those items
- **THEN** the cart receives 10 distinct or merged lines per slug/qty rules

#### Scenario: Excel over row limit is rejected

- **WHEN** a file contains more than 200 data rows
- **THEN** validate-batch returns 400 with a clear limit message

#### Scenario: Downloadable template provided

- **WHEN** the user activates "Descargar plantilla"
- **THEN** the browser downloads a two-column Excel template with headers Referencia and Cantidad

### Requirement: Non-catalog reference requests US-11 CA4

When lookup fails, the UI SHALL offer a free-text field to register a **referencia no catalogada** request. Requests SHALL be stored in browser session storage for the intranet session and SHALL NOT create cart lines or public wildcard SKUs.

#### Scenario: User submits non-catalog request after failed lookup

- **WHEN** lookup returns not found for reference `ABC-UNKNOWN`
- **AND** the user enters description text and confirms
- **THEN** a pending request `{ reference, note, createdAt }` is stored client-side
- **AND** the UI lists the pending request in the quick order page

#### Scenario: Multiple non-catalog requests accumulate

- **WHEN** the user adds two non-catalog requests in the same session
- **THEN** both appear in the pending list until removed or consumed at checkout

### Requirement: Quick order uses B2B pricing and catalog guards

All resolved lines SHALL use the pricing engine for the authenticated B2B customer (RF-007, RF-011). Wildcard and draft products SHALL never be added.

#### Scenario: Price quote matches intranet B2B mode

- **WHEN** lookup succeeds for a B2B validated customer
- **THEN** the returned quote uses B2B customer group rules
- **AND** the UI labels the amount as current net price consistent with portal pricing copy
