## MODIFIED Requirements

### Requirement: Scheduled stock sync trigger is protected

When `systemSettings.webNativeMode` is false, the system SHALL expose a cron-invokable HTTP route that runs the stock sync orchestrator only when presented with a valid `CRON_SECRET` bearer token. When `webNativeMode` is true, the route SHALL respond with HTTP 410 and SHALL NOT mutate catalog stock fields.

#### Scenario: Cron with valid secret in ERP mode

- **WHEN** `webNativeMode` is false and a request includes `Authorization: Bearer <CRON_SECRET>` matching configuration
- **THEN** the stock orchestrator executes and returns HTTP 200 with sync summary JSON

#### Scenario: Cron blocked in web-native mode

- **WHEN** `webNativeMode` is true and cron stock sync is invoked
- **THEN** the response status is 410
- **AND** no product stock fields change

#### Scenario: Cron without valid secret

- **WHEN** a request omits or presents an invalid cron secret
- **THEN** the route responds with HTTP 401 and does not mutate catalog data
