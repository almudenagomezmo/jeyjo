# Storefront shell navigation

## Purpose

Define global storefront navigation: CMS-backed category tree with static fallback, mega menu and mobile drawer, sticky header integrations, breadcrumbs, top bar messages, footer links, and route groups for shop and account areas.

## Requirements

### Requirement: Navigation tree loaded from CMS with static fallback

The storefront SHALL build the global navigation tree from published Payload `categories` (parent relationship, sort order, slug) on the server, and SHALL fall back to the bundled static taxonomy when CMS is unreachable or returns no categories.

#### Scenario: CMS categories populate mega menu

- **WHEN** Payload returns at least one root category with slug `escritura`
- **THEN** the header navigation renders that category with links to `/c/escritura` and child links using child slugs

#### Scenario: CMS unavailable uses static fallback

- **WHEN** the categories fetch fails or returns an empty list
- **THEN** the navigation renders using the static `CATEGORIES` dataset without breaking the page shell

### Requirement: Three-level hierarchy in global navigation

The navigation tree SHALL support up to three levels (category, subcategory, family). Levels beyond depth three SHALL be omitted from the public navigation panel.

#### Scenario: Grandchild shown in mega menu panel

- **WHEN** a category has a child with its own children in CMS
- **THEN** the mega menu displays the grandchild labels as links within that category column

### Requirement: Desktop mega menu and mobile drawer share one tree

The storefront SHALL expose the same navigation tree in a desktop mega menu panel and a mobile drawer opened from a hamburger control below the `md` breakpoint.

#### Scenario: Mobile drawer opens and closes

- **WHEN** a user on a viewport below `md` activates the menu button
- **THEN** a drawer opens with the full category tree and can be dismissed via close control, overlay tap, or Escape key

#### Scenario: Desktop categories control toggles panel

- **WHEN** a user on `md+` activates the Categories control
- **THEN** the mega menu panel opens below the sticky header with backdrop and closes on Escape or backdrop click

### Requirement: Sticky header integrates search account and cart

The sticky header SHALL keep logo, category navigation, centered search submitting to `/search`, account link to `/cuenta`, price mode toggle, theme toggle, and mini-cart trigger with item count badge when hydrated.

#### Scenario: Search submits to search route

- **WHEN** a user submits a non-empty query from the header search field
- **THEN** the browser navigates to `/search?q=` with the encoded query

#### Scenario: Cart badge shows count

- **WHEN** the cart store has items and the client has hydrated
- **THEN** the cart icon displays a numeric badge with the item count

### Requirement: Skip link and keyboard accessibility for shell navigation

The shell navigation SHALL include a skip link to main content and SHALL manage focus for mobile drawer and mega menu overlays per WCAG 2.1 AA expectations (visible focus, Escape dismisses).

#### Scenario: Skip link targets main content

- **WHEN** a keyboard user activates the skip link on first tab
- **THEN** focus moves to the main content landmark

### Requirement: Breadcrumbs on catalog and product routes

Catalog and product pages under `(shop)` SHALL render breadcrumbs reflecting the navigation tree and current path segments.

#### Scenario: Subcategory page shows trail

- **WHEN** a user opens `/c/escritura/boligrafos` and both slugs exist in the navigation tree
- **THEN** breadcrumbs show Home, parent category, and current subcategory labels with correct hrefs

### Requirement: Top bar displays configured trust messages

The top bar SHALL render a fixed list of trust or promotional messages from versioned storefront configuration without requiring CMS at runtime.

#### Scenario: Trust messages visible on load

- **WHEN** any public page loads
- **THEN** the top bar shows at least one configured message with icon and text

### Requirement: Footer links use real storefront routes

The footer SHALL link catalog columns to root category routes from the navigation tree and SHALL use real paths for account and search where available instead of placeholder `#` only when no target exists.

#### Scenario: Footer catalog links to category routes

- **WHEN** the navigation tree includes root category `papel`
- **THEN** the footer catalog column includes a link to `/c/papel`

### Requirement: Route groups separate shop and account layouts

The App Router SHALL use route groups `(shop)` and `(account)` so catalog and account areas can share the root shell while applying segment-specific layout wrappers without changing public URLs.

#### Scenario: Account route keeps global shell

- **WHEN** a user opens `/cuenta`
- **THEN** TopBar, Header, and Footer from the root layout remain visible and the account segment layout wraps page content
