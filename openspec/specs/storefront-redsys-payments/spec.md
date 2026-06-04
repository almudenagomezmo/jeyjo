# Storefront Redsys payments

## Purpose

Redsys TPV integration for B2C card and Bizum payments: signed payment initiation, return URL handling, server-to-server webhook confirmation, and periodic reconciliation (RI-006, CA-CHECKOUT-003).

## Requirements

### Requirement: Redsys payment initiation RI-006

The storefront SHALL expose a server-only API that, given a Payload order in `pending_payment` with payment method card or Bizum, builds signed Redsys TPV parameters (HMAC SHA256) and returns redirect form fields or URL for the Redsys virtual terminal.

#### Scenario: Card payment init for valid order

- **WHEN** `POST /api/payments/redsys/init` is called with a valid `orderId` for a B2C order in `pending_payment` and method `card`
- **THEN** the response includes signed `Ds_MerchantParameters` and endpoint URL for Redsys test or production environment
- **AND** the merchant order reference matches the Payload `orderNumber`

#### Scenario: Init rejected for already paid order

- **WHEN** init is called for an order with `paymentStatus` authorized
- **THEN** the response status is 409 with an already-paid error

#### Scenario: Init amount matches order total

- **WHEN** init builds Redsys parameters
- **THEN** `Ds_Merchant_Amount` equals the order total in euro cents computed server-side from Payload
- **AND** the client-supplied amount is ignored

### Requirement: Redsys return URLs OK and KO

The storefront SHALL expose public return routes after Redsys redirect that verify the response signature and show payment outcome to the customer.

#### Scenario: Successful return displays confirmation

- **WHEN** the customer returns from Redsys to the OK URL with a valid signed authorized response
- **THEN** the user sees order confirmation with paid status or a pending-finalization message if webhook has not yet processed
- **AND** the cart remains empty

#### Scenario: Failed return offers retry

- **WHEN** the customer returns to the KO URL or with a denied Redsys response
- **THEN** the user sees the denial reason when available
- **AND** a retry action re-initiates Redsys payment for the same order without creating a duplicate order

### Requirement: Redsys online notification webhook

The storefront SHALL accept Redsys server-to-server notifications at a dedicated public endpoint, verify signature, persist idempotently, and update the Payload order on authorized payment.

#### Scenario: Authorized webhook confirms order CA-CHECKOUT-003

- **WHEN** Redsys posts a valid notification with authorized response code for order total 45.00 €
- **THEN** the Payload order `status` becomes `confirmed`
- **AND** `paymentStatus` is `authorized`
- **AND** gateway auth code and paid amount are stored

#### Scenario: Duplicate webhook is idempotent

- **WHEN** the same Redsys notification signature is received twice
- **THEN** the second request is acknowledged with HTTP 200
- **AND** the order is not updated twice

#### Scenario: Invalid signature rejected

- **WHEN** a notification arrives with an invalid HMAC signature
- **THEN** the response status is 400
- **AND** the order status is unchanged

### Requirement: Redsys Bizum via same TPV

Bizum B2C payments SHALL use the Redsys virtual terminal with Bizum pay method code, not a separate Bizum gateway.

#### Scenario: Bizum init sets pay method

- **WHEN** init is called with payment method `bizum`
- **THEN** Redsys parameters include Bizum-enabled pay method configuration
- **AND** the customer is redirected to Redsys Bizum flow

### Requirement: Periodic payment reconciliation RI-006

When the online notification is missing, the system SHALL provide a scheduled reconciliation job for Redsys card and Bizum orders stuck in `pending_payment` beyond a configurable threshold.

#### Scenario: Stale pending order flagged

- **WHEN** a B2C card order remains `pending_payment` for more than 24 hours after init
- **THEN** the reconciliation job records a review flag or attempts Redsys query when credentials allow
- **AND** staff can inspect the order in Payload admin
