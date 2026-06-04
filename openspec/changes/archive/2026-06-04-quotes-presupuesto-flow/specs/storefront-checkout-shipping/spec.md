## ADDED Requirements

### Requirement: Checkout review offers solicitar presupuesto US-05 CA1

The checkout review step SHALL display a secondary **Solicitar presupuesto** action alongside order confirmation when the cart has lines and quotes are enabled. Selecting it SHALL navigate to `/presupuesto` without completing payment or place-order.

#### Scenario: Review step shows presupuesto action

- **WHEN** a user reaches checkout review with lines present and quotes enabled
- **THEN** **Solicitar presupuesto** is visible
- **AND** it does not require a payment method selection

#### Scenario: Presupuesto navigation preserves cart

- **WHEN** the user clicks **Solicitar presupuesto** from checkout review
- **THEN** the browser navigates to `/presupuesto`
- **AND** cart lines remain until quote request succeeds
