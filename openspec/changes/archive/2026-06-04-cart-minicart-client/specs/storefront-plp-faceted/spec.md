## ADDED Requirements

### Requirement: PLP add to cart updates minicart US-03 CA3

Add-to-cart actions from PLP product cards and quick-view modal SHALL update the client cart store and open or refresh the header minicart with updated subtotal without leaving the listing page.

#### Scenario: Card add to cart opens minicart

- **WHEN** a user adds a product from a PLP product card
- **THEN** the minicart opens showing the added line and updated subtotal

#### Scenario: Quick view add to cart opens minicart

- **WHEN** a user adds a product from the PLP quick-view dialog
- **THEN** the minicart opens and the listing page remains visible underneath
