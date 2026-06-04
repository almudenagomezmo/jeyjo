## ADDED Requirements

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
