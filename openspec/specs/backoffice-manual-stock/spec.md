# Backoffice manual stock

## Purpose

Staff-managed product stock in web-native mode without wholesaler multisource sync.

## Requirements

### Requirement: Available stock is staff-editable on products

When `webNativeMode` is true, staff with `products` update access SHALL edit the product field `erpStock` (admin label **Stock disponible**) as the authoritative available quantity.

#### Scenario: Staff sets stock quantity

- **WHEN** staff sets **Stock disponible** to 42 on a product and saves
- **THEN** `erpStock` persists as 42
- **AND** `syncErpAt` is not required for the save to succeed

#### Scenario: Negative stock rejected

- **WHEN** staff attempts to save `erpStock` -1
- **THEN** validation fails with a clear error

### Requirement: Stock indicator recalculates on manual save

After a successful manual stock save in web-native mode, the CMS SHALL recalculate `stockIndicator` using the configured `stockLowThreshold` from `systemSettings` and the manual `erpStock` value only (ignoring Distrisantiago and Arnoia fields).

#### Scenario: Low stock threshold triggers low indicator

- **WHEN** `stockLowThreshold` is 5 and staff sets `erpStock` to 3
- **THEN** `stockIndicator` is set to `low` after save

#### Scenario: Zero stock triggers limited indicator

- **WHEN** staff sets `erpStock` to 0 and `allowOrderWithoutStock` is false
- **THEN** `stockIndicator` is set to `limited` after save

### Requirement: Multisource stock sync is disabled in web-native mode

When `webNativeMode` is true, scheduled and manual stock sync orchestrators (Distrisantiago, Arnoia, ERP stock paths) SHALL NOT mutate product stock fields. Admin UI SHALL hide or disable multisource stock sync controls.

#### Scenario: Cron stock sync returns gone

- **WHEN** `GET /api/cron/stock-sync` is invoked while `webNativeMode` is true
- **THEN** the response status is 410
- **AND** no product stock fields change

#### Scenario: Multisource fields hidden in admin

- **WHEN** staff opens product stock section in web-native mode
- **THEN** `distrisantiagoStock`, `arnoiaStock`, and their sync timestamps are not editable and are hidden or shown as deprecated read-only zeros
