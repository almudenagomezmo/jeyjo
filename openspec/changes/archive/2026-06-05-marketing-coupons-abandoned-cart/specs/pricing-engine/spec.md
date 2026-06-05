## ADDED Requirements

### Requirement: Checkout coupon is post-resolution layer RF-007

The pricing engine's RF-007 resolution chain SHALL remain unchanged. Checkout coupon discounts are a separate layer applied after `resolvePrice`, excluding lines where `appliedRule` is `group_offer` from the coupon eligible subtotal.

#### Scenario: Group offer line excluded from coupon base

- **WHEN** a line resolves with `appliedRule` `group_offer`
- **THEN** that line's `lineTotal` is not included in coupon eligible subtotal
- **AND** RF-007 resolution for that line is unchanged

#### Scenario: B2B discount line remains coupon eligible

- **WHEN** a line resolves with `appliedRule` `b2b_discount`
- **THEN** that line's `lineTotal` is included in coupon eligible subtotal unless other marketing rules exclude it
