# Storefront shell navigation

## Purpose

Define global storefront navigation: CMS-backed category tree with versioned snapshot fallback, mega menu and mobile drawer, sticky header integrations, breadcrumbs, top bar messages, footer links, and route groups for shop and account areas.

## Requirements

### Requirement: Navigation tree loaded from CMS with snapshot fallback

The storefront SHALL build the global navigation tree from published Payload `categories` (parent relationship, sort order, slug, `homeGlyph` on root nodes) on the server, and SHALL fall back to the versioned category snapshot defined in `storefront-category-snapshot` when live CMS is unreachable or returns no categories. The storefront SHALL NOT use the legacy bundled static `CATEGORIES` TypeScript taxonomy as a runtime fallback.

#### Scenario: CMS categories populate mega menu

- **WHEN** Payload returns at least one root category with slug `escritura`
- **THEN** the header navigation renders that category with links to `/c/escritura` and child links using child slugs

#### Scenario: CMS unavailable uses snapshot fallback

- **WHEN** the live categories fetch fails or returns an empty list and the snapshot file contains categories
- **THEN** the navigation renders using snapshot data without breaking the page shell

#### Scenario: Root glyph from CMS homeGlyph

- **WHEN** a root category document includes `homeGlyph` `pen`
- **THEN** the mega menu displays the pen glyph for that root category without a hardcoded slug-to-glyph map

### Requirement: Three-level hierarchy in global navigation

The navigation tree SHALL support up to three levels (category, subcategory, family). Levels beyond depth three SHALL be omitted from the public navigation panel. Family nodes SHALL link to dedicated PLP routes `/c/{rootSlug}/{subSlug}/{familySlug}`.

#### Scenario: Grandchild shown in mega menu panel

- **WHEN** a category has a child with its own children in CMS
- **THEN** the mega menu displays the grandchild labels as links to `/c/{root}/{sub}/{family}`

#### Scenario: Family PLP route resolves

- **WHEN** a user opens `/c/escritura/boligrafos/gel` and that family exists in the navigation tree
- **THEN** the page renders a PLP filtered by the family slug and breadcrumbs Home → Escritura → Bolígrafos → Gel

### Requirement: Desktop mega menu and mobile drawer share one tree

The storefront SHALL expose the same navigation tree in a desktop mega menu panel and a mobile drawer opened from a hamburger control below the `md` breakpoint.

#### Scenario: Mobile drawer opens and closes

- **WHEN** a user on a viewport below `md` activates the menu button
- **THEN** a drawer opens with the full category tree and can be dismissed via close control, overlay tap, or Escape key

#### Scenario: Desktop categories control toggles panel

- **WHEN** a user on `md+` activates the Categories control
- **THEN** the mega menu panel opens below the sticky header with backdrop and closes on Escape or backdrop click

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

### Requirement: Skip link and keyboard accessibility for shell navigation

The shell navigation SHALL include a skip link to main content and SHALL manage focus for mobile drawer and mega menu overlays per WCAG 2.1 AA expectations (visible focus, Escape dismisses).

#### Scenario: Skip link targets main content

- **WHEN** a keyboard user activates the skip link on first tab
- **THEN** focus moves to the main content landmark

### Requirement: Breadcrumbs on catalog and product routes

Catalog and product pages under `(shop)` SHALL render breadcrumbs reflecting the navigation tree and current path segments, including three-segment family paths.

#### Scenario: Subcategory page shows trail

- **WHEN** a user opens `/c/escritura/boligrafos` and both slugs exist in the navigation tree
- **THEN** breadcrumbs show Home, parent category, and current subcategory labels with correct hrefs

#### Scenario: Family page shows three-level trail

- **WHEN** a user opens `/c/escritura/boligrafos/gel` and all three slugs exist in the navigation tree
- **THEN** breadcrumbs show Home, root category, subcategory, and family with hrefs on all but the current leaf

### Requirement: Top bar displays configured trust messages

The top bar SHALL render a fixed list of trust or promotional messages from versioned storefront configuration without requiring CMS at runtime.

#### Scenario: Trust messages visible on load

- **WHEN** any public page loads
- **THEN** the top bar shows at least one configured message with icon and text

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

### Requirement: Portal mode suppresses public shop chrome

When the active route is under `/cuenta/empresa/*`, the navigation shell SHALL render the portal top bar defined in `storefront-b2b-portal-shell` instead of the sticky shop header and SHALL omit the public footer.

#### Scenario: Footer hidden on empresa routes

- **WHEN** a validated B2B user loads any `/cuenta/empresa/*` path
- **THEN** the public shop footer is not rendered

#### Scenario: Shop header hidden on empresa routes

- **WHEN** a validated B2B user loads `/cuenta/empresa/pedidos`
- **THEN** the category mega menu and header search bar are not rendered

### Requirement: Route groups separate shop and account layouts

The App Router SHALL use route groups `(shop)` and `(account)` so catalog and account areas share the root layout while applying segment-specific layout wrappers without changing public URLs.

#### Scenario: Account route keeps global shell on personal pages

- **WHEN** a user opens `/cuenta/perfil`
- **THEN** TopBar, Header, and Footer from the root layout remain visible and the account segment layout wraps page content

#### Scenario: Empresa route uses portal shell

- **WHEN** a validated B2B user opens `/cuenta/empresa/pedidos`
- **THEN** the portal top bar is shown instead of the full shop header
- **AND** the account segment layout wraps page content with unified sidebar navigation

### Requirement: Minicart mounted globally in root layout

The storefront root layout SHALL mount the minicart panel component once so it is available on every public page without per-route duplication.

#### Scenario: Minicart available on home

- **WHEN** a user loads the home page and opens the cart from the header
- **THEN** the minicart panel renders without navigating away from `/`

### Requirement: Header cart control opens minicart panel

The header cart button SHALL open the minicart slide-over panel via client UI state rather than navigating directly to `/cart`.

#### Scenario: Cart icon opens panel

- **WHEN** a user activates the cart icon in the sticky header
- **THEN** the minicart panel opens as a dialog overlay
