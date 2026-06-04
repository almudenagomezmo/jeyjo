## ADDED Requirements

### Requirement: Checkout route with maximum two steps US-04 CA1

The storefront SHALL expose `/checkout` for non-empty carts, completing delivery selection and order review in at most two visible steps (delivery, then review and payment selection).

#### Scenario: Empty cart redirects to cart page

- **WHEN** a user opens `/checkout` with no cart lines
- **THEN** the browser is redirected to `/cart`

#### Scenario: Two-step flow completes without extra pages

- **WHEN** a user with items in the cart completes delivery and proceeds to review
- **THEN** the user can confirm the order from the review step without navigating to a third checkout page

### Requirement: Delivery methods US-04 CA2

The checkout delivery step SHALL let the user choose exactly one of: ship to default billing address, ship to a saved alternate address, or pickup at store Alfaro or Rincón de Soto.

#### Scenario: Home delivery uses billing address

- **WHEN** the user selects ship to billing address
- **THEN** the order snapshot uses the authenticated customer's billing fields from `customers`
- **AND** pickup store fields are empty

#### Scenario: Alternate saved address

- **WHEN** the user selects a saved `customer_addresses` row
- **THEN** the order snapshot stores that address id and copied line fields

#### Scenario: Store pickup Alfaro

- **WHEN** the user selects pickup at Alfaro
- **THEN** the delivery method is `pickup_alfaro`
- **AND** shipping cost for the order is 0

#### Scenario: Store pickup Rincón de Soto

- **WHEN** the user selects pickup at Rincón de Soto
- **THEN** the delivery method is `pickup_rincon`
- **AND** shipping cost for the order is 0

### Requirement: Shipping cost line RF-013 in checkout

The checkout review step SHALL compute shipping cost from segment rules (B2C threshold 39€ cost 5€ IVA included; B2B threshold 10€ cost 2.50€) applied to the discounted merchandise subtotal, and display normative copy per segment.

#### Scenario: B2C below threshold CA-CHECKOUT-001

- **WHEN** checkout segment is B2C and merchandise subtotal after coupon is 38.00 €
- **THEN** the shipping line shows "Gastos de envío: 5,00 € (IVA incluido)"
- **AND** order total is 43.00 €

#### Scenario: B2C free shipping CA-CHECKOUT-002

- **WHEN** checkout segment is B2C and merchandise subtotal is 40.00 €
- **THEN** the shipping line shows "Envío gratuito"
- **AND** shipping cost is 0

#### Scenario: B2B below threshold management fee

- **WHEN** checkout segment is B2B and merchandise subtotal is 8.00 €
- **THEN** shipping cost is 2.50 €
- **AND** the UI labels it as minimum management fee per RF-013 B2B rules

#### Scenario: B2B free shipping at threshold

- **WHEN** checkout segment is B2B and merchandise subtotal is 12.00 €
- **THEN** shipping cost is 0
- **AND** the UI indicates free shipping for the B2B segment

### Requirement: Checkout segment from authenticated session

The checkout SHALL derive B2C vs B2B segment from `getCustomerContext` and `pricingCustomerGroup`, not from the manual header price toggle alone.

#### Scenario: Validated B2B uses B2B segment

- **WHEN** a validated B2B customer completes checkout
- **THEN** line prices and shipping rules use B2B mode
- **AND** order `origin` is `b2b`

#### Scenario: Pending registration uses B2C segment

- **WHEN** an authenticated user has `validated_at` IS NULL
- **THEN** checkout uses B2C segment and `origin` b2c

#### Scenario: Guest uses B2C segment

- **WHEN** no user is authenticated
- **THEN** checkout requires a contact email
- **AND** segment is B2C

### Requirement: B2C payment method selection UI RF-014

For B2C segment checkout, the review step SHALL offer selectable payment methods card, Bizum, PayPal, and bank transfer without executing gateway charges in this change.

#### Scenario: B2C selects card

- **WHEN** a B2C user selects card and confirms
- **THEN** the draft order stores payment method card
- **AND** order status is `pending_payment`

### Requirement: B2B payment method read-only RF-014 CA-CHECKOUT-006

For validated B2B segment checkout, the review step SHALL display the customer's `default_payment_method` as read-only and SHALL NOT offer immediate payment gateways.

#### Scenario: B2B giro preselected and locked

- **WHEN** customer `default_payment_method` is "Giro a 30 días"
- **THEN** checkout shows that label preselected
- **AND** the user cannot select card, Bizum, or PayPal
- **AND** order status is `pending_confirmation`

### Requirement: Optional order observations

The checkout delivery step SHALL include an optional observations field up to 500 characters stored on the order.

#### Scenario: Observations persisted

- **WHEN** the user enters observations text and places the order
- **THEN** the Payload order document stores the same text

### Requirement: Server-side checkout prepare and place order

The storefront SHALL expose authenticated or guest-safe server APIs that recompute cart pricing and shipping, then create a Payload `orders` document with line items and checkout snapshots.

#### Scenario: Prepare rejects empty cart

- **WHEN** `POST /api/checkout/prepare` is called with zero lines
- **THEN** the response status is 400

#### Scenario: Place order creates Payload order

- **WHEN** `POST /api/checkout/place-order` succeeds with valid prepare token
- **THEN** a Payload order exists with unique `orderNumber`, lines, totals, shipping method, and customer reference when logged in

#### Scenario: Place order redirects to confirmation

- **WHEN** place order succeeds
- **THEN** the user sees a confirmation view with order number
- **AND** the client cart store is cleared

### Requirement: Guest email capture

Guest B2C checkout SHALL require a valid email before place order and SHALL store it on the order as guest contact.

#### Scenario: Missing guest email blocked

- **WHEN** an unauthenticated user attempts place order without email
- **THEN** the API returns 400 with a validation error
