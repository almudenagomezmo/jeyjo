## ADDED Requirements

### Requirement: Add to cart emits GA4 add_to_cart event

When GA4 is enabled, cart add actions SHALL emit a GA4 `add_to_cart` event with standard item payload after a line is successfully added, per **RF-028**.

#### Scenario: Add from PDP updates cart and analytics

- **WHEN** GA4 is enabled and the user adds SKU `REF-001` from the PDP buy box
- **THEN** the cart store receives the new line
- **AND** an `add_to_cart` GA4 event is sent with matching item id, name, price, and quantity

#### Scenario: Batch add from purchase history emits one event per SKU

- **WHEN** GA4 is enabled and batch add adds three distinct SKUs
- **THEN** three `add_to_cart` events are sent (one per SKU) or one event with three items per GA4 e-commerce schema
