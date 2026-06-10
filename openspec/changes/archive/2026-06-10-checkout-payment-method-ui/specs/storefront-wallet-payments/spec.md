## MODIFIED Requirements

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
