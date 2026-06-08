# Payload catalog collections

## Purpose

Payload CMS collections for Jeyjo catalog domain: products, hierarchical categories, and suppliers, with staff-only access and ERP vs enrichment field separation.

## Requirements

### Requirement: Products collection models Jeyjo catalog entity

The CMS SHALL expose a Payload `products` collection aligned with architecture entity PRODUCTO, including commercial fields and editable enrichment fields in separate admin tabs. When `systemSettings.webNativeMode` is true, commercial field values SHALL be editable by authorized staff and SHALL NOT require ERP sync context. When `webNativeMode` is false, ERP field values on disk SHALL only change through authorized ERP sync operations (via `ErpCatalogSyncService` with `erpSync` request context) or equivalent server-side integration entry points. When ERP sync applies a DTO for a SKU that does not yet exist, the service SHALL create a new product in draft status with commercial fields populated and a generated title/slug, leaving enrichment and publication to staff.

#### Scenario: Admin views product with commercial tab

- **WHEN** a staff user opens a product in the Payload admin with `webNativeMode` true
- **THEN** fields `skuErp`, `mainWholesaleRef`, `oemRef`, `ean`, `shortDescription`, `p1Price`, `p2Price`, `vatRate`, `packUnit`, `isWildcard`, `allowOrderWithoutStock`, and `syncErpAt` appear grouped under **Datos comerciales**

#### Scenario: Staff edits commercial fields in web-native mode

- **WHEN** a staff user with products update access saves changes to `p1Price` and `skuErp` with `webNativeMode` true
- **THEN** the saved values persist without ERP sync

#### Scenario: ERP sync updates product and timestamp when ERP mode active

- **WHEN** `webNativeMode` is false and `ErpCatalogSyncService` applies an `ErpProductDto` for an existing product with `erpSync` context
- **THEN** commercial fields update to match the DTO and `syncErpAt` is set to the sync timestamp

#### Scenario: ERP sync creates draft product for new SKU when ERP mode active

- **WHEN** `webNativeMode` is false and `ErpCatalogSyncService` applies an `ErpProductDto` for a SKU not present in Payload with `erpSync` context
- **THEN** a new product is created with `_status` draft, commercial fields from the DTO, generated title/slug, and `syncErpAt` set

### Requirement: Categories collection supports hierarchy

The CMS SHALL expose a `categories` collection with hierarchical parent relationship, sort order, slug, and optional image URL.

#### Scenario: Nested category assignment

- **WHEN** a staff user sets `parent` on a category to another category
- **THEN** the relationship is persisted and the admin list reflects the hierarchy

#### Scenario: Unique category slug

- **WHEN** two categories are saved with the same slug
- **THEN** validation fails with a duplicate slug error

### Requirement: Suppliers collection links to products

The CMS SHALL expose a `suppliers` collection with at minimum `name`, `erpCode`, `type`, and `baseImageUrl`, and products SHALL reference one optional supplier representing the logistics or wholesale source. Products SHALL reference brand identity separately via the `brands` collection (0..1). When `webNativeMode` is true, staff SHALL edit supplier fields directly. When `webNativeMode` is false, fields `erpCode`, `name`, `type`, and `baseImageUrl` on suppliers SHALL only be updated via ERP sync or authorized integration paths.

#### Scenario: Product assigned to supplier

- **WHEN** a staff user selects a supplier on a product
- **THEN** the product stores the supplier relationship and the supplier appears in admin columns or sidebar
- **AND** the supplier relationship does not imply the product brand

#### Scenario: Supplier fields updated via sync when ERP mode active

- **WHEN** `webNativeMode` is false and an ERP sync applies an `ErpSupplierDto` with a matching `erpCode`
- **THEN** the supplier record reflects ERP-provided `name`, `type`, and `baseImageUrl` and remains linkable from products

### Requirement: Product admin distinguishes brand and supplier

The Payload products admin SHALL present separate sidebar fields **Marca** (`brand`) and **Proveedor** (`supplier`), and default list columns SHALL include both when configured.

#### Scenario: Admin views both relationships

- **WHEN** a staff user opens a product in the Payload admin
- **THEN** brand and supplier appear as distinct optional relationship fields

### Requirement: Products store multisource wholesale stock fields

When `webNativeMode` is false, the CMS `products` collection SHALL include read-only fields `distrisantiagoStock`, `arnoiaStock`, `stockIndicator`, `syncDistrisantiagoAt`, and `syncArnoiaAt` updated only via authorized stock sync. When `webNativeMode` is true, staff SHALL edit `erpStock` as **Stock disponible** and `stockIndicator` SHALL be recalculated from manual stock; multisource wholesale fields SHALL not be updated by sync.

#### Scenario: Admin views manual stock in web-native mode

- **WHEN** a staff user opens a product with `webNativeMode` true
- **THEN** **Stock disponible** (`erpStock`) is editable
- **AND** multisource wholesale fields are hidden or read-only

#### Scenario: Staff cannot edit multisource fields in ERP mode

- **WHEN** `webNativeMode` is false and staff attempts to save `distrisantiagoStock` manually
- **THEN** the field remains unchanged until stock sync updates it

#### Scenario: Manual save recalculates indicator in web-native mode

- **WHEN** `webNativeMode` is true and staff sets `erpStock` to 2 with threshold 5
- **THEN** `stockIndicator` reflects low stock after save

### Requirement: ERP stock field sourcing depends on mode

When `webNativeMode` is false, the `erpStock` field SHALL update only via `ErpCatalogSyncService` with `erpSync` context; stock sync MUST NOT overwrite `erpStock`. When `webNativeMode` is true, `erpStock` is staff-editable manual stock and stock sync MUST NOT overwrite it.

#### Scenario: Wholesale sync does not mutate erpStock

- **WHEN** `runStockSync()` updates `distrisantiagoStock` for a product
- **THEN** `erpStock` remains unchanged from the last ERP catalog sync

### Requirement: Catalog collections are staff-only

Access to create, read, update, and delete on `products`, `categories`, and `suppliers` SHALL require Payload admin authentication (staff `users`).

#### Scenario: Unauthenticated API request denied

- **WHEN** an unauthenticated client calls the Payload REST API to create a product
- **THEN** the request is rejected with an authorization error
