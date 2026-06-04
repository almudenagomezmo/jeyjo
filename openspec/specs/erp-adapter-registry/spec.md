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

### Requirement: Unimplemented adapters are not silently stubbed

When `ERP_ADAPTER` is `excel` or `api` before those changes ship, the registry SHALL NOT fall back to stub in production without explicit override.

#### Scenario: Excel adapter requested before implementation

- **WHEN** `ERP_ADAPTER=excel` and the Excel adapter module is not registered
- **THEN** resolution fails with `ERP_NOT_IMPLEMENTED` or a clear configuration error documented for operators
