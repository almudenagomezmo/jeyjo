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

The cms app SHALL include a README noting Stripe/ecommerce template origin and that Jeyjo payment integration is deferred to later roadmap changes.

#### Scenario: Developer reads cms README

- **WHEN** a developer opens `apps/cms/README.md`
- **THEN** they see that Payload is the Jeyjo backoffice base and Stripe is not the target production payment stack
