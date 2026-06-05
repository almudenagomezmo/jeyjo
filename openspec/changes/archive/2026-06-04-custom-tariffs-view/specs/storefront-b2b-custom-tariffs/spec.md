## ADDED Requirements

### Requirement: B2B custom tariffs page replaces precios scaffold

The storefront SHALL render a production custom tariffs view at `/intranet/precios` titled **Precios especiales**, replacing the portal scaffold empty state for validated B2B customers (RF-020, US-14).

#### Scenario: Validated B2B user sees tariffs table

- **WHEN** a validated B2B user opens `/intranet/precios`
- **THEN** a table of special prices and a group offers section are shown
- **AND** the "Próximamente" scaffold badge is not displayed

#### Scenario: Unauthenticated user cannot access tariffs API

- **WHEN** a request hits `/api/intranet/custom-tariffs` without a validated B2B session
- **THEN** the response status is 401 or 403

### Requirement: Special prices table shows RF-020 columns

Each special price row SHALL display product image, SKU reference, description, minimum quantity when applicable, recommended sale price (P2), discount 1, discount 2, net agreed amount, validity end date, and status **Vigente** or **Caducado** (US-14 CA1, RF-020).

#### Scenario: Row shows required columns

- **WHEN** custom tariffs load a special price for SKU REF-004
- **THEN** the row shows image, reference REF-004, description, recommended price, discounts, net price, validity date, and status

#### Scenario: Minimum quantity shown when ERP provides it

- **WHEN** the ERP special price includes `minQty` 10
- **THEN** the row displays quantity 10 in the quantity column

#### Scenario: Minimum quantity column empty when not applicable

- **WHEN** the ERP special price has no `minQty`
- **THEN** the quantity column shows an em dash or is omitted per layout rules

### Requirement: Validity status is computed server-side

The API SHALL classify each special price as **Vigente** when `validTo` is null or on or after the current calendar date in Europe/Madrid, and **Caducado** when `validTo` is before the current calendar date.

#### Scenario: Expired price shows Caducado

- **WHEN** a special price has `validTo` 2025-12-31 and today is 2026-06-04
- **THEN** the row status is **Caducado**

#### Scenario: Active price shows Vigente

- **WHEN** a special price has `validTo` 2026-12-31 and today is 2026-06-04
- **THEN** the row status is **Vigente**

### Requirement: Review request button only on expired prices

Rows with status **Caducado** SHALL show **Solicitar revisión de precio**. Rows with status **Vigente** SHALL NOT show the review button (US-14 CA2, CA3).

#### Scenario: Expired row shows review button

- **WHEN** a row has status **Caducado**
- **THEN** **Solicitar revisión de precio** is visible and enabled

#### Scenario: Active row hides review button

- **WHEN** a row has status **Vigente**
- **THEN** **Solicitar revisión de precio** is not rendered

#### Scenario: Review request creates B2B quote

- **WHEN** the user activates **Solicitar revisión de precio** for SKU REF-002
- **THEN** the server creates a B2B quote in Payload with status `requested` and observations containing `Renovación precio especial — REF-002`
- **AND** the UI shows a success confirmation

#### Scenario: Duplicate review within seven days is rejected

- **WHEN** the same customer submits a review request for the same SKU within seven days of a prior `requested` quote with the same SKU observation pattern
- **THEN** the API returns 409 with a clear message
- **AND** no duplicate quote is created

### Requirement: Group offers section shows active offers for customer group

The page SHALL include a separate **Ofertas de grupo activas** block listing active group offers that apply to the authenticated customer's group (US-14 CA4).

#### Scenario: Group offer visible for customer group

- **WHEN** the customer belongs to group 02 and an active group offer exists for group 02 on SKU REF-003
- **THEN** REF-003 appears in the group offers block with offer net price and validity

#### Scenario: Group offer for other group hidden

- **WHEN** a group offer applies only to group 03
- **THEN** it is not shown to a group 02 customer

### Requirement: Reference search and pagination

The custom tariffs API and UI SHALL support optional SKU reference search and paginate special prices with default page size 25.

#### Scenario: Reference filter narrows rows

- **WHEN** the user searches reference text REF-00
- **THEN** only special prices whose SKU contains REF-00 case-insensitively are returned

#### Scenario: Pagination returns next slice

- **WHEN** the user requests page 2 with page size 25
- **THEN** the next 25 special price rows are returned with filters unchanged

### Requirement: Wildcard SKUs excluded from custom tariffs

Special price rows for wildcard or comodín catalog references (RF-006) SHALL NOT appear in the custom tariffs list.

#### Scenario: Wildcard SKU omitted

- **WHEN** ERP data includes special price for SKU 9000000001 marked wildcard
- **THEN** that SKU does not appear in the special prices table

### Requirement: Empty state when customer has no special prices

When the authenticated company has no special prices from the ERP reader, the page SHALL show an explanatory empty state and still render the group offers block when offers exist.

#### Scenario: No special prices empty state

- **WHEN** `listSpecialPrices` returns zero rows for the customer ERP code
- **THEN** the special prices table shows an empty state explaining no pactadas prices are on file
- **AND** group offers section still renders if applicable
