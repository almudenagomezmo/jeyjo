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

The storefront SHALL include `lib/utils/price.ts` and `lib/utils/format.ts` stubs compatible with the jeyjo-next signatures for use in later pricing changes.

#### Scenario: Price helper import

- **WHEN** a future PLP imports price formatting helpers
- **THEN** the module exists under `apps/storefront/src/lib/utils/` without restructuring paths
