# Storefront home segmented

## Purpose

Segmented B2C/B2B home landing with CMS merchandising, promotional banners, featured categories, product carousels, and graceful degradation per alcance §1.6.

## Requirements

### Requirement: Home renders segmented B2C and B2B experience

The storefront home route (`/`) SHALL render a segmented landing experience with visible B2C and B2B segment controls, segment-specific promotional content, and product carousels aligned to the active price mode per alcance §1.6.

#### Scenario: Default anonymous visitor sees B2C segment

- **WHEN** an unauthenticated user opens `/` without a price-mode cookie
- **THEN** the home displays B2C-oriented banners and the B2C top-sales carousel as the default segment

#### Scenario: User switches to B2B segment on home

- **WHEN** a user activates the B2B segment control on the home page
- **THEN** the page refreshes to show B2B-oriented banners and the B2B top-sales carousel
- **AND** the header price mode indicator stays consistent with the selected segment

### Requirement: Home hero includes prominent search entry

The home hero section SHALL include the storefront `SearchBar` and quick-search suggestion chips linking to `/search?q=...`, matching the jeyjo-next home layout pattern.

#### Scenario: Search bar visible on home

- **WHEN** a user opens `/`
- **THEN** the hero displays the search bar without requiring catalog carousel data to load

#### Scenario: Suggestion chip navigates to search

- **WHEN** a user clicks a hero suggestion chip labeled "Folios A4"
- **THEN** the browser navigates to `/search` with an encoded query for that term

### Requirement: Promotional banners respect schedule and segment

The home SHALL display promotional banners sourced from CMS only when the current timestamp is within each banner's configured start and end datetime and the banner segment matches the active home segment (`b2c`, `b2b`, or `both`).

#### Scenario: Active banner within date range

- **WHEN** a banner is configured with `startAt` yesterday and `endAt` tomorrow for segment `both`
- **THEN** the banner appears on the home for both B2C and B2B segments

#### Scenario: Expired banner hidden

- **WHEN** a banner's `endAt` is in the past
- **THEN** that banner is not rendered on the home

#### Scenario: Segment-specific banner

- **WHEN** the active segment is B2B and a banner is configured for segment `b2c` only
- **THEN** that banner is not rendered

### Requirement: Featured categories grid from CMS

The home SHALL render a grid of featured categories with name, visual glyph from the category's `homeGlyph` field when present, and link to `/c/{slug}`, using CMS-configured featured categories when present.

#### Scenario: Featured categories from global home

- **WHEN** the CMS home global lists three published category relationships with `homeGlyph` configured
- **THEN** the home displays exactly those three categories in configured order with glyphs matching `homeGlyph`

#### Scenario: Fallback to navigation roots when unset

- **WHEN** the CMS home global has no featured categories configured
- **THEN** the home displays up to six root categories from the storefront navigation tree using each root's `homeGlyph` when available

### Requirement: Featured category glyph without slug map

The featured categories grid SHALL derive visual glyphs from CMS `homeGlyph` on category documents and SHALL NOT require a hardcoded slug-to-glyph map in storefront source for CMS-backed categories.

#### Scenario: Root without homeGlyph uses default glyph

- **WHEN** a featured or fallback root category has no `homeGlyph` in CMS
- **THEN** the grid renders a neutral default glyph (e.g. box) without failing the page render

### Requirement: Home product carousels use public CMS catalog

Each home product carousel section SHALL list only published, non-wildcard products from CMS-curated relationships, rendered with the same `ProductCard` and pricing rules as PLP.

#### Scenario: B2C top sales carousel

- **WHEN** the active segment is B2C and the CMS home global lists curated products for top sales B2C
- **THEN** the carousel displays those products with dual prices from `PriceQuote` per US-02

#### Scenario: Empty carousel section omitted

- **WHEN** a carousel has zero resolvable public products after filtering
- **THEN** the section heading and grid are not rendered

### Requirement: Home carousels use batch pricing and stock

The home page server render SHALL prefetch batch `PriceQuote` and stock indicators for all SKUs shown in active carousels in one server pass, without per-card client pricing calls.

#### Scenario: Batch quotes for carousel SKUs

- **WHEN** the home renders two carousels with a combined total of 10 public SKUs
- **THEN** the server provides a quote map covering those SKUs before client hydration

#### Scenario: Anonymous carousel does not expose P2

- **WHEN** an unauthenticated user views a home carousel
- **THEN** each card quote uses P1 rules and does not expose P2 in the response used by cards

### Requirement: Trust and segment cards present on home

The home SHALL include B2C and B2B segment summary cards and a trust strip (shipping, support, payment, returns) using design tokens from `globals.css` without new hardcoded hex colors.

#### Scenario: Segment cards link to catalog or account

- **WHEN** a user activates the CTA on the B2C segment card
- **THEN** the user navigates to a configured category PLP route

#### Scenario: Trust strip visible

- **WHEN** the home loads successfully
- **THEN** a trust strip with at least four value propositions is visible below product carousels

### Requirement: Home degrades gracefully when CMS unavailable

If home merchandising data cannot be loaded from CMS, the home route SHALL still render the hero, segment cards, and shell navigation without throwing a 500 error.

#### Scenario: CMS timeout on home global

- **WHEN** the CMS global home request fails or times out
- **THEN** the home renders hero and segment cards without promotional banners or product carousels

#### Scenario: Partial carousel failure

- **WHEN** the home global loads but product resolution for one carousel fails
- **THEN** other sections still render and the failed carousel is omitted
