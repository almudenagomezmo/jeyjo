## ADDED Requirements

### Requirement: B2B subuser login redirects to intranet

The login flow SHALL treat validated `b2b_subuser` the same as B2B superadmin for redirect purposes (RF-001).

#### Scenario: Subuser login redirects to intranet

- **WHEN** a user with `role = b2b_subuser`, `is_active = true`, validated company, and valid credentials submits login
- **THEN** the system redirects to `/intranet`
- **AND** loads effective permissions for navigation

#### Scenario: Deactivated subuser login blocked

- **WHEN** a user with `is_active = false` submits valid credentials
- **THEN** the system does not establish a persistent session
- **AND** returns a message that the account has been deactivated by the company administrator
