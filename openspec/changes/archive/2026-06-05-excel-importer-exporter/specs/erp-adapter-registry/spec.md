## ADDED Requirements

### Requirement: Excel adapter is registered when ERP_ADAPTER is excel

When `ERP_ADAPTER=excel`, the registry SHALL provide working `ErpCatalogReader` and `ErpCatalogWriter` implementations from the Excel adapter module without falling back to stub.

#### Scenario: Excel adapter resolves successfully

- **WHEN** `ERP_ADAPTER=excel` and the Excel adapter module is deployed
- **THEN** `getErpAdapters()` returns a bundle with `kind=excel`
- **AND** `catalogReader.listProducts` executes without `ERP_NOT_IMPLEMENTED`

#### Scenario: API adapter still not implemented

- **WHEN** `ERP_ADAPTER=api`
- **THEN** resolution fails with `ERP_NOT_IMPLEMENTED` or a clear configuration error
- **AND** the registry does not silently fall back to stub in production

## MODIFIED Requirements

### Requirement: Unimplemented adapters are not silently stubbed

When `ERP_ADAPTER` is `api` before that change ships, the registry SHALL NOT fall back to stub in production without explicit override. The Excel adapter SHALL be considered implemented after change `excel-importer-exporter`.

#### Scenario: Excel adapter requested after implementation

- **WHEN** `ERP_ADAPTER=excel` and the Excel adapter module is registered
- **THEN** resolution succeeds with the Excel adapter bundle

#### Scenario: API adapter requested before implementation

- **WHEN** `ERP_ADAPTER=api` and the API adapter module is not registered
- **THEN** resolution fails with `ERP_NOT_IMPLEMENTED` or a clear configuration error documented for operators
