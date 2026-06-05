## ADDED Requirements

### Requirement: Confirmed orders increment coupon usage

When an order with a non-empty `couponCode` reaches a committed status (`confirmed` for B2B, or `pending_payment` / `confirmed` for B2C per existing payment flows), the system SHALL increment the matching Payload coupon `usesCount` exactly once per order.

#### Scenario: First order increments usesCount

- **WHEN** order `JEY-1001` is created with `couponCode` BLOG5 and reaches committed status
- **THEN** coupon BLOG5 `usesCount` increases by 1

#### Scenario: Duplicate hook does not double increment

- **WHEN** the same order status transition fires the hook twice
- **THEN** `usesCount` increases by at most 1 for that order
