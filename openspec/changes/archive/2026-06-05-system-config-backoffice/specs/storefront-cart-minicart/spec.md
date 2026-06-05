## MODIFIED Requirements

### Requirement: Shipping preview banner in minicart and cart RF-013

The minicart footer and full cart page SHALL show a shipping preview banner using segment thresholds and costs from `GET /api/system/config` (CMS `systemSettings`), with v1 defaults (B2C ≥ 39€, B2B ≥ 10€) when CMS is unavailable: free shipping when subtotal meets the segment threshold, otherwise the remaining amount to free shipping for the active price mode.

#### Scenario: B2C below threshold shows amount remaining

- **WHEN** price mode is B2C and subtotal is 30€ and CMS config uses default B2C threshold 39€
- **THEN** the banner shows how much more is needed for free shipping

#### Scenario: B2C at threshold shows free shipping

- **WHEN** price mode is B2C and subtotal is 40€
- **THEN** the banner indicates free shipping applies

#### Scenario: Staff-configured threshold reflected in banner

- **WHEN** CMS sets B2C threshold to 50€ and price mode is B2C with subtotal 45€
- **THEN** the banner shows 5€ remaining to free shipping
