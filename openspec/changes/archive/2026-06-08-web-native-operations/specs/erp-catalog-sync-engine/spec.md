## MODIFIED Requirements

### Requirement: Catalog read sync orchestrator runs full stub pull

When `systemSettings.webNativeMode` is false, the CMS SHALL expose an orchestrator that pulls all suppliers and products from the active `ErpCatalogReader`, applies them through `ErpCatalogSyncService`, and returns aggregated counters and errors for the run. When `webNativeMode` is true, manual and scheduled catalog sync endpoints SHALL respond with HTTP 410 and SHALL NOT invoke the orchestrator.

#### Scenario: Successful full sync from stub in ERP mode

- **WHEN** `webNativeMode` is false and the orchestrator runs with `ERP_ADAPTER=stub`
- **THEN** supplier and product commercial fields update, `syncErpAt` is refreshed, and the result reports counters

#### Scenario: Catalog sync blocked in web-native mode

- **WHEN** `webNativeMode` is true and staff or cron triggers catalog sync
- **THEN** the response status is 410
- **AND** no Payload commercial fields change

#### Scenario: Partial item failure does not abort batch in ERP mode

- **WHEN** `webNativeMode` is false and one product DTO fails validation during sync but others are valid
- **THEN** valid products still update and the result includes an error entry for the failed SKU
