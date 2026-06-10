# Storefront checkout and shipping

## Purpose

B2C/B2B checkout flow with delivery methods, shipping cost rules (RF-013), payment method selection UI (RF-014), server-side prepare/place-order APIs, and guest email capture (US-04).

## Requirements

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

The checkout review step SHALL compute shipping cost from segment rules loaded from `GET /api/system/config` (CMS `systemSettings` global) applied to the discounted merchandise subtotal, with v1 defaults when CMS is unavailable (B2C threshold 39€ cost 5€ IVA included; B2B threshold 10€ cost 2.50€), and display normative copy per segment.

#### Scenario: B2C below threshold CA-CHECKOUT-001

- **WHEN** checkout segment is B2C and merchandise subtotal after coupon is 38.00 € and CMS config uses default B2C rules
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

#### Scenario: Staff-configured B2C threshold applied

- **WHEN** CMS `systemSettings` sets B2C free-shipping threshold to 45€
- **AND** checkout segment is B2C with merchandise subtotal 44.00 €
- **THEN** shipping cost is the configured B2C paid cost from system config
- **AND** subtotal 46.00 € yields free shipping

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

For B2C segment checkout, the review step SHALL offer selectable payment methods card, Bizum, PayPal, Apple Pay, Google Pay, and bank transfer filtered by CMS payment settings, rendered as a card-style radio list with brand marks and short descriptions, ordered card → Bizum → PayPal → wallets → transfer when enabled, and SHALL initiate the corresponding payment flow after order creation.

#### Scenario: B2C selects card and enters Redsys

- **WHEN** a B2C user selects card and confirms the order
- **THEN** the draft order stores payment method card
- **AND** order status is `pending_payment`
- **AND** the client is redirected to Redsys TPV or auto-submits the signed payment form

#### Scenario: B2C selects bank transfer

- **WHEN** a B2C user selects bank transfer and confirms
- **THEN** the order status is `pending_payment`
- **AND** the user sees transfer instructions with order reference and configured IBAN
- **AND** no card gateway is invoked

#### Scenario: B2C selects PayPal

- **WHEN** a B2C user selects PayPal and confirms
- **THEN** the order status is `pending_payment`
- **AND** the client is redirected to PayPal approval flow

#### Scenario: Payment options show brand marks

- **WHEN** a B2C user opens the review step with multiple methods enabled
- **THEN** each payment option card shows a recognizable brand mark (Visa/Mastercard for card, Bizum, PayPal, Apple Pay, Google Pay, or bank transfer icon)
- **AND** the selected card uses primary brand border and soft background consistent with delivery method selection

#### Scenario: Disabled CMS methods are omitted

- **WHEN** `bizumEnabled` is false in payment settings
- **THEN** Bizum is absent from the payment option list

### Requirement: B2B payment method read-only RF-014 CA-CHECKOUT-006

For validated B2B segment checkout, the review step SHALL display the customer's `default_payment_method` as read-only under a **Forma de pago acordada** heading styled like other checkout section titles, and SHALL NOT offer immediate payment gateways.

#### Scenario: B2B giro preselected and locked

- **WHEN** customer `default_payment_method` is "Giro a 30 días"
- **THEN** checkout shows that label preselected
- **AND** the user cannot select card, Bizum, or PayPal
- **AND** order status is `pending_confirmation`

### Requirement: Optional order observations

The checkout delivery step SHALL include an optional observations field up to 500 characters stored on the order. When the user has pending non-catalog quick order requests in session storage, the checkout UI SHALL prefill or append a structured block to observations (prefix `Referencias no catalogadas:`) so Jeyjo staff receive them on the order document. The combined text MUST NOT exceed 500 characters; if it would exceed, the UI SHALL warn and require the user to shorten manual observations or remove pending requests.

#### Scenario: Observations persisted

- **WHEN** the user enters observations text and places the order
- **THEN** the Payload order document stores the same text

#### Scenario: Non-catalog requests merged at checkout

- **WHEN** the user has two pending non-catalog requests from quick order
- **AND** opens checkout delivery step
- **THEN** the observations field includes both references in the structured block
- **AND** the user can edit before place order

#### Scenario: Place order clears consumed non-catalog requests

- **WHEN** place order succeeds with merged non-catalog text in observations
- **THEN** pending non-catalog requests are removed from session storage

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

### Requirement: Post-order payment step for B2C

After successful place-order for B2C gateway methods, the storefront SHALL continue to payment without requiring the user to re-enter cart or delivery data.

#### Scenario: Place order returns payment next step

- **WHEN** place-order succeeds for B2C with method card
- **THEN** the response includes a payment next-step descriptor with type redirect
- **AND** the checkout UI proceeds to payment automatically

#### Scenario: Guest can complete payment

- **WHEN** a guest B2C user places an order with a gateway method
- **THEN** the user can complete Redsys or PayPal payment without logging in
- **AND** return URLs resolve the order by secure reference

### Requirement: PayPal B2C payment RF-014

