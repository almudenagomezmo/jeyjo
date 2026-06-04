## ADDED Requirements

### Requirement: Customer shipping addresses management

The storefront account area SHALL provide `/cuenta/direcciones` for authenticated customers to list, create, edit, and delete shipping addresses stored in `customer_addresses`, and mark one address as default for checkout preselection.

#### Scenario: List addresses

- **WHEN** an authenticated user opens `/cuenta/direcciones`
- **THEN** saved addresses render with label, recipient, and formatted address

#### Scenario: Create address

- **WHEN** the user submits a valid new address form
- **THEN** a row is inserted linked to their `customer_id`
- **AND** the new address appears in the list

#### Scenario: Set default address

- **WHEN** the user marks an address as default
- **THEN** exactly one address per customer has `is_default` true

#### Scenario: Delete address

- **WHEN** the user deletes a non-default address
- **THEN** the row is removed
- **AND** checkout no longer offers that address

### Requirement: Account sidebar includes direcciones link

The account sidebar navigation SHALL include an active link to `/cuenta/direcciones` replacing the direcciones placeholder.

#### Scenario: Sidebar shows direcciones

- **WHEN** an authenticated user views any `/cuenta/*` page
- **THEN** the sidebar includes "Direcciones" pointing to `/cuenta/direcciones`
