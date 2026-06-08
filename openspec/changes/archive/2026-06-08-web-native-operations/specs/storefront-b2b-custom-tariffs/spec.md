## MODIFIED Requirements

### Requirement: Special prices table shows RF-020 columns

Each special price row SHALL display product image, SKU reference, description, minimum quantity when applicable, recommended sale price (P2), discount 1, discount 2, net agreed amount, validity end date, and status **Vigente** or **Caducado** (US-14 CA1, RF-020). Data SHALL be loaded from Supabase `special_prices` (mirrored from CMS) enriched with CMS catalog fields, not from `ErpPricingReader`, when `webNativeMode` is true.

#### Scenario: Row shows required columns from Supabase

- **WHEN** staff created a special price for SKU REF-004 in CMS and a validated B2B customer opens `/intranet/precios`
- **THEN** the row shows image, reference REF-004, description, recommended price, discounts, net price, validity date, and status

#### Scenario: Minimum quantity shown when CMS provides it

- **WHEN** the special price row includes `minQty` 10 in Supabase
- **THEN** the row displays quantity 10 in the quantity column

#### Scenario: Minimum quantity column empty when not applicable

- **WHEN** the special price has no `minQty`
- **THEN** the quantity column shows an em dash or is omitted per layout rules

### Requirement: Group offers section shows active offers for customer group

The page SHALL include a separate **Ofertas de grupo activas** block listing active group offers from Supabase `group_offers` that apply to the authenticated customer's group (US-14 CA4).

#### Scenario: Group offer visible for customer group

- **WHEN** staff created an active group offer for group 02 on SKU REF-003 and the customer belongs to group 02
- **THEN** REF-003 appears in the group offers block with offer net price and validity

#### Scenario: Group offer for other group hidden

- **WHEN** a group offer applies only to group 03
- **THEN** it is not shown to a group 02 customer

### Requirement: Wildcard SKUs excluded from custom tariffs

Special price rows for wildcard or comodín catalog references (RF-006) SHALL NOT appear in the custom tariffs list.

#### Scenario: Wildcard SKU omitted

- **WHEN** Supabase includes special price for SKU 9000000001 marked wildcard in catalog
- **THEN** that SKU does not appear in the special prices table

### Requirement: Empty state when customer has no special prices

When the authenticated company has no rows in `special_prices`, the page SHALL show an explanatory empty state and still render the group offers block when offers exist.

#### Scenario: No special prices empty state

- **WHEN** `special_prices` returns zero rows for the customer id
- **THEN** the special prices table shows an empty state explaining no pactadas prices are on file
- **AND** group offers section still renders if applicable
