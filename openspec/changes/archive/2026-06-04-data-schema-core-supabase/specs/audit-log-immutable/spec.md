## ADDED Requirements

### Requirement: Audit log table is append-only

The database SHALL expose `public.audit_log` with: `id` (uuid PK), `actor_user_id` (uuid nullable), `actor_name` (text), `action` (text), `entity_type` (text), `entity_id` (uuid nullable), `previous_value` (jsonb), `new_value` (jsonb), `created_at` (timestamptz), `source_ip` (inet nullable).

#### Scenario: Backoffice change creates log entry

- **WHEN** a privileged write occurs in Payload (future hooks in change #5)
- **THEN** a new row is inserted with action and entity metadata

### Requirement: No update or delete for application roles

RLS and grants SHALL prevent roles `authenticated` and `anon` from `UPDATE` or `DELETE` on `audit_log`. Only `service_role` or a dedicated migration role may perform maintenance in non-production emergencies.

#### Scenario: Compromised storefront token cannot erase audit

- **WHEN** role `authenticated` attempts `DELETE FROM audit_log`
- **THEN** the operation fails or affects zero rows

### Requirement: Retention supports RD-002 minimum

The schema SHALL use `timestamptz` and document retention of at least 2 years; archival to cold storage is out of scope for this change.

#### Scenario: Historical entries remain queryable

- **WHEN** an auditor queries logs older than 30 days
- **THEN** rows remain available unless an explicit future purge job runs per RD-002 policy
