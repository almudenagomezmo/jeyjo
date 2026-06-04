## MODIFIED Requirements

### Requirement: B2C payment method selection UI RF-014

For B2C segment checkout, the review step SHALL offer selectable payment methods card, Bizum, PayPal, Apple Pay, Google Pay, and bank transfer filtered by CMS payment settings, and SHALL initiate the corresponding payment flow after order creation.

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

## ADDED Requirements

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
