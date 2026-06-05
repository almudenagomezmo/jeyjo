# Coupon validation engine

## Purpose

Server-side coupon validation against Payload with RF-007 non-accumulation on offer lines (RF-027, CA-CHECKOUT-004/005, change #31).

## Requirements

### Requirement: Server-side coupon validation against Payload

The storefront SHALL validate coupon codes by loading active coupons from Payload and applying business rules: date range, `usesCount < maxUses` when `maxUses` is set, and `eligibleSubtotal >= minimumOrderAmount`.

#### Scenario: Valid BLOG5 returns discount CA-CHECKOUT-004

- **WHEN** coupon `BLOG5` is active with 5% percent discount and minimum 0
- **AND** cart eligible subtotal is 100.00 € with no offer lines
- **THEN** validation returns `discountAmount` 5.00 €
- **AND** `merchandiseSubtotal` after discount is 95.00 €

#### Scenario: Expired coupon rejected

- **WHEN** coupon `MAYO10` has `validUntil` in the past
- **THEN** validation returns invalid with error `expired`

#### Scenario: Max uses exceeded

- **WHEN** coupon `ONCE` has `maxUses` 1 and `usesCount` 1
- **THEN** validation returns invalid with error `max_uses_reached`

#### Scenario: Below minimum order

- **WHEN** coupon requires minimum 50 € and eligible subtotal is 40 €
- **THEN** validation returns invalid with error `minimum_not_met`

### Requirement: Coupon does not apply on offer lines CA-CHECKOUT-005

Discount calculation SHALL exclude cart lines whose price quote `appliedRule` is `group_offer` from the eligible subtotal. Percent discounts apply only to eligible lines; fixed discounts cap at eligible subtotal.

#### Scenario: Partial eligibility on mixed cart

- **WHEN** coupon `BLOG5` at 5% is applied
- **AND** line REF-007 is on `group_offer` for 30 €
- **AND** line REF-008 is not on offer for 50 €
- **THEN** `discountAmount` is 2.50 € (5% of 50 € only)
- **AND** `ineligibleOfferLines` includes REF-007

#### Scenario: Offer exclusion warning flag

- **WHEN** validation succeeds with at least one excluded offer line
- **THEN** the response includes `showOfferExclusionWarning` true

### Requirement: Fixed amount coupon caps at eligible subtotal

For `discountType` fixed, the applied discount MUST NOT exceed the eligible merchandise subtotal.

#### Scenario: Fixed 15 on 10 eligible

- **WHEN** coupon is fixed 15 € and eligible subtotal is 10 €
- **THEN** `discountAmount` is 10 €
