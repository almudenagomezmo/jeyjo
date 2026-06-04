## ADDED Requirements

### Requirement: CMS documents staff auth policy

The cms app README SHALL document that Payload `users` are for Jeyjo staff only, that MFA TOTP is mandatory for staff, the list of `staffRoles`, and that storefront customers use Supabase `web_profiles` (change #16).

#### Scenario: Developer reads staff auth docs

- **WHEN** a developer opens `apps/cms/README.md` after this change
- **THEN** they see MFA requirement, staff role names, and pointer to audit console

### Requirement: Environment documents MFA and Supabase audit dependencies

`apps/cms/.env.example` SHALL list variables required for audit console and MFA behavior (e.g. `SUPABASE_SERVICE_ROLE_KEY`, optional `MFA_GRACE_DAYS` for local dev only).

#### Scenario: Env example complete

- **WHEN** a developer copies `.env.example` to `.env`
- **THEN** comments explain which vars are required for audit log writes and staff MFA in development

## MODIFIED Requirements

### Requirement: CMS README documents template debt

The cms app SHALL include a README noting Stripe/ecommerce template origin, that Jeyjo payment integration is deferred to later roadmap changes, that business collections replace the generic ecommerce demo as the active backoffice model, and that staff security (MFA + roles + audit) is implemented in change `backoffice-mfa-audit-roles`.

#### Scenario: Developer reads cms README

- **WHEN** a developer opens `apps/cms/README.md`
- **THEN** they see Payload as Jeyjo backoffice, Stripe is not production payments, catalog/order collections from bootstrap change, and staff MFA/roles/audit from change #5
