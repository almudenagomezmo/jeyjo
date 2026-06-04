## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: CMS README documents template debt

The cms app SHALL include a README noting Stripe/ecommerce template origin, that Jeyjo payment integration is deferred to later roadmap changes, and that business collections replace the generic ecommerce demo as the active backoffice model.

#### Scenario: Developer reads cms README

- **WHEN** a developer opens `apps/cms/README.md`
- **THEN** they see that Payload is the Jeyjo backoffice base, Stripe is not the target production payment stack, and catalog/order collections are defined in change payload-collections-bootstrap
