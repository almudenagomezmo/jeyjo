## MODIFIED Requirements

### Requirement: Layout shell components present

The storefront SHALL include layout components `TopBar`, `Header`, `Footer`, and `Container` ported from jeyjo-next structure, rendered from the root layout. The header SHALL additionally provide mobile navigation (`MobileNav` or equivalent drawer) and a skip link to the main content landmark.

#### Scenario: Global navigation visible

- **WHEN** any public page loads
- **THEN** TopBar and Header are visible; Footer appears at the bottom of the viewport flow

#### Scenario: Mobile navigation available on small viewports

- **WHEN** a public page loads on a viewport below the `md` breakpoint
- **THEN** the header exposes a menu control that opens the mobile navigation drawer

### Requirement: Placeholder home without business catalog

The home route SHALL render a minimal placeholder that does not require ERP sync or product catalog APIs. Other routes MAY depend on CMS for navigation while the home route remains renderable if CMS is unavailable.

#### Scenario: No backend required for home

- **WHEN** only the storefront app runs without cms or database
- **THEN** the home page still renders successfully

#### Scenario: Navigation degrades without CMS on home

- **WHEN** the home page loads and CMS categories are unavailable
- **THEN** the header still renders using static navigation fallback data
