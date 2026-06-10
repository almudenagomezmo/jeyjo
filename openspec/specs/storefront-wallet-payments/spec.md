# Storefront wallet payments

## Purpose

Apple Pay and Google Pay wallet payment methods for B2C checkout, processed through Redsys wallet APIs (RF-014, alcance §1.10).

## Requirements

### Requirement: Wallet payment methods in B2C checkout RF-014

The B2C checkout review step SHALL offer Apple Pay and Google Pay as selectable options in the unified payment method card list when enabled in payment settings and supported by the browser or device, and configured in the Redsys merchant account.

#### Scenario: Apple Pay option visible on supported Safari

- **WHEN** a B2C user on a supported Apple Pay device opens checkout review
- **AND** `applePayEnabled` is true in payment settings
- **THEN** an Apple Pay option appears in the payment method list alongside card and Bizum

#### Scenario: Google Pay option visible on supported Chrome

- **WHEN** a B2C user on a browser supporting Payment Request API opens checkout review
- **AND** `googlePayEnabled` is true in payment settings
- **THEN** a Google Pay option appears in the payment method list

#### Scenario: Wallet hidden when disabled in backoffice

- **WHEN** `applePayEnabled` is false in payment settings
- **THEN** the Apple Pay option is not rendered regardless of device support

### Requirement: Wallet payments complete through Redsys

Apple Pay and Google Pay transactions SHALL be processed through Redsys wallet APIs so authorization and webhook handling reuse the same confirmation path as card payments.

#### Scenario: Wallet authorization confirms order

- **WHEN** a wallet payment is authorized successfully through Redsys
- **THEN** the Payload order transitions to `confirmed` with `gateway` redsys
- **AND** `paymentStatus` is `authorized`

#### Scenario: Wallet cancellation leaves order pending

- **WHEN** the user cancels the wallet sheet before authorization
- **THEN** the order remains `pending_payment`
- **AND** the user can choose another payment method

### Requirement: No card data stored for wallets

The system SHALL NOT persist primary account numbers or wallet cryptograms beyond what Redsys notification requires for reconciliation.

#### Scenario: Wallet flow stores only gateway references

- **WHEN** a wallet payment succeeds
- **THEN** stored payment fields are gateway transaction id, auth code, amount, and timestamp only
