## ADDED Requirements

### Requirement: Products collection models Jeyjo catalog entity

The CMS SHALL expose a Payload `products` collection aligned with architecture entity PRODUCTO, including ERP read-only fields and editable enrichment fields in separate admin tabs.

#### Scenario: Admin views product with ERP tab

- **WHEN** a staff user opens a product in the Payload admin
- **THEN** fields `skuErp`, `mainWholesaleRef`, `oemRef`, `ean`, `shortDescription`, `p1Price`, `p2Price`, `vatRate`, `packUnit`, `isWildcard`, `allowOrderWithoutStock`, and `syncErpAt` appear grouped under a read-only ERP tab

#### Scenario: Staff cannot edit ERP fields manually

- **WHEN** a staff user attempts to save changes to ERP read-only fields via the admin UI
- **THEN** the save is rejected or the fields remain unchanged until a future ERP sync hook updates them

### Requirement: Categories collection supports hierarchy

The CMS SHALL expose a `categories` collection with hierarchical parent relationship, sort order, slug, and optional image URL.

#### Scenario: Nested category assignment

- **WHEN** a staff user sets `parent` on a category to another category
- **THEN** the relationship is persisted and the admin list reflects the hierarchy

#### Scenario: Unique category slug

- **WHEN** two categories are saved with the same slug
- **THEN** validation fails with a duplicate slug error

### Requirement: Suppliers collection links to products

The CMS SHALL expose a `suppliers` collection with at minimum `name`, `erpCode`, `type`, and `baseImageUrl`, and products SHALL reference one optional supplier.

#### Scenario: Product assigned to supplier

- **WHEN** a staff user selects a supplier on a product
- **THEN** the product stores the supplier relationship and the supplier appears in admin columns or sidebar

### Requirement: Catalog collections are staff-only

Access to create, read, update, and delete on `products`, `categories`, and `suppliers` SHALL require Payload admin authentication (staff `users`).

#### Scenario: Unauthenticated API request denied

- **WHEN** an unauthenticated client calls the Payload REST API to create a product
- **THEN** the request is rejected with an authorization error
