## MODIFIED Requirements

### Requirement: Low stock threshold is configurable

The CMS and storefront SHALL read the global low-stock threshold from CMS `systemSettings` via `GET /api/system/config`, falling back to `STOCK_LOW_THRESHOLD` environment variable with default **5** for semaphore resolution (CA-ERP-001).

#### Scenario: Custom threshold applied from CMS

- **WHEN** `systemSettings.stockLowThreshold` is 8 and `erpStock=6`
- **THEN** the resolved indicator level is `low`

#### Scenario: Env fallback when CMS unavailable

- **WHEN** `systemSettings` cannot be loaded and `STOCK_LOW_THRESHOLD=10` and `erpStock=8`
- **THEN** the resolved indicator level is `low`

#### Scenario: Default threshold when neither CMS nor env set

- **WHEN** no CMS value and no env override exist and `erpStock=4`
- **THEN** the resolved indicator level is `low` using default threshold 5
