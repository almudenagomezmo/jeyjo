## MODIFIED Requirements

### Requirement: Footer links use real storefront routes

The footer SHALL link catalog columns to root category routes from the navigation tree. Help and purchase columns SHALL use real storefront paths for operational links (shipping, returns, payment info, B2B registration, quotes, account, search, order tracking, privacy, cookies, FAQ, and contact) instead of placeholder `#` hrefs. Legal micro-links in the bottom bar SHALL point to `/legal/*` routes. Blog link SHALL appear only when enabled in footer settings.

#### Scenario: Footer catalog links to category routes

- **WHEN** the navigation tree includes root category `papel`
- **THEN** the footer catalog column includes a link to `/c/papel`

#### Scenario: Help column links to FAQ and account

- **WHEN** the footer renders on a public page
- **THEN** the help column includes links to `/cuenta`, `/search`, `/cuenta/pedidos`, and `/ayuda/faq` with non-placeholder hrefs

#### Scenario: Purchase column links to legal and presupuesto

- **WHEN** the footer renders and legal pages are published
- **THEN** "Envíos y plazos" links to `/legal/envios`
- **AND** "Solicitar presupuesto" links to `/presupuesto`

#### Scenario: No placeholder hash links in footer columns

- **WHEN** the footer link columns render
- **THEN** no operational link uses `href="#"` except where no target route exists and is explicitly documented as disabled
