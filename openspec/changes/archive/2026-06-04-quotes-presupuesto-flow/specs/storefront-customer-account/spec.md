## ADDED Requirements

### Requirement: Account area lists customer presupuestos US-05 CA2

The storefront account area SHALL provide `/cuenta/presupuestos` for authenticated customers to view quotes linked to their `customerRef`, showing quote number, request date, Spanish status label, and total amount.

#### Scenario: Sidebar includes presupuestos link

- **WHEN** an authenticated user opens the account layout
- **THEN** sidebar navigation includes **Mis presupuestos** linking to `/cuenta/presupuestos`

#### Scenario: Presupuestos page lists quotes

- **WHEN** a customer with two quotes opens `/cuenta/presupuestos`
- **THEN** both quotes render with number, date, status, and total

#### Scenario: Empty presupuestos state

- **WHEN** a customer has no quotes
- **THEN** the page shows an empty-state message and link to the catalog

#### Scenario: Unauthenticated access redirected

- **WHEN** an anonymous user opens `/cuenta/presupuestos`
- **THEN** the user is redirected to login
