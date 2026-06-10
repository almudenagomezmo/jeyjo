## MODIFIED Requirements

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

## ADDED Requirements

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
