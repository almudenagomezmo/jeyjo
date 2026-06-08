## ADDED Requirements

### Requirement: Web native mode toggle exists in system settings

The `systemSettings` global SHALL expose `webNativeMode` (boolean, default `true`) indicating the platform operates without ERP or wholesaler stock sync. When `webNativeMode` is true, dependent subsystems SHALL disable ERP catalog sync, stock multisource sync, ERP pricing sync, Avansuite order export, and ERP document/tariff readers in storefront runtime.

#### Scenario: Superadmin enables web native mode

- **WHEN** superadmin sets `webNativeMode` to true and saves
- **THEN** subsequent `GET /api/system/config` includes `webNativeMode: true`
- **AND** an `audit_log` entry records the change

#### Scenario: Env fallback for web native mode

- **WHEN** `systemSettings` cannot be loaded and `WEB_NATIVE_MODE=true` is set in env
- **THEN** consumers treat web native mode as enabled

### Requirement: ERP staleness alerts suppressed in web-native mode

When `webNativeMode` is true, storefront and dashboard degradation logic SHALL NOT treat missing ERP sync as stale catalog data solely based on `catalogStalenessHours` and last ERP sync timestamp.

#### Scenario: No ERP staleness banner in web-native mode

- **WHEN** `webNativeMode` is true and no ERP sync has run
- **THEN** public degradation banners for ERP staleness are not shown

## MODIFIED Requirements

### Requirement: ERP staleness window is configurable RNF-007

The `systemSettings` global SHALL expose `catalogStalenessHours` (default 24) used to determine when cached catalog/stock data is considered stale for public degradation banners when `webNativeMode` is false. When `webNativeMode` is true, `catalogStalenessHours` SHALL NOT drive ERP staleness banners.

#### Scenario: Staleness window applied in ERP mode

- **WHEN** `webNativeMode` is false, `catalogStalenessHours` is 12, and the last successful ERP sync was 13 hours ago
- **THEN** storefront degradation logic treats catalog data as stale

#### Scenario: Staleness window ignored in web-native mode

- **WHEN** `webNativeMode` is true and the last ERP sync was 48 hours ago
- **THEN** ERP staleness banners are not shown
