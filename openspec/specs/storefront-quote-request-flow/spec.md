# Storefront quote request flow

## Purpose

Storefront presupuesto request flow from cart and checkout (US-05, RF-015): `/presupuesto`, prepare/request APIs, and confirmation without payment.

## Requirements

### Requirement: Solicitar presupuesto available on cart and checkout US-05 CA1

The storefront SHALL expose an enabled **Solicitar presupuesto** control on `/cart` and on the checkout review step for all users (anonymous, pending, validated B2C, validated B2B) when the cart has at least one line.

#### Scenario: Cart CTA navigates to quote flow

- **WHEN** a user clicks **Solicitar presupuesto** on `/cart` with lines present
- **THEN** the browser navigates to the quote request flow at `/presupuesto`

#### Scenario: Checkout review offers quote alternative

- **WHEN** a user reaches checkout review with lines present
- **THEN** a secondary **Solicitar presupuesto** action is visible alongside order confirmation
- **AND** it navigates to `/presupuesto` without requiring payment method selection

#### Scenario: Empty cart cannot start quote

- **WHEN** a user opens `/presupuesto` with no cart lines
- **THEN** the browser is redirected to `/cart`

### Requirement: Quote request flow captures contact and delivery context

The `/presupuesto` flow SHALL collect guest email when unauthenticated, optional observations up to 500 characters, and optional delivery method using the same delivery options as checkout when the user is authenticated with saved addresses.

#### Scenario: Guest must provide email

- **WHEN** an unauthenticated user submits a quote request without email
- **THEN** the API returns 400 with a validation error

#### Scenario: Authenticated user skips guest email requirement

- **WHEN** a logged-in customer submits a quote request
- **THEN** contact email is taken from the customer record
- **AND** `customerRef` is stored on the quote

### Requirement: Server-side quote prepare and request APIs

The storefront SHALL expose server APIs that recompute cart pricing and shipping, then create a Payload quote via the CMS storefront endpoint.

#### Scenario: Prepare rejects empty cart

- **WHEN** `POST /api/quotes/prepare` is called with zero lines
- **THEN** the response status is 400

#### Scenario: Request quote creates Payload quote

- **WHEN** `POST /api/quotes/request` succeeds with valid prepare token
- **THEN** a Payload quote exists with unique `quoteNumber`, line snapshots, totals, and `status` `requested`

#### Scenario: Successful request clears cart and shows confirmation

- **WHEN** quote request succeeds
- **THEN** the client cart store is cleared
- **AND** the user sees a confirmation view with the quote number

### Requirement: Authenticated customers see their quotes US-05 CA2

The storefront SHALL provide `/cuenta/presupuestos` listing quotes linked to the logged-in customer's `customerRef` with quote number, date, status label, and total.

#### Scenario: Customer lists own quotes

- **WHEN** an authenticated customer opens `/cuenta/presupuestos`
- **THEN** only quotes with matching `customerRef` are shown

#### Scenario: Customer cannot see other customer quotes

- **WHEN** a customer requests another quote id via API
- **THEN** access is denied or empty

### Requirement: Quote flow uses pricing engine RF-011

Quote line totals SHALL be computed from `PriceQuote` values for cart SKUs using checkout segment rules, not demo product stubs.

#### Scenario: Subtotal matches batch quotes

- **WHEN** quote prepare runs for two cart lines with resolved quotes
- **THEN** persisted line snapshots reflect the same unit prices as checkout prepare for that segment
