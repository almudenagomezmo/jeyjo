## MODIFIED Requirements

### Requirement: CMS documents staff auth policy

The cms app README SHALL document that Payload `users` are for Jeyjo staff only, that MFA TOTP is mandatory for staff, the list of `staffRoles`, that storefront customers use Supabase `web_profiles` (change #16), and that the admin landing displays the KPI dashboard (change #30) replacing the ecommerce template welcome block.

#### Scenario: Developer reads staff auth docs

- **WHEN** a developer opens `apps/cms/README.md` after this change
- **THEN** they see MFA requirement, staff role names, pointer to audit console, and a note that `/admin` shows KPI dashboard per US-19

#### Scenario: Env example complete

- **WHEN** a developer copies `apps/cms/.env.example`
- **THEN** dashboard-related variables are listed including `DASHBOARD_LOW_STOCK_THRESHOLD`, `TOP_SALES_WINDOW_DAYS`, and `ANALYTICS_BEACONS_ENABLED` with defaults documented
