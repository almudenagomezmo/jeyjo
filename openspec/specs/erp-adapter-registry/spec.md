# ERP adapter registry

## Purpose

CMS resolution of ERP adapter implementations from configuration, exposing a unified bundle without direct imports of concrete adapters outside the registry.

## Requirements

### Requirement: Adapter selection via environment

The CMS SHALL resolve ERP adapter implementations from `ERP_ADAPTER` with supported values `stub`, `excel`, and `api`.

#### Scenario: Development defaults to stub

- **WHEN** `ERP_ADAPTER` is unset and `NODE_ENV` is `development`
- **THEN** the registry provides stub implementations for catalog reader and writer

#### Scenario: Unknown adapter value fails fast

- **WHEN** `ERP_ADAPTER` is set to an unsupported value
- **THEN** application startup or first registry access fails with a descriptive configuration error

### Requirement: Registry exposes unified adapter bundle

Consumers SHALL obtain catalog reader, catalog writer, and documents reader from a single factory function without importing concrete adapter classes outside the registry module.

#### Scenario: Sync service uses registry

- **WHEN** `ErpCatalogSyncService` needs to pull catalog data
- **THEN** it calls the registry factory and never imports Avansuite or SheetJS modules directly

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

### Requirement: Unimplemented adapters are not silently stubbed

When `ERP_ADAPTER` is `api` before that change ships, the registry SHALL NOT fall back to stub in production without explicit override. The Excel adapter is implemented via change `excel-importer-exporter`.

#### Scenario: Excel adapter requested after implementation

- **WHEN** `ERP_ADAPTER=excel` and the Excel adapter module is registered
- **THEN** resolution succeeds with the Excel adapter bundle

#### Scenario: API adapter requested before implementation

- **WHEN** `ERP_ADAPTER=api` and the API adapter module is not registered
- **THEN** resolution fails with `ERP_NOT_IMPLEMENTED` or a clear configuration error documented for operators
