## ADDED Requirements

### Requirement: B2B superadmin can read company subuser profiles

Policies on `web_profiles` SHALL allow a validated `b2b_superadmin` to `SELECT` rows where `role = b2b_subuser` and `customer_id` matches the superadmin's company (RNF-009).

#### Scenario: Superadmin lists subusers via authenticated query

- **WHEN** superadmin A queries `web_profiles` filtered by company
- **THEN** rows for subusers of company A are returned
- **AND** subuser rows of company B are not returned

#### Scenario: Subuser cannot read peer profiles

- **WHEN** subuser A attempts `SELECT` on subuser B's profile in the same company
- **THEN** zero rows are returned unless querying own row

### Requirement: Subuser profile mutations remain self-only

Subusers SHALL NOT update `permissions`, `role`, or `is_active` on any profile via direct authenticated SQL; those mutations occur only through superadmin APIs using service role.

#### Scenario: Subuser cannot elevate permissions

- **WHEN** subuser A attempts `UPDATE web_profiles SET permissions = '{"finance":true}'` on their own row via JWT
- **THEN** the update affects zero rows or is rejected by policy
