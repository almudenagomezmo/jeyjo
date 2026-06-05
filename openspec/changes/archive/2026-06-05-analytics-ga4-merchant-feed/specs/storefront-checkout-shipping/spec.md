## ADDED Requirements

### Requirement: Checkout emits GA4 begin_checkout when flow starts

When GA4 is enabled, entering the checkout flow with a non-empty cart SHALL emit a GA4 `begin_checkout` event once per checkout attempt with cart value and items, per **RF-028**.

#### Scenario: User opens checkout with items

- **WHEN** GA4 is enabled and the user navigates to checkout with two cart lines
- **THEN** a `begin_checkout` event is sent with aggregate value and two items

#### Scenario: Empty cart redirected without begin_checkout

- **WHEN** the user reaches checkout with an empty cart and is redirected away
- **THEN** no `begin_checkout` event is sent
