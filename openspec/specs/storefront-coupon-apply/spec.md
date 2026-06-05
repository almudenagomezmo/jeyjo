# Storefront coupon apply

## Purpose

Storefront UI and APIs for applying discount coupons at cart and checkout (US-04 CA4, RF-027, change #31).

## Requirements

### Requirement: Cart page applies coupon via API US-04 CA4

The `/cart` page SHALL call `POST /api/cart/coupon` when the user submits a coupon code, display validation errors inline, and persist the accepted code in `sessionStorage` under `jeyjo-checkout-coupon` for checkout.

#### Scenario: Apply valid coupon updates totals

- **WHEN** the user enters `BLOG5` and clicks apply on `/cart`
- **THEN** the cart summary shows the discount line and updated total
- **AND** `sessionStorage` contains `BLOG5`

#### Scenario: Invalid coupon shows error

- **WHEN** the user enters `INVALID` and clicks apply
- **THEN** an error message is shown
- **AND** no discount is applied

#### Scenario: Remove coupon clears storage

- **WHEN** the user removes the applied coupon
- **THEN** discount is cleared
- **AND** `sessionStorage` key is removed

### Requirement: Checkout revalidates coupon server-side

The checkout prepare and place-order flows SHALL revalidate the coupon with server-side pricing and reject tampered client totals.

#### Scenario: Prepare includes validated coupon discount

- **WHEN** `POST /api/checkout/prepare` is called with coupon `BLOG5` and valid cart lines
- **THEN** the prepare token embeds the server-computed discount
- **AND** review step totals match server response

#### Scenario: Tampered coupon rejected at place-order

- **WHEN** place-order is attempted with a coupon code not present in the prepare token
- **THEN** the response status is 400

### Requirement: Offer exclusion warning in UI CA-CHECKOUT-005

When coupon validation returns `showOfferExclusionWarning`, the cart and checkout UI SHALL display: "El cupón no aplica sobre artículos en oferta".

#### Scenario: Warning visible on mixed cart

- **WHEN** BLOG5 is applied and one line is on group offer
- **THEN** the warning message is visible near the discount summary
