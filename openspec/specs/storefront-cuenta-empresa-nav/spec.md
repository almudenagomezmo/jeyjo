# Storefront cuenta empresa navigation

## Purpose

Unified account sidebar with Personal and Empresa sections, B2B empresa routes under `/cuenta/empresa/*`, legacy `/intranet` redirects, and portal shell on empresa routes.

## Requirements

### Requirement: Unified account sidebar with Personal and Empresa sections

The storefront SHALL render `/cuenta` with a sidebar containing two labeled sections: **Personal** (visible to all authenticated customers) and **Empresa** (visible only to validated B2B customers, filtered by `storefront-b2b-permissions`).

#### Scenario: B2C user sees only Personal section

- **WHEN** an authenticated B2C user (`customer_group = 1`) opens `/cuenta`
- **THEN** the sidebar shows Personal links only
- **AND** no Empresa section is rendered

#### Scenario: B2B user sees both sections

- **WHEN** a validated B2B user opens `/cuenta`
- **THEN** the sidebar shows Personal links and Empresa links
- **AND** Empresa links point to `/cuenta/empresa/*` routes

### Requirement: B2B empresa routes under cuenta prefix

All B2B portal sections (Contabilidad, Histórico de pedidos, Pedido rápido, Precios especiales, RMA, Descargas, Contacto, Preferencias) SHALL be served under `/cuenta/empresa/*` instead of `/intranet/*`.

#### Scenario: Contabilidad subroutes resolve

- **WHEN** a validated B2B user with `finance: true` opens `/cuenta/empresa/contabilidad/facturas`
- **THEN** the invoices panel renders within the cuenta layout with Empresa chrome

### Requirement: Legacy intranet URLs redirect permanently

The storefront SHALL respond with HTTP 308 to `/intranet` and `/intranet/*` requests, mapping each path to its `/cuenta` or `/cuenta/empresa/*` equivalent.

#### Scenario: Old intranet dashboard redirects

- **WHEN** a client requests `/intranet`
- **THEN** the response is a 308 redirect to `/cuenta`

#### Scenario: Old stock route redirects to unified avisos

- **WHEN** a client requests `/intranet/stock`
- **THEN** the response is a 308 redirect to `/cuenta/avisos-stock`

### Requirement: Portal shell on empresa routes

Routes under `/cuenta/empresa/*` SHALL activate portal mode per `storefront-shell-navigation`: simplified top bar, no public footer, and RF-011 net price indicator.

#### Scenario: Empresa route uses portal top bar

- **WHEN** a validated B2B user loads `/cuenta/empresa/pedidos`
- **THEN** the portal top bar is shown instead of the full shop header
