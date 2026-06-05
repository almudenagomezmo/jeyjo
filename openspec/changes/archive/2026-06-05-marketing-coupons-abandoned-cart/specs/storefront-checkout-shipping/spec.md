## ADDED Requirements

### Requirement: Checkout totals use real coupon validation RF-027

The checkout prepare and place-order server paths SHALL compute merchandise discount using `coupon-validation-engine` instead of demo coupons, and SHALL pass the validated `couponCode` and `discount` into order creation.

#### Scenario: Prepare rejects invalid coupon

- **WHEN** prepare is called with an expired coupon code
- **THEN** the response status is 400 with coupon error detail

#### Scenario: Order stores validated coupon code

- **WHEN** place-order succeeds with valid coupon BLOG5
- **THEN** the Payload order `couponCode` field is `BLOG5`
- **AND** order totals reflect the server-computed discount

### Requirement: Shipping uses post-coupon merchandise subtotal

Shipping cost rules SHALL apply to merchandise subtotal after coupon discount, consistent with existing RF-013 scenarios.

#### Scenario: B2C below threshold after coupon

- **WHEN** checkout segment is B2C and merchandise subtotal after coupon is 38.00 €
- **THEN** the shipping line shows "Gastos de envío: 5,00 € (IVA incluido)"
- **AND** order total is 43.00 €
