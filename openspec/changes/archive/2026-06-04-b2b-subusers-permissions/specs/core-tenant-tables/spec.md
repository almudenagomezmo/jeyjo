## ADDED Requirements

### Requirement: Web profiles store display name and active flag

The `public.web_profiles` table SHALL include `display_name` (text, nullable) and `is_active` (boolean NOT NULL default true) to support subuser management (US-12 CA1, CA4).

#### Scenario: New subuser profile has display name

- **WHEN** a superadmin creates a subuser with display name "Compras Almacén"
- **THEN** the `web_profiles` row stores `display_name` accordingly
- **AND** `is_active` defaults to true

#### Scenario: Deactivated profile retains row

- **WHEN** superadmin deactivates a subuser
- **THEN** `is_active` is set to false
- **AND** the row is not deleted

### Requirement: Subuser permissions json encodes RF-003 section flags

The `permissions` jsonb column SHALL store section flags `finance`, `orders`, `account`, and `ordersRequireApproval` with application-layer validation on write (RF-003).

#### Scenario: Permissions persisted on create

- **WHEN** superadmin creates a subuser with `{ finance: false, orders: true, account: false, ordersRequireApproval: true }`
- **THEN** the value is stored in `permissions` jsonb
- **AND** subsequent login resolves the same effective flags
