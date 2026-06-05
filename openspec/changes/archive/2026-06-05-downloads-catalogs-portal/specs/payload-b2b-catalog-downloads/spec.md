# Payload B2B catalog downloads

## Purpose

Payload `b2b-catalog-downloads` collection for commercial PDF catalogs and offer magazines with validity windows (alcance §1.24, change #41).

## ADDED Requirements

### Requirement: B2B catalog downloads collection models commercial documents

The CMS SHALL expose a `b2b-catalog-downloads` collection with fields: `title` (required), `description` (optional text), `documentType` (`catalog`, `offer_magazine`, `other`), `file` (required upload relation to `media`, PDF only), optional `coverImage` (upload relation to `media`), `validFrom` (required date), `validUntil` (required date), optional `customerGroups` (select one or more of `2`, `3`, `4`), and `published` (boolean, default false).

#### Scenario: Staff creates a catalog download

- **WHEN** marketing staff creates a document with title "Catálogo General 2026", type `catalog`, PDF file, `validFrom` 2026-01-01, `validUntil` 2026-12-31, and `published` true
- **THEN** the document persists with all fields
- **AND** the linked media record stores the PDF

#### Scenario: ValidUntil must be on or after validFrom

- **WHEN** staff sets `validUntil` before `validFrom`
- **THEN** validation rejects the save with a clear error

### Requirement: Empty customerGroups means all B2B groups

When `customerGroups` is empty or unset, the document SHALL be eligible for all B2B customer groups (2, 3, and 4).

#### Scenario: No group filter applies to all

- **WHEN** a published document has no `customerGroups` selected
- **THEN** storefront queries for groups 2, 3, and 4 include the document when within validity

#### Scenario: Group filter restricts visibility

- **WHEN** a published document has `customerGroups` `[3]` only
- **THEN** only customers with `customer_group` 3 receive it in storefront queries

### Requirement: B2B catalog downloads staff access

Only authenticated Payload staff with `superadmin`, `marketing`, or `personalizacion` in `staffRoles` SHALL have create, read, update, and delete access to `b2b-catalog-downloads` in admin. Public REST read SHALL be denied without the storefront API key.

#### Scenario: Marketing staff manages downloads

- **WHEN** a marketing user opens the B2B catalog downloads collection in admin
- **THEN** they can create, edit, and delete documents

#### Scenario: Catalog-only staff denied

- **WHEN** a catalogo-only staff user requests `b2b-catalog-downloads` admin or REST without API key
- **THEN** access is denied with 403 semantics

### Requirement: Catalog download changes write audit log

Create, update, and delete operations on `b2b-catalog-downloads` SHALL emit audit log entries per `backoffice-audit-console`.

#### Scenario: Publish writes audit entry

- **WHEN** staff sets `published` from false to true on a catalog download
- **THEN** an audit log entry records the change with operator and document id

### Requirement: PDF upload constraints

The `file` field SHALL accept only PDF MIME types with maximum size 25 MB.

#### Scenario: Non-PDF rejected

- **WHEN** staff attempts to upload a `.docx` as the catalog file
- **THEN** validation rejects the upload
