# Payload catalog collections

## Purpose

Payload CMS collections for Jeyjo catalog domain: products, hierarchical categories, and suppliers, with staff-only access and ERP vs enrichment field separation.

## Requirements

### Requirement: Products collection models Jeyjo catalog entity

The CMS SHALL expose a Payload `products` collection aligned with architecture entity PRODUCTO, including ERP read-only fields and editable enrichment fields in separate admin tabs. ERP field values on disk SHALL only change through authorized ERP sync operations (via `ErpCatalogSyncService` with `erpSync` request context) or equivalent server-side integration entry points, not through staff admin edits or arbitrary API clients. When ERP sync applies a DTO for a SKU that does not yet exist, the service SHALL create a new product in draft status with ERP fields populated and a generated title/slug, leaving enrichment and publication to staff.

#### Scenario: Admin views product with ERP tab

- **WHEN** a staff user opens a product in the Payload admin
- **THEN** fields `skuErp`, `mainWholesaleRef`, `oemRef`, `ean`, `shortDescription`, `p1Price`, `p2Price`, `vatRate`, `packUnit`, `isWildcard`, `allowOrderWithoutStock`, and `syncErpAt` appear grouped under a read-only ERP tab

#### Scenario: Staff cannot edit ERP fields manually

- **WHEN** a staff user attempts to save changes to ERP read-only fields via the admin UI
- **THEN** the save is rejected or the fields remain unchanged until an ERP sync operation updates them

#### Scenario: ERP sync updates product and timestamp

- **WHEN** `ErpCatalogSyncService` applies an `ErpProductDto` for an existing product with `erpSync` context
- **THEN** ERP fields update to match the DTO and `syncErpAt` is set to the sync timestamp

#### Scenario: ERP sync creates draft product for new SKU

- **WHEN** `ErpCatalogSyncService` applies an `ErpProductDto` for a SKU not present in Payload with `erpSync` context
- **THEN** a new product is created with `_status` draft, ERP fields from the DTO, generated title/slug, and `syncErpAt` set

### Requirement: Categories collection supports hierarchy

The CMS SHALL expose a `categories` collection with hierarchical parent relationship, sort order, slug, and optional image URL.

#### Scenario: Nested category assignment

- **WHEN** a staff user sets `parent` on a category to another category
- **THEN** the relationship is persisted and the admin list reflects the hierarchy

#### Scenario: Unique category slug

- **WHEN** two categories are saved with the same slug
- **THEN** validation fails with a duplicate slug error

### Requirement: Suppliers collection links to products

The CMS SHALL expose a `suppliers` collection with at minimum `name`, `erpCode`, `type`, and `baseImageUrl`, and products SHALL reference one optional supplier. Fields `erpCode`, `name`, `type`, and `baseImageUrl` on suppliers SHALL only be updated via ERP sync or authorized integration paths when sourced from ERP, not by manual overwrite of ERP-sourced values without sync context.

#### Scenario: Product assigned to supplier

- **WHEN** a staff user selects a supplier on a product
- **THEN** the product stores the supplier relationship and the supplier appears in admin columns or sidebar

#### Scenario: Supplier ERP fields updated via sync

- **WHEN** an ERP sync applies an `ErpSupplierDto` with a matching `erpCode`
- **THEN** the supplier record reflects ERP-provided `name`, `type`, and `baseImageUrl` and remains linkable from products

### Requirement: Catalog collections are staff-only

Access to create, read, update, and delete on `products`, `categories`, and `suppliers` SHALL require Payload admin authentication (staff `users`).

#### Scenario: Unauthenticated API request denied

- **WHEN** an unauthenticated client calls the Payload REST API to create a product
- **THEN** the request is rejected with an authorization error
