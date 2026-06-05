## MODIFIED Requirements

### Requirement: Environment documents MFA and Supabase audit dependencies

`apps/cms/.env.example` SHALL list variables required for audit console and MFA behavior (e.g. `SUPABASE_SERVICE_ROLE_KEY`, optional `MFA_GRACE_DAYS` for local dev only), dashboard KPI configuration (`TZ`, `DASHBOARD_LOW_STOCK_THRESHOLD`, `TOP_SALES_WINDOW_DAYS`) as **fallbacks** when CMS `systemSettings` is unavailable, and document that operational thresholds and shipping rules are primarily configured via `/admin/system-config`.

#### Scenario: Env example complete

- **WHEN** a developer copies `apps/cms/.env.example`
- **THEN** comments explain which vars are required for audit log writes and staff MFA in development
- **AND** dashboard-related variables are listed as fallbacks with pointer to `systemSettings`
- **AND** shipping and stock threshold env vars note CMS precedence

### Requirement: CMS documents staff auth policy

The cms app README SHALL document that Payload `users` are for Jeyjo staff only, that MFA TOTP is mandatory for staff, the list of `staffRoles`, that storefront customers use Supabase `web_profiles` (change #16), that the admin landing displays the KPI dashboard (change #30), and that operational configuration is managed via `/admin/system-config` and the `systemSettings` global (change #42).

#### Scenario: Developer reads staff auth docs

- **WHEN** a developer opens `apps/cms/README.md` after this change
- **THEN** they see MFA requirement, staff role names, pointer to audit console, KPI dashboard note, and system config hub reference
