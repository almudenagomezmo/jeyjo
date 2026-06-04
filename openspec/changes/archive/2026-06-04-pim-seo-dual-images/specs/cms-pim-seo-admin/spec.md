## ADDED Requirements

### Requirement: Admin labels separate catalog vs SEO images

The product admin UI SHALL label `providerImageUrl` and `ownImage` as catalog/display images and SHALL document that `meta.image` in the SEO Preview tab is used for Open Graph and structured data (US-16 CA1, RF-024).

#### Scenario: Marketing tab shows catalog image help text

- **WHEN** a catalog staff user opens the Marketing / SEO tab
- **THEN** field descriptions state that own/provider images are for storefront catalog display
- **AND** the SEO Preview tab description states that `meta.image` is for social sharing when set

### Requirement: Bulk SEO template application US-16 CA3

The CMS SHALL expose a staff-only bulk action that applies a configurable template (default: `[Nombre del Producto] - Compra online al mejor precio en Jeyjo`) to `meta.description` and/or `metaDescription` for selected published products in one operation.

#### Scenario: Bulk apply to selection

- **WHEN** a staff user selects published products and runs "Aplicar plantilla SEO" with the default template
- **THEN** each selected product receives `meta.description` derived from its title with the template pattern
- **AND** an audit log entry is recorded per product update

#### Scenario: Bulk apply respects empty-only option

- **WHEN** the staff user enables "solo campos vacíos" and runs bulk apply
- **THEN** products that already have `meta.description` or `metaDescription` are not overwritten

### Requirement: PIM health panel US-16 CA4 partial

The CMS SHALL provide a staff view listing counts and drill-down links for published products missing catalog image, missing meta description, or sharing a duplicate slug.

#### Scenario: Missing catalog image alert

- **WHEN** a published product has neither `ownImage` nor `providerImageUrl`
- **THEN** it appears in the "Sin imagen de catálogo" section of the health panel

#### Scenario: Missing meta description alert

- **WHEN** a published product has empty `metaDescription` and empty `meta.description`
- **THEN** it appears in the "Sin metadescripción" section

#### Scenario: Duplicate slug alert

- **WHEN** two or more published products share the same slug
- **THEN** the health panel lists those slugs with links to each product
