# Backoffice system settings

## Purpose

Unified Payload global and admin hub for operational system configuration per **Alcance §1.36**, **RF-013**, **RF-005**, and **RF-026**, enabling staff to change business rules without code deploys.

## Requirements

### Requirement: System settings global exists in Payload

The CMS SHALL expose a Payload global `systemSettings` grouped under "Configuración del sistema" with tabbed sections for shipping, stock, dashboard alerts, ERP degradation, contact, search, and links to existing configuration globals (payments, marketing, SKAI, analytics, audit).

#### Scenario: Superadmin opens system settings global

- **WHEN** a user with role `superadmin` opens the `systemSettings` global in admin
- **THEN** all editable sections are visible
- **AND** inline help documents env fallbacks where applicable

#### Scenario: Mantenimiento can edit technical sections only

- **WHEN** a user with role `mantenimiento` opens system settings
- **THEN** they can edit search and ERP degradation sections
- **AND** they cannot edit shipping cost fields

#### Scenario: Catalog role denied system settings write

- **WHEN** a user with only role `catalogo` attempts to update `systemSettings`
- **THEN** access is denied per staff role rules RF-030

### Requirement: Public system config API exposes non-secret operational values

The CMS SHALL expose `GET /api/system/config` returning a JSON document with shipping rules, stock low threshold, dashboard alert thresholds, ERP staleness window, contact channels, and search toggles, without secrets or staff-only data.

#### Scenario: Storefront fetches shipping rules

- **WHEN** `GET /api/system/config` is called
- **THEN** the response includes `shipping.b2c.threshold`, `shipping.b2c.cost`, `shipping.b2b.threshold`, and `shipping.b2b.cost`
- **AND** the response is cacheable with `Cache-Control` max-age up to 60 seconds

#### Scenario: API omits secrets

- **WHEN** `GET /api/system/config` is called
- **THEN** the response does not include Qdrant API keys, Resend keys, or staff credentials

### Requirement: Shipping rules are staff-configurable RF-013

The `systemSettings` global SHALL allow staff with roles `superadmin` or `administracion` to configure B2C and B2B free-shipping thresholds and paid-shipping costs with v1 defaults (B2C: 39€ threshold / 5€ cost IVA included; B2B: 10€ threshold / 2.50€ cost).

#### Scenario: Staff raises B2C free shipping threshold

- **WHEN** superadmin sets B2C threshold to 45€ and saves
- **THEN** subsequent `GET /api/system/config` returns threshold 45 for B2C
- **AND** an `audit_log` entry records the change

#### Scenario: Invalid shipping values rejected

- **WHEN** staff attempts to save a negative shipping cost
- **THEN** validation fails and the previous values remain active

### Requirement: Stock and dashboard thresholds are staff-configurable

The `systemSettings` global SHALL allow configuration of: global low-stock threshold for the stock semaphore (default 5), top-sales window in days for dashboard alerts (default 30), and low-stock threshold for top-sales alerts (default 5).

#### Scenario: Staff changes stock low threshold

- **WHEN** superadmin sets `stockLowThreshold` to 8
- **THEN** storefront stock indicators and dashboard top-sales alerts use threshold 8

#### Scenario: Env fallback when CMS unavailable

- **WHEN** `systemSettings` cannot be loaded and `STOCK_LOW_THRESHOLD=10` is set in env
- **THEN** consumers fall back to env value 10 with documented precedence

### Requirement: ERP staleness window is configurable RNF-007

The `systemSettings` global SHALL expose `catalogStalenessHours` (default 24) used to determine when cached catalog/stock data is considered stale for public degradation banners.

#### Scenario: Staleness window applied

- **WHEN** `catalogStalenessHours` is 12 and the last successful ERP sync was 13 hours ago
- **THEN** storefront degradation logic treats catalog data as stale

### Requirement: Contact and store details are configurable

The `systemSettings` global SHALL store public contact channels (support phone, support email, WhatsApp) and physical store names/addresses for Alfaro and Rincón de Soto used by footer, checkout pickup copy, and EVA fallback when SKAI-specific contacts are empty.

#### Scenario: Footer reads support phone from config

- **WHEN** staff updates support phone in system settings
- **THEN** storefront footer renders the new phone on next config fetch

#### Scenario: EVA fallback prefers SKAI settings when set

- **WHEN** `skaiSettings.fallbackPhone` is populated
- **THEN** EVA bootstrap uses SKAI phone over system contact phone

### Requirement: Search operational toggles are configurable

The `systemSettings` global SHALL expose staff-editable search settings: predictive search enabled flag, suggest result limit (default 8), and minimum query length (default 2), without exposing Qdrant credentials.

#### Scenario: Disable predictive search from admin

- **WHEN** mantenimiento disables predictive search in system settings
- **THEN** storefront suggest API returns empty suggestions
- **AND** search UI falls back to non-predictive behavior

### Requirement: System config hub consolidates admin navigation Alcance 1.36

The Payload admin SHALL expose `/admin/system-config` as a hub view linking to `systemSettings` tabs and existing globals (`paymentSettings`, `marketingSettings`, `skaiSettings`, `analyticsSettings`, audit console).

#### Scenario: Superadmin opens config hub

- **WHEN** superadmin navigates to `/admin/system-config`
- **THEN** cards or tabs for each configuration area are shown with deep links

#### Scenario: Administracion sees business sections only

- **WHEN** a user with role `administracion` opens the hub
- **THEN** shipping, stock, and contact sections are accessible
- **AND** security documentation links are read-only

### Requirement: System settings changes are audited

Updates to `systemSettings` SHALL generate immutable `audit_log` entries via Payload hooks with entity type `systemSettings`, capturing prior and new JSON values per RF-029.

#### Scenario: Shipping change audited

- **WHEN** superadmin updates B2C shipping threshold
- **THEN** `audit_log` contains entityType `systemSettings` with old and new threshold values
