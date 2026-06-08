# Backoffice web-native catalog

## Purpose

Staff-editable commercial catalog fields and Excel import/export when ERP sync is disabled.

## Requirements

### Requirement: Commercial product fields are staff-editable in web-native mode

When `systemSettings.webNativeMode` is true, the CMS SHALL allow staff with `products` update access to edit commercial fields on products: `skuErp`, `mainWholesaleRef`, `oemRef`, `ean`, `shortDescription`, `p1Price`, `p2Price`, `vatRate`, `packUnit`, `isWildcard`, and `allowOrderWithoutStock`, without requiring `erpSync` request context.

#### Scenario: Staff saves P1 and P2 prices

- **WHEN** a catalogo staff user updates `p1Price` and `p2Price` on a published product and saves
- **THEN** the new prices persist in Payload
- **AND** an `audit_log` entry records the change

#### Scenario: API client cannot bypass staff access

- **WHEN** an unauthenticated API request attempts to update `p1Price`
- **THEN** the update is denied per Payload access control

### Requirement: Commercial tab label replaces ERP tab in admin UI

The product admin UI SHALL display commercial fields under a tab labeled **Datos comerciales** (not "Datos ERP") when `webNativeMode` is true. Field label for `skuErp` SHALL read **Referencia / SKU**.

#### Scenario: Admin sees commercial tab name

- **WHEN** staff opens a product in web-native mode
- **THEN** the commercial fields tab title is **Datos comerciales**
- **AND** `skuErp` is labeled **Referencia / SKU**

### Requirement: Suppliers are staff-editable in web-native mode

When `webNativeMode` is true, staff SHALL edit supplier fields `erpCode`, `name`, `type`, and `baseImageUrl` directly without ERP sync context.

#### Scenario: Staff creates supplier manually

- **WHEN** staff creates a supplier with `erpCode` DIST-NEW and name "Nuevo proveedor"
- **THEN** the supplier is persisted and selectable on products

### Requirement: Excel catalog import writes commercial fields directly

When `webNativeMode` is true, catalog Excel import apply SHALL upsert commercial product fields through normal Payload writes without invoking `ErpCatalogReader` or setting `erpSync` context.

#### Scenario: Excel import updates price

- **WHEN** staff applies an Excel row with SKU REF-001 and new `p2Price` 12.50
- **THEN** the product REF-001 reflects `p2Price` 12.50 after apply
- **AND** no ERP sync orchestrator runs

### Requirement: Excel catalog export reflects CMS commercial data

The existing catalog export endpoint SHALL continue to export commercial fields from Payload products for staff download when `webNativeMode` is true.

#### Scenario: Export includes edited prices

- **WHEN** staff exports catalog after editing `p1Price` on a product
- **THEN** the downloaded Excel row includes the updated `p1Price`
