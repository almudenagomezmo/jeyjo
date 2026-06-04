## ADDED Requirements

### Requirement: Solicitar presupuesto CTA on full cart page US-05 CA1

The full `/cart` page SHALL show an enabled **Solicitar presupuesto** secondary button when the cart has lines and quotes are enabled via configuration. The button SHALL navigate to `/presupuesto` and SHALL NOT remain disabled with a "coming soon" message.

#### Scenario: Cart shows enabled presupuesto button

- **WHEN** a user opens `/cart` with at least one line and quotes are enabled
- **THEN** **Solicitar presupuesto** is clickable
- **AND** clicking it navigates to `/presupuesto`

#### Scenario: Presupuesto hidden when quotes disabled

- **WHEN** quotes feature flag is off
- **THEN** the presupuesto CTA is hidden or disabled with neutral copy

#### Scenario: Presupuesto unavailable on empty cart

- **WHEN** the cart has no lines
- **THEN** the presupuesto CTA is not offered on `/cart`
