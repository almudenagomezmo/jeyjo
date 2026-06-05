## ADDED Requirements

### Requirement: PDP emits GA4 view_item on product view

When GA4 is enabled, the product detail page SHALL emit a GA4 `view_item` event once per PDP load with the public product SKU, name, and resolved unit price, per **RF-028**.

#### Scenario: Anonymous visitor opens PDP

- **WHEN** GA4 is enabled and PDP loads for slug `boligrafo-premium` with SKU `REF-001`
- **THEN** a `view_item` event is sent with `item_id` REF-001 and the displayed public price

#### Scenario: GA4 disabled on PDP

- **WHEN** GA4 is disabled
- **THEN** PDP renders normally without `view_item` events
