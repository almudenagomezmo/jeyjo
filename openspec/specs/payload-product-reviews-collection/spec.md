# Payload product reviews collection

## Purpose

Payload `product-reviews` collection for moderated customer product ratings (stars + comment) with denormalized aggregates on products (RF-012, US-03).

## Requirements

### Requirement: Product reviews collection models moderated ratings

The CMS SHALL expose a `product-reviews` collection with fields: `product` (relationship to `products`, required), `skuErp` (text, denormalized), `customerId` (Supabase customer uuid), `webProfileId` (Supabase auth uid), `authorDisplayName` (text snapshot), `rating` (integer 1–5, required), `comment` (plain text, required), `status` (`pending`, `approved`, `rejected`), optional staff-only `rejectionNote`, optional `moderatedBy` (staff user), optional `moderatedAt`, and automatic `createdAt` / `updatedAt`.

#### Scenario: Review created with pending status

- **WHEN** the storefront successfully submits a new review
- **THEN** a `product-reviews` document exists with `status` `pending`
- **AND** `skuErp` matches the linked product `skuErp`

#### Scenario: One review per profile and product

- **WHEN** a logged-in customer already has a review document for the same product
- **AND** they submit another create request
- **THEN** the CMS rejects the duplicate with a uniqueness violation
- **AND** the storefront receives a conflict response

### Requirement: Review status lifecycle

Review `status` SHALL follow: `pending` → `approved` or `rejected` by staff. When the author edits `rating` or `comment` via the storefront, `status` SHALL reset to `pending` regardless of prior `approved` or `rejected` state. Labels in admin UI SHALL display Spanish equivalents (Pendiente, Aprobada, Rechazada).

#### Scenario: Initial status is pending

- **WHEN** a new review is created from the storefront
- **THEN** `status` is `pending`

#### Scenario: Author edit resets to pending

- **WHEN** an `approved` review is updated by its author from the storefront
- **THEN** `status` becomes `pending`
- **AND** the review is excluded from public listing until staff re-approves

#### Scenario: Staff approves review

- **WHEN** staff sets `status` to `approved`
- **THEN** `moderatedAt` is recorded
- **AND** the review becomes eligible for public storefront display

### Requirement: Staff cannot create reviews manually

Payload admin and REST `create` for `product-reviews` SHALL be denied for authenticated staff users. Only the storefront service API key SHALL be allowed to create documents. Staff SHALL have read, update (status/moderation fields), and delete access.

#### Scenario: Staff create denied in admin

- **WHEN** a catalogo staff user attempts to create a review from Payload admin
- **THEN** create is denied

#### Scenario: Storefront API key creates review

- **WHEN** the storefront calls Payload create with a valid `STOREFRONT_PAYLOAD_API_KEY`
- **THEN** the review document is persisted

### Requirement: Product aggregates denormalized on approve

The `products` collection SHALL include `reviewCount` (number, default 0) and `ratingAverage` (number or null). After any `product-reviews` create, update, or delete affecting `status` or `rating`, a hook SHALL recalculate aggregates from all `approved` reviews for that product: `reviewCount` = count, `ratingAverage` = arithmetic mean of `rating` rounded to one decimal, or null when count is zero.

#### Scenario: First approval updates product

- **WHEN** the first review for a product is approved with `rating` 5
- **THEN** the linked product has `reviewCount` 1 and `ratingAverage` 5.0

#### Scenario: Rejection removes review from aggregates

- **WHEN** an approved review is rejected by staff
- **THEN** product aggregates exclude that review in the recalculation

#### Scenario: Pending edit of approved review updates aggregates

- **WHEN** an author edits an approved review and it returns to `pending`
- **THEN** product aggregates recalculate without that review until re-approved

### Requirement: Product reviews are catalog-staff managed

Only authenticated Payload staff users with `superadmin` or `catalogo` in `staffRoles` SHALL have read, update, and delete access to `product-reviews` in admin and inbox views. Audit hooks SHALL record staff mutations consistent with other catalog collections.

#### Scenario: Catalog staff lists reviews

- **WHEN** a catalogo user opens the product-reviews collection
- **THEN** reviews are listed with status, product, rating, author display name, and date

#### Scenario: Administracion-only staff denied

- **WHEN** an administracion-only staff user requests product-reviews admin or REST API
- **THEN** access is denied with 403 semantics
