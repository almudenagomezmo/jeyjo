# CMS app bootstrap

## Purpose

Host Payload CMS in the monorepo as the Jeyjo backoffice, with documented template debt and CI-compatible build.

## Requirements

### Requirement: CMS application in monorepo

The repository SHALL contain `apps/cms` as the Payload CMS application, migrated from the existing `jeyjo_back` template without losing the ability to run `dev` and `build`.

#### Scenario: CMS dev server starts

- **WHEN** `pnpm --filter cms dev` runs with valid database env
- **THEN** the Payload admin and API are reachable on port 3001 (or documented alternate)

### Requirement: CMS build succeeds in workspace

The cms package SHALL include a `build` script that completes in CI when database URL is mocked or skipped per documented CI strategy.

#### Scenario: CI build cms

- **WHEN** CI runs `pnpm build` for the cms package
- **THEN** the Next.js + Payload production build completes or is explicitly skipped with a documented env gate and storefront still gates merge

### Requirement: CMS documents staff auth policy

The cms app README SHALL document that Payload `users` are for Jeyjo staff only, that MFA TOTP is mandatory for staff, the list of `staffRoles`, that storefront customers use Supabase `web_profiles` (change #16), that the admin landing displays the KPI dashboard (change #30), and that operational configuration is managed via `/admin/system-config` and the `systemSettings` global (change #42).

#### Scenario: Developer reads staff auth docs

- **WHEN** a developer opens `apps/cms/README.md` after this change
- **THEN** they see MFA requirement, staff role names, pointer to audit console, KPI dashboard note, and system config hub reference

### Requirement: Environment documents MFA and Supabase audit dependencies

`apps/cms/.env.example` SHALL list variables required for audit console and MFA behavior (e.g. `SUPABASE_SERVICE_ROLE_KEY`, optional `MFA_GRACE_DAYS` for local dev only), dashboard KPI configuration (`TZ`, `DASHBOARD_LOW_STOCK_THRESHOLD`, `TOP_SALES_WINDOW_DAYS`) as **fallbacks** when CMS `systemSettings` is unavailable, and document that operational thresholds and shipping rules are primarily configured via `/admin/system-config`.

#### Scenario: Env example complete

- **WHEN** a developer copies `apps/cms/.env.example`
- **THEN** comments explain which vars are required for audit log writes and staff MFA in development
- **AND** dashboard-related variables are listed as fallbacks with pointer to `systemSettings`
- **AND** shipping and stock threshold env vars note CMS precedence

### Requirement: CMS README documents template debt

The cms app SHALL include a README noting Stripe/ecommerce template origin, that Jeyjo payment integration is deferred to later roadmap changes, that business collections replace the generic ecommerce demo as the active backoffice model, and that staff security (MFA + roles + audit) is implemented in change `backoffice-mfa-audit-roles`.

#### Scenario: Developer reads cms README

- **WHEN** a developer opens `apps/cms/README.md`
- **THEN** they see Payload as Jeyjo backoffice, Stripe is not production payments, catalog/order collections from bootstrap change, and staff MFA/roles/audit from change #5

### Requirement: CMS registers Jeyjo business collections on boot

When the CMS application starts with valid database configuration, Payload SHALL register Jeyjo catalog and order collections (`products`, `categories`, `suppliers`, `orders`) in addition to template content collections.

#### Scenario: Admin shows Jeyjo catalog

- **WHEN** `pnpm --filter cms dev` runs after applying this change
- **THEN** the admin navigation includes Products, Categories, and Suppliers collections

### Requirement: Development seed creates sample Jeyjo catalog

The CMS SHALL provide a documented seed path (endpoint or script) that creates at least one supplier, two categories, and two sample products with ERP and enrichment fields populated for local development.

#### Scenario: Developer runs seed

- **WHEN** a developer executes the documented seed command against a fresh local database
- **THEN** sample products appear in the admin with slugs and at least one enrichment field set
