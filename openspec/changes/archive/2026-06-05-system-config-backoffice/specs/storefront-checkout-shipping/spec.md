## MODIFIED Requirements

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
