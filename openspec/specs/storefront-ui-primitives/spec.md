# Storefront UI primitives

## Purpose

Provide reusable, token-based UI primitives and utilities ported from the jeyjo-next prototype for the storefront application.

## Requirements

### Requirement: Core UI primitives ported

The storefront SHALL include reusable UI primitives ported from jeyjo-next, at minimum: `Button`, `Card`, `Input`, `Badge`, `Logo`, and a `cn` utility for class merging.

#### Scenario: Button variants render

- **WHEN** a page renders `<Button variant="primary">`
- **THEN** the button uses token-based styles consistent with the design prototype

### Requirement: No hardcoded brand colors in components

UI primitive components SHALL NOT embed hex color literals for brand or semantic colors; they MUST use Tailwind token utilities or CSS variables.

#### Scenario: Lint or review check

- **WHEN** inspecting primitive component source
- **THEN** color styling references token utilities (e.g. `bg-primary`, `text-text-secondary`) rather than arbitrary hex classes

### Requirement: Price and format utilities available

The storefront SHALL include `lib/utils/price.ts` and `lib/utils/format.ts` where `price.ts` consumes `PriceQuote` from `@jeyjo/pricing` (via the server pricing API) and exposes `getPriceView`, `getDualPrice`, and related helpers compatible with jeyjo-next component signatures.

#### Scenario: Price helper uses resolved quote

- **WHEN** a page renders a product price after calling the pricing resolution API
- **THEN** `getPriceView` derives display figures from the quote net and gross values
- **AND** the module remains at `apps/storefront/src/lib/utils/price.ts`

#### Scenario: Format helper unchanged path

- **WHEN** components import currency formatting from `lib/utils/format.ts`
- **THEN** the module path is unchanged from the foundation change
