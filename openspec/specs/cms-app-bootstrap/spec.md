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

### Requirement: CMS README documents template debt

The cms app SHALL include a README noting Stripe/ecommerce template origin, that Jeyjo payment integration is deferred to later roadmap changes, and that business collections replace the generic ecommerce demo as the active backoffice model.

#### Scenario: Developer reads cms README

- **WHEN** a developer opens `apps/cms/README.md`
- **THEN** they see that Payload is the Jeyjo backoffice base, Stripe is not the target production payment stack, and catalog/order collections are defined in change payload-collections-bootstrap

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
