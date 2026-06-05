## ADDED Requirements

### Requirement: B2B superadmin manages subusers in mi-cuenta

The storefront SHALL provide a production **Usuarios** section at `/intranet/mi-cuenta` for validated `b2b_superadmin` users to list, create, edit permissions, and deactivate subusers of their company (US-12).

#### Scenario: Superadmin sees subuser list

- **WHEN** a validated B2B superadmin opens `/intranet/mi-cuenta`
- **THEN** a table lists all `b2b_subuser` profiles for the company with display name, email, permission summary, and active status
- **AND** the scaffold "Próximamente" badge for subusers is not shown

#### Scenario: Subuser cannot access user management

- **WHEN** a `b2b_subuser` without `account` permission opens `/intranet/mi-cuenta`
- **THEN** access is denied per `storefront-b2b-permissions`
- **AND** the subuser management UI is not rendered

### Requirement: Superadmin creates subuser with initial credentials

The system SHALL allow a superadmin to create a subuser by providing display name, email, and initial password (US-12 CA1).

#### Scenario: Successful subuser creation

- **WHEN** superadmin submits valid `{ displayName, email, password, permissions }` via `POST /api/intranet/subusers`
- **THEN** Supabase Auth creates the user
- **AND** `web_profiles` row has `role = b2b_subuser`, shared company `customer_id`, and supplied `permissions`
- **AND** the new subuser can log in and land on `/intranet`

#### Scenario: Duplicate email rejected

- **WHEN** superadmin attempts to create a subuser with an email already registered
- **THEN** the API returns 409 with a clear error
- **AND** no duplicate profile is created

### Requirement: Superadmin configures section permissions per subuser

For each subuser, the superadmin SHALL toggle independent access to finance (Contabilidad), orders (histórico, pedido rápido, precios, RMA, stock, descargas), and account data (US-12 CA2).

#### Scenario: Finance disabled hides Contabilidad

- **WHEN** superadmin sets `finance: false` for a subuser and saves
- **THEN** that subuser's effective permissions exclude the finance section
- **AND** navigation and route guards enforce the restriction

#### Scenario: Orders permission gates commercial sections

- **WHEN** superadmin sets `orders: false` for a subuser
- **THEN** the subuser cannot access `/intranet/pedidos`, `/intranet/pedido-rapido`, or related intranet APIs

### Requirement: Superadmin deactivates subuser without deleting history

The superadmin SHALL deactivate a subuser (`is_active = false`) without deleting the auth user or order history (US-12 CA4).

#### Scenario: Deactivated subuser cannot log in

- **WHEN** superadmin deactivates a subuser
- **THEN** subsequent login attempts return an account-disabled message
- **AND** existing sessions for that user are rejected on the next authenticated request

#### Scenario: Deactivated subuser orders remain visible

- **WHEN** a subuser who placed orders is deactivated
- **THEN** those orders remain in company history and approval queues for the superadmin
- **AND** the subuser profile row is retained with `is_active = false`
