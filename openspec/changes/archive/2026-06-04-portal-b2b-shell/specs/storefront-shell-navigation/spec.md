## ADDED Requirements

### Requirement: Portal mode suppresses public shop chrome

When the active route is under `/intranet/*`, the navigation shell SHALL render the portal top bar defined in `storefront-b2b-portal-shell` instead of the sticky shop header and SHALL omit the public footer.

#### Scenario: Footer hidden on intranet

- **WHEN** a validated B2B user loads any `/intranet/*` path
- **THEN** the public shop footer is not rendered

#### Scenario: Shop header hidden on intranet

- **WHEN** a validated B2B user loads `/intranet`
- **THEN** the category mega menu and header search bar are not rendered

## MODIFIED Requirements

### Requirement: Route groups separate shop and account layouts

The App Router SHALL use route groups `(shop)`, `(account)`, and `(b2b)` so catalog, B2C account, and B2B portal areas can share the root layout while applying segment-specific layout wrappers without changing public URLs.

#### Scenario: Account route keeps global shell

- **WHEN** a user opens `/cuenta`
- **THEN** TopBar, Header, and Footer from the root layout remain visible and the account segment layout wraps page content

#### Scenario: Intranet route uses portal shell

- **WHEN** a validated B2B user opens `/intranet/pedidos`
- **THEN** the portal top bar is shown instead of the full shop header
- **AND** the intranet segment layout wraps page content with sidebar navigation
