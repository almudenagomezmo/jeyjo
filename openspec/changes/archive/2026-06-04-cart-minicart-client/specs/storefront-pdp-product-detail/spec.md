## MODIFIED Requirements

### Requirement: Add to cart from PDP respects stock rules US-03

The PDP add-to-cart control SHALL add the selected quantity (in pack multiples) to the cart store, disable the button when stock is limited and `allowOrderWithoutStock` is false, show the US-03 CA4 pending-validation message when ordering without stock is allowed, and open the header minicart with updated subtotal per US-03 CA3.

#### Scenario: Add to cart with available stock

- **WHEN** stock level is `available` and the user clicks add to cart with valid quantity
- **THEN** the cart store receives the line with the selected SKU and quantity and the minicart opens showing the updated subtotal

#### Scenario: Limited stock without allow flag disables button

- **WHEN** stock level is `limited` and `allowOrderWithoutStock` is false
- **THEN** the add-to-cart button is disabled

#### Scenario: Order without stock shows validation message

- **WHEN** stock level is `limited`, `allowOrderWithoutStock` is true, and the user adds to cart
- **THEN** the UI shows that the order is pending stock validation for the product reference and the minicart opens with the line added
