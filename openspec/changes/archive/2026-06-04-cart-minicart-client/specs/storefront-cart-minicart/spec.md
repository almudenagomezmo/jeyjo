# Storefront cart and minicart

## Purpose

Client-side persistent cart, floating minicart panel, and full `/cart` page with real pricing and shipping preview (US-03 CA3, alcance §1.3, RF-011, RF-013 preview).

## ADDED Requirements

### Requirement: Cart state persists in browser local storage

The storefront SHALL maintain cart lines in a client-side store persisted to `localStorage` with actions to add, update quantity, remove, and clear lines. Each line SHALL store a product identifier (canonical slug) and quantity.

#### Scenario: Cart survives page reload

- **WHEN** a user adds a product to the cart and reloads the page
- **THEN** the cart store restores the same lines from local storage

#### Scenario: Duplicate add merges quantity

- **WHEN** a user adds a product that is already in the cart
- **THEN** the existing line quantity increases by the added amount instead of creating a duplicate row

### Requirement: Header cart badge shows hydrated item count

The sticky header cart icon SHALL display a numeric badge equal to the sum of line quantities when the client has hydrated and the count is greater than zero.

#### Scenario: Badge hidden before hydration

- **WHEN** the page is server-rendered with items in persisted cart storage
- **THEN** the badge is not shown until client hydration completes

#### Scenario: Badge updates on add

- **WHEN** a user adds quantity 12 of a product from the PDP
- **THEN** the header badge increases by 12 without a full page navigation

### Requirement: Minicart slide-over panel from header

The storefront SHALL provide a slide-over minicart panel opened from the header cart control, showing line items, per-line totals, subtotal, shipping preview banner, and links to the full cart page. The panel SHALL close via overlay click, close button, or Escape key and SHALL lock body scroll while open.

#### Scenario: Open minicart from header

- **WHEN** a user clicks the cart icon in the header
- **THEN** a right-side panel opens listing current cart lines or an empty-state message

#### Scenario: Close minicart with Escape

- **WHEN** the minicart is open and the user presses Escape
- **THEN** the panel closes and body scroll is restored

### Requirement: US-03 CA3 minicart updates immediately on add to cart

When a product is added to the cart from PDP, PLP product card, or PLP quick view, the minicart SHALL open (unless explicitly suppressed) and SHALL immediately show the new or updated line and an updated subtotal without requiring navigation.

#### Scenario: PDP add opens minicart with new line

- **WHEN** a user adds a product from the PDP buy box with default add-to-cart behavior
- **THEN** the minicart opens showing that product line and updated subtotal

#### Scenario: PLP quick view add updates minicart

- **WHEN** a user adds a product from PLP quick view
- **THEN** the minicart reflects the new line and subtotal without leaving the listing page

### Requirement: Cart line prices from pricing engine RF-011

Cart and minicart line totals SHALL be computed from `PriceQuote` values returned by `/api/pricing/batch` for the cart product SKUs, using the active header price mode (B2C/B2B toggle) and existing dual-price presentation helpers.

#### Scenario: Subtotal uses batch quotes

- **WHEN** the minicart displays two lines with resolved batch quotes
- **THEN** each line total equals unit price for the active mode multiplied by quantity, rounded to two decimals

#### Scenario: Price mode toggle refreshes cart totals

- **WHEN** a user switches the header price mode from B2C to B2B while the minicart is open
- **THEN** displayed line prices and subtotal update to B2B presentation rules

### Requirement: Cart resolves product metadata from CMS not demo data

The cart summary layer SHALL resolve product display fields (name, reference, image, pack unit) from published CMS catalog snapshots by cart line identifiers, and SHALL NOT depend on `lib/data/products.ts` demo fixtures for cart rendering.

#### Scenario: Line shows CMS product name

- **WHEN** a cart line references a published product slug from CMS
- **THEN** the minicart and `/cart` page show that product's CMS title and reference

#### Scenario: Unpublished product shows removable orphan line

- **WHEN** a cart line references a product no longer publicly available
- **THEN** the UI shows an unavailable-product message with a remove action and does not block other lines

### Requirement: Pack unit enforced in cart quantity controls US-03 CA2

Quantity steppers in the minicart and full cart page SHALL use `packUnit` as minimum and step. Invalid quantities SHALL round up to the next pack multiple with the US-03 CA2 notice.

#### Scenario: Minicart qty step uses pack unit

- **WHEN** a cart line product has `packUnit` 12
- **THEN** increment and decrement in the minicart change quantity by 12

#### Scenario: Invalid qty rounds up with notice

- **WHEN** a user enters quantity 5 for a product with `packUnit` 12 in the cart stepper
- **THEN** quantity adjusts to 12 and the pack-notice message is shown

### Requirement: Shipping preview banner in minicart and cart RF-013

The minicart footer and full cart page SHALL show a shipping preview banner: free shipping when subtotal meets the segment threshold (B2C ≥ 39€, B2B ≥ 10€ v1 constants), otherwise the remaining amount to free shipping for the active price mode.

#### Scenario: B2C below threshold shows amount remaining

- **WHEN** price mode is B2C and subtotal is 30€
- **THEN** the banner shows how much more is needed for free shipping

#### Scenario: B2C at threshold shows free shipping

- **WHEN** price mode is B2C and subtotal is 40€
- **THEN** the banner indicates free shipping applies

### Requirement: Full cart page at /cart

The storefront SHALL provide a `/cart` route listing all cart lines with quantity controls, subtotal, shipping preview, discount coupon input (demo validation until marketing module), and primary CTAs linking toward checkout preparation (checkout flow itself is out of scope).

#### Scenario: Empty cart page

- **WHEN** a user opens `/cart` with no lines
- **THEN** an empty-state message and link to the catalog are shown

#### Scenario: Cart page lists all lines

- **WHEN** a user opens `/cart` with multiple lines
- **THEN** all lines appear with the same pricing and pack rules as the minicart
