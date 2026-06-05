## ADDED Requirements

### Requirement: Mi cuenta section is production subuser management

The portal SHALL render production functionality at `/intranet/mi-cuenta` for B2B superadmin per `storefront-b2b-subusers`, replacing the roadmap scaffold for subuser management.

#### Scenario: Mi cuenta no longer shows subuser scaffold

- **WHEN** a B2B superadmin opens `/intranet/mi-cuenta`
- **THEN** the subuser management UI is shown
- **AND** the scaffold copy referencing change #26 is not displayed

#### Scenario: Navigation config omits forbidden items for subusers

- **WHEN** intranet navigation is rendered for a subuser lacking `orders` permission
- **THEN** Histórico de pedidos and Pedido rápido items are omitted from the sidebar
- **AND** permitted items retain correct hrefs

### Requirement: Dashboard shows pending approval badge for superadmin

When the company has orders in `pending_company_approval`, the intranet dashboard SHALL show a non-blocking badge or card linking to the approval queue for `b2b_superadmin` only.

#### Scenario: Superadmin sees pending count

- **WHEN** a superadmin loads `/intranet` and two orders await company approval
- **THEN** a visible indicator shows pending approvals count
- **AND** activating it navigates to the approval UI in mi-cuenta or dedicated panel

#### Scenario: Subuser does not see approval badge

- **WHEN** a subuser loads `/intranet`
- **THEN** the superadmin approval badge is not rendered
