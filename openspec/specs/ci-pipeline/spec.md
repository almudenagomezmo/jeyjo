# CI pipeline

## Purpose

Enforce quality gates on pull requests via lint, typecheck, and production build for the monorepo applications.

## Requirements

### Requirement: Continuous integration on pull requests

The repository SHALL include a CI workflow that runs on pull requests and pushes to the main branch.

#### Scenario: PR triggers checks

- **WHEN** a pull request is opened against the default branch
- **THEN** CI runs install, lint, typecheck, and build steps

### Requirement: Lint must pass without errors

CI SHALL run ESLint for both storefront and cms; the workflow MUST fail if lint reports errors.

#### Scenario: Lint failure blocks merge

- **WHEN** ESLint reports an error in either app
- **THEN** the CI job exits with a non-zero status

### Requirement: TypeScript check without emit

CI SHALL run `tsc --noEmit` (or package `typecheck` script) for the storefront and SHALL attempt the same for cms where feasible.

#### Scenario: Type error fails CI

- **WHEN** TypeScript reports a compile error in strict mode
- **THEN** the typecheck job fails

### Requirement: Production build verification

CI SHALL run `next build` (via package build scripts) for the storefront application at minimum.

#### Scenario: Storefront build success

- **WHEN** CI runs the storefront build
- **THEN** the build completes without errors
