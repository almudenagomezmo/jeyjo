## ADDED Requirements

### Requirement: Checkout discount line shows coupon identity RF-027

When checkout totals include a validated coupon discount, the review step totals column SHALL label the discount line with the coupon code and human-readable discount type using shared formatting, not a generic "Descuento" label alone.

#### Scenario: Review step shows coupon code and percent label

- **WHEN** checkout prepare succeeds with valid coupon BLOG5 at 5% off
- **THEN** the review totals show a discount line formatted as `Descuento (BLOG5 · 5%)`
- **AND** the amount matches the server-computed discount

#### Scenario: Review step shows code only when label missing

- **WHEN** a valid coupon code exists but CMS label is unavailable
- **THEN** the discount line shows `Descuento (CODE)` with the applied amount

### Requirement: Delivery step separates shipping address card

For home delivery and alternate saved address methods, the checkout delivery step SHALL show a dedicated **Dirección de envío** card after the delivery method selection, distinct from store pickup options.

#### Scenario: Home delivery shows billing address card

- **WHEN** the user selects ship to billing address
- **THEN** a **Dirección de envío** card displays the billing address summary
- **AND** copy indicates shipment goes to the billing address
- **AND** observations and continue action appear in that card

#### Scenario: Alternate address selection in shipping card

- **WHEN** the user selects ship to a saved alternate address
- **THEN** the **Dirección de envío** card lists saved addresses as radio options
- **AND** an empty address book links to `/cuenta/direcciones`

#### Scenario: Store pickup keeps compact delivery card

- **WHEN** the user selects store pickup Alfaro or Rincón de Soto
- **THEN** no separate shipping address card is shown
- **AND** observations and continue remain in the Entrega card

### Requirement: Checkout confirmation page shows full order summary

The storefront SHALL expose `/checkout/confirmacion?order=<orderNumber>` loading the Payload order and displaying order status, delivery method label, payment method when present, applied coupon, line-item table, subtotal, discount, shipping, total, and customer observations.

#### Scenario: Confirmation shows status delivery and lines

- **WHEN** place-order succeeds and the user lands on confirmation with a valid order number
- **THEN** the page shows human-readable order status and delivery labels
- **AND** a table lists product name, reference, quantity, unit price, and line total

#### Scenario: Confirmation shows coupon and discount breakdown

- **WHEN** the order stored a coupon code and totals reflect a discount
- **THEN** a coupon card shows the code and CMS discount label when available
- **AND** the totals block includes a formatted discount line and final total

#### Scenario: Confirmation shows customer observations

- **WHEN** the order includes non-empty customer notes
- **THEN** an observations section displays the stored text

#### Scenario: Invalid order number returns not found

- **WHEN** confirmation is requested with an unknown order number
- **THEN** the page responds with not found

### Requirement: Cart clears after place-order navigation is committed

Checkout place-order client flow SHALL defer cart and draft cleanup until the next navigation step is determined, preventing empty-cart redirect to `/cart` before confirmation or payment redirect.

#### Scenario: B2B or direct confirmation clears cart on navigation

- **WHEN** place-order succeeds without payment gateway redirect
- **THEN** the client navigates to confirmation before or as cart is cleared
- **AND** the user is not redirected to `/cart` due to an empty cart mid-flow

#### Scenario: Gateway redirect clears cart before leaving storefront

- **WHEN** place-order returns a payment redirect form or URL
- **THEN** cart and checkout draft are cleared immediately before submitting the redirect
