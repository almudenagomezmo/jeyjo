## MODIFIED Requirements

### Requirement: Sticky header integrates search account and cart

The sticky header SHALL keep logo, category navigation, centered search submitting to `/search`, account control reflecting session state (login link when anonymous, account menu or label with `commercial_name` when authenticated), price mode toggle per session rules from price-resolution spec, theme toggle, and mini-cart trigger with item count badge when hydrated.

#### Scenario: Search submits to search route

- **WHEN** a user submits a non-empty query from the header search field
- **THEN** the browser navigates to `/search?q=` with the encoded query

#### Scenario: Cart badge shows count

- **WHEN** the cart store has items and the client has hydrated
- **THEN** the cart icon displays a numeric badge with the item count

#### Scenario: Anonymous account link goes to login

- **WHEN** no customer session exists
- **THEN** the account control links to `/login`

#### Scenario: Authenticated account link goes to correct home

- **WHEN** a validated B2B session exists (`customer_group` 2–4)
- **THEN** the account control links to `/intranet`

#### Scenario: Authenticated B2C account link goes to cuenta

- **WHEN** a B2C or pending session exists (`customer_group` 1 or pending validation)
- **THEN** the account control links to `/cuenta`
