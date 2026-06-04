## ADDED Requirements

### Requirement: Staff-configurable B2C payment methods alcance 1.10

Payload CMS SHALL expose a global `paymentSettings` configuration editable by staff to enable or disable each B2C payment method: card, Bizum, PayPal, Apple Pay, Google Pay, and bank transfer.

#### Scenario: Staff disables Bizum

- **WHEN** an admin sets `bizumEnabled` to false in payment settings
- **THEN** the storefront payment methods API omits Bizum
- **AND** checkout does not offer Bizum to B2C customers

#### Scenario: Staff enables transfer with instructions

- **WHEN** an admin enables transfer and sets IBAN and beneficiary text
- **THEN** the storefront exposes transfer as a selectable method
- **AND** post-order transfer instructions include the configured IBAN and order reference

### Requirement: Storefront reads payment settings server-side

The storefront SHALL fetch payment method flags from Payload on the server with short-lived caching and SHALL NOT hardcode method availability in client bundles alone.

#### Scenario: Methods API reflects CMS flags

- **WHEN** `GET /api/payments/methods` is called
- **THEN** the response lists only methods enabled in `paymentSettings`
- **AND** disabled methods are absent from the payload

#### Scenario: Checkout rejects disabled method

- **WHEN** place-order or payment init is called with a method code disabled in CMS
- **THEN** the API returns 400 validation error

### Requirement: Payment settings restricted to staff

Only authenticated Payload staff users SHALL update `paymentSettings`; public storefront consumers have read-only access via server routes.

#### Scenario: Anonymous cannot edit settings

- **WHEN** an unauthenticated request attempts to update payment settings
- **THEN** access is denied
