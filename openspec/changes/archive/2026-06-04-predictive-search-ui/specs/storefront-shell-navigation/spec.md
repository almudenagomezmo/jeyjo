## MODIFIED Requirements

### Requirement: Sticky header integrates search account and cart

The sticky header SHALL keep logo, category navigation, centered predictive search (dropdown suggest from third character per `storefront-predictive-search`, plus submit to `/search`), account control reflecting session state (login link when anonymous, account menu or label with `commercial_name` when authenticated), price mode toggle per session rules from price-resolution spec, theme toggle, and mini-cart trigger with item count badge when hydrated.

#### Scenario: Search submits to search route

- **WHEN** a user submits a non-empty query from the header search field
- **THEN** the browser navigates to `/search?q=` with the encoded query

#### Scenario: Predictive dropdown while typing

- **WHEN** a user types at least three characters in the header search field without submitting
- **THEN** a visual suggest dropdown appears with product thumbnails and category suggestions when results exist

#### Scenario: Cart badge shows count

- **WHEN** the cart store has items and the client has hydrated
- **THEN** the cart icon displays a numeric badge with the item count
