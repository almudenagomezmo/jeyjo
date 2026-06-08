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

#### Scenario: Anonymous account link goes to login

- **WHEN** no customer session exists
- **THEN** the account control links to `/login`

#### Scenario: Authenticated account link goes to cuenta

- **WHEN** any authenticated customer session exists (B2C, pending, or validated B2B)
- **THEN** the account control links to `/cuenta`

## MODIFIED Requirements

### Requirement: Portal mode suppresses public shop chrome

When the active route is under `/cuenta/empresa/*`, the navigation shell SHALL render the portal top bar defined in `storefront-b2b-portal-shell` instead of the sticky shop header and SHALL omit the public footer.

#### Scenario: Footer hidden on empresa routes

- **WHEN** a validated B2B user loads any `/cuenta/empresa/*` path
- **THEN** the public shop footer is not rendered

#### Scenario: Shop header hidden on empresa routes

- **WHEN** a validated B2B user loads `/cuenta/empresa/pedidos`
- **THEN** the category mega menu and header search bar are not rendered

## MODIFIED Requirements

### Requirement: Route groups separate shop and account layouts

The App Router SHALL use route groups `(shop)` and `(account)` so catalog and account areas share the root layout while applying segment-specific layout wrappers without changing public URLs.

#### Scenario: Account route keeps global shell on personal pages

- **WHEN** a user opens `/cuenta/perfil`
- **THEN** TopBar, Header, and Footer from the root layout remain visible and the account segment layout wraps page content

#### Scenario: Empresa route uses portal shell

- **WHEN** a validated B2B user opens `/cuenta/empresa/pedidos`
- **THEN** the portal top bar is shown instead of the full shop header
- **AND** the account segment layout wraps page content with unified sidebar navigation
