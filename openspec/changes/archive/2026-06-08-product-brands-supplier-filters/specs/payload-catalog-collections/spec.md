## MODIFIED Requirements

### Requirement: Suppliers collection links to products

The CMS SHALL expose a `suppliers` collection with at minimum `name`, `erpCode`, `type`, and `baseImageUrl`, and products SHALL reference one optional supplier representing the logistics or wholesale source. Products SHALL reference brand identity separately via the `brands` collection (0..1). When `webNativeMode` is true, staff SHALL edit supplier fields directly. When `webNativeMode` is false, fields `erpCode`, `name`, `type`, and `baseImageUrl` on suppliers SHALL only be updated via ERP sync or authorized integration paths.

#### Scenario: Product assigned to supplier

- **WHEN** a staff user selects a supplier on a product
- **THEN** the product stores the supplier relationship and the supplier appears in admin columns or sidebar
- **AND** the supplier relationship does not imply the product brand

#### Scenario: Supplier fields updated via sync when ERP mode active

- **WHEN** `webNativeMode` is false and an ERP sync applies an `ErpSupplierDto` with a matching `erpCode`
- **THEN** the supplier record reflects ERP-provided `name`, `type`, and `baseImageUrl` and remains linkable from products

## ADDED Requirements

### Requirement: Product admin distinguishes brand and supplier

The Payload products admin SHALL present separate sidebar fields **Marca** (`brand`) and **Proveedor** (`supplier`), and default list columns SHALL include both when configured.

#### Scenario: Admin views both relationships

- **WHEN** a staff user opens a product in the Payload admin
- **THEN** brand and supplier appear as distinct optional relationship fields
