## MODIFIED Requirements

### Requirement: Full cart page at /cart

The storefront SHALL provide a `/cart` route listing all cart lines with quantity controls, subtotal, shipping preview, discount coupon input (demo validation until marketing module), and primary CTAs that navigate to `/checkout` when the cart has lines. The checkout flow implementation lives in `storefront-checkout-shipping`; this capability only links to it.

#### Scenario: Empty cart page

- **WHEN** a user opens `/cart` with no lines
- **THEN** an empty-state message and link to the catalog are shown

#### Scenario: Cart page lists all lines

- **WHEN** a user opens `/cart` with multiple lines
- **THEN** all lines appear with the same pricing and pack rules as the minicart

#### Scenario: Tramitar pedido navigates to checkout

- **WHEN** a user clicks "Tramitar pedido" with at least one cart line
- **THEN** the browser navigates to `/checkout`
- **AND** any applied demo coupon code is available to checkout via client persistence

#### Scenario: Minicart Tramitar navigates to checkout

- **WHEN** a user clicks "Tramitar" in the minicart footer with lines present
- **THEN** the browser navigates to `/checkout`
