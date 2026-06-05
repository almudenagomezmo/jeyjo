## ADDED Requirements

### Requirement: Footer includes operational newsletter block alcance §1.12

In addition to catalog and static link columns, the storefront `Footer` SHALL render an operational newsletter subscription block as defined in `storefront-newsletter-subscribe`, integrated into the footer grid without breaking responsive layout on viewports from mobile through desktop.

#### Scenario: Newsletter block in footer grid

- **WHEN** the footer renders on a desktop viewport
- **THEN** the newsletter block appears alongside existing footer columns
- **AND** uses semantic tokens (`bg-ink`, `text-neutral-200`) consistent with the current footer

#### Scenario: Newsletter block stacks on mobile

- **WHEN** the footer renders below the `md` breakpoint
- **THEN** the newsletter block remains readable and submittable without horizontal overflow
