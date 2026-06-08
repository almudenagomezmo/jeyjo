# Payload blog categories collection

## Purpose

Payload `blog-categories` taxonomy for blog posts (US-24 CA2, change #33).

## ADDED Requirements

### Requirement: Blog categories collection models editorial taxonomy

The CMS SHALL expose a `blog-categories` collection with fields: `name` (required text), `slug` (unique, derived from name), and optional `description` (textarea).

#### Scenario: Staff creates a category

- **WHEN** marketing staff creates a category with name "Material de oficina"
- **THEN** the document persists with slug `material-de-oficina`

#### Scenario: Duplicate category slug rejected

- **WHEN** staff attempts to create a second category with the same slug as an existing one
- **THEN** validation rejects the save

### Requirement: Blog categories staff access

Only authenticated Payload staff with `superadmin`, `personalizacion`, or `marketing` in `staffRoles` SHALL have create, read, update, and delete access to `blog-categories` in admin.

#### Scenario: Marketing staff manages categories

- **WHEN** a marketing user opens blog categories in admin
- **THEN** they can create, edit, and delete categories

#### Scenario: Administracion-only staff denied write

- **WHEN** an administracion-only staff user without marketing or personalizacion roles requests blog categories admin
- **THEN** write access is denied

### Requirement: Blog category changes write audit log

Create, update, and delete operations on `blog-categories` SHALL emit audit log entries per `backoffice-audit-console`.

#### Scenario: Category rename audited

- **WHEN** staff updates a category name
- **THEN** an audit log entry records the change

### Requirement: Categories cannot be deleted while referenced

When a category is referenced by at least one `blog-posts` document, delete SHALL be blocked or require reassigning posts first.

#### Scenario: Delete blocked with dependent posts

- **WHEN** staff attempts to delete a category linked to published posts
- **THEN** the operation fails with a clear error indicating dependent posts exist