PayPal SHALL be available as a B2C payment method using PayPal Checkout server integration independent of the Redsys redirect flow.

#### Scenario: PayPal return captures payment

- **WHEN** the customer approves PayPal payment and returns to the storefront
- **THEN** the server captures the PayPal order
- **AND** the Payload order moves to `confirmed` with `gateway` paypal

### Requirement: Guest email capture

Guest B2C checkout SHALL require a valid email before place order and SHALL store it on the order as guest contact.

#### Scenario: Missing guest email blocked

- **WHEN** an unauthenticated user attempts place order without email
- **THEN** the API returns 400 with a validation error

### Requirement: Checkout review offers solicitar presupuesto US-05 CA1

The checkout review step SHALL display a secondary **Solicitar presupuesto** action alongside order confirmation when the cart has lines and quotes are enabled. Selecting it SHALL navigate to `/presupuesto` without completing payment or place-order.

#### Scenario: Review step shows presupuesto action

- **WHEN** a user reaches checkout review with lines present and quotes enabled
- **THEN** **Solicitar presupuesto** is visible
- **AND** it does not require a payment method selection

#### Scenario: Presupuesto navigation preserves cart

- **WHEN** the user clicks **Solicitar presupuesto** from checkout review
- **THEN** the browser navigates to `/presupuesto`
- **AND** cart lines remain until quote request succeeds

### Requirement: B2B subuser checkout respects orders permission and approval flag

B2B checkout place-order SHALL require `orders` permission for `b2b_subuser` sessions and SHALL branch order status per `storefront-b2b-order-approval`.

#### Scenario: Subuser without orders permission cannot place order

- **WHEN** a subuser with `orders: false` calls checkout place-order
- **THEN** the response status is 403

#### Scenario: Subuser with approval required creates pending company order

- **WHEN** a subuser with `orders: true` and `ordersRequireApproval: true` completes place-order
- **THEN** the created order status is `pending_company_approval`
- **AND** the response message indicates approval is required before Jeyjo processing

### Requirement: Checkout totals use real coupon validation RF-027

The checkout prepare and place-order server paths SHALL compute merchandise discount using `coupon-validation-engine` instead of demo coupons, and SHALL pass the validated `couponCode` and `discount` into order creation.

#### Scenario: Prepare rejects invalid coupon

- **WHEN** prepare is called with an expired coupon code
- **THEN** the response status is 400 with coupon error detail

#### Scenario: Order stores validated coupon code

- **WHEN** place-order succeeds with valid coupon BLOG5
- **THEN** the Payload order `couponCode` field is `BLOG5`
- **AND** order totals reflect the server-computed discount

### Requirement: Shipping uses post-coupon merchandise subtotal

Shipping cost rules SHALL apply to merchandise subtotal after coupon discount, consistent with existing RF-013 scenarios.

#### Scenario: B2C below threshold after coupon

- **WHEN** checkout segment is B2C and merchandise subtotal after coupon is 38.00 €
- **THEN** the shipping line shows "Gastos de envío: 5,00 € (IVA incluido)"
- **AND** order total is 43.00 €

### Requirement: Checkout emits GA4 begin_checkout when flow starts

When GA4 is enabled, entering the checkout flow with a non-empty cart SHALL emit a GA4 `begin_checkout` event once per checkout attempt with cart value and items, per **RF-028**.

#### Scenario: User opens checkout with items

- **WHEN** GA4 is enabled and the user navigates to checkout with two cart lines
- **THEN** a `begin_checkout` event is sent with aggregate value and two items

#### Scenario: Empty cart redirected without begin_checkout

- **WHEN** the user reaches checkout with an empty cart and is redirected away
- **THEN** no `begin_checkout` event is sent

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

### Requirement: Review step separates order lines and payment selection

The checkout review step SHALL use distinct cards for order line review and payment selection: **Revisión del pedido** (product table and back-to-delivery action) and **Forma de pago** (B2C selector or B2B read-only block with confirm action).

#### Scenario: Review shows two cards for B2C

- **WHEN** a B2C user reaches the review step
- **THEN** a card titled **Revisión del pedido** lists cart lines
- **AND** a separate card titled **Forma de pago** contains the payment selector and confirm button

#### Scenario: B2B review shows agreed payment card

- **WHEN** a validated B2B user reaches the review step
- **THEN** the payment card shows **Forma de pago acordada** as section title
- **AND** the confirm action remains in that card

### Requirement: Contextual confirm label by payment method

The checkout review confirm button SHALL display method-specific copy for B2C when a payment method is selected (e.g. pay with card, Bizum, PayPal, Apple Pay, Google Pay) and generic **Confirmar pedido** for bank transfer and B2B.

#### Scenario: Bizum selection updates CTA

- **WHEN** a B2C user selects Bizum on the review step
- **THEN** the primary button label indicates paying with Bizum

#### Scenario: Transfer keeps generic confirm

- **WHEN** a B2C user selects bank transfer
- **THEN** the primary button label is **Confirmar pedido**
