# Backoffice product reviews moderation

## Purpose

Operational product review moderation inbox in Payload CMS for Jeyjo catalog staff (RF-012).

## Requirements

### Requirement: Reviews inbox displays pending and moderated items

The Payload admin SHALL expose a dedicated product reviews inbox view listing reviews with columns: status, product title, product SKU (`skuErp`), rating, author display name, created date, and a re-edition indicator when a previously approved review returns to `pending`.

#### Scenario: Staff opens reviews inbox

- **WHEN** a user with `catalogo` or `superadmin` opens the product reviews inbox
- **THEN** reviews are listed with all operational columns populated

#### Scenario: Default filter shows pending

- **WHEN** staff opens the inbox without filters
- **THEN** only `pending` reviews are shown by default

### Requirement: Reviews inbox supports operational filters

The inbox SHALL provide filters for `status` (`pending`, `approved`, `rejected`) and search by product SKU, product title, or author display name.

#### Scenario: Filter by status approved

- **WHEN** staff sets status filter to `approved`
- **THEN** only approved reviews are shown

#### Scenario: Search by SKU

- **WHEN** staff searches for REF-001
- **THEN** reviews linked to products with that SKU are shown

### Requirement: Staff may approve or reject reviews from inbox

Staff with `product-reviews` write access SHALL set `status` to `approved` or `rejected` from the inbox. Rejection MAY include an optional staff-only `rejectionNote`. Invalid status values SHALL be rejected inline.

#### Scenario: Approve from inbox

- **WHEN** staff approves a `pending` review from the inbox
- **THEN** the row updates to status **Aprobada**
- **AND** `moderatedAt` is set
- **AND** linked product aggregates update

#### Scenario: Reject from inbox

- **WHEN** staff rejects a `pending` review with an internal note
- **THEN** the row updates to status **Rechazada**
- **AND** the note is stored in `rejectionNote`
- **AND** the review is not visible on the storefront

### Requirement: Staff may delete abusive reviews

Staff with delete access SHALL permanently remove a review document from the inbox or collection admin. Deletion SHALL trigger product aggregate recalculation.

#### Scenario: Delete approved review updates aggregates

- **WHEN** staff deletes an approved review
- **THEN** the document is removed
- **AND** the product `reviewCount` and `ratingAverage` are recalculated
