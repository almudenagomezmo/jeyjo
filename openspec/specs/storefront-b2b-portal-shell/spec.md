# Storefront B2B portal shell

## Purpose

Production B2B intranet portal layout at `/intranet`: dedicated top shell, US-07 navigation tree, Contabilidad sub-navigation, section scaffolds, dashboard, and breadcrumbs (change #22, US-07).

## Requirements

### Requirement: B2B portal uses dedicated top shell on intranet routes

The storefront SHALL render a dedicated portal top bar instead of the public shop header and footer when the request path is under `/intranet/*`, while keeping global fonts, theme, and minicart availability.

#### Scenario: Intranet route hides shop mega menu

- **WHEN** a validated B2B user loads `/intranet/pedidos`
- **THEN** the public category mega menu and shop footer are not rendered
- **AND** a portal top bar with link to the public catalog is visible

#### Scenario: Public shop routes keep full shell

- **WHEN** the same B2B user loads `/c/escritura`
- **THEN** the standard sticky shop header and footer are rendered

### Requirement: Intranet navigation config matches US-07 menu

The portal SHALL expose a single navigation configuration with these primary sections: Mi cuenta, Contabilidad, Histórico de pedidos, Pedido rápido, Precios especiales, RMA e incidencias, Avisos de stock, Descargas, Contacto; plus dashboard at `/intranet`.

#### Scenario: All US-07 labels present in sidebar

- **WHEN** a validated B2B user opens `/intranet`
- **THEN** the sidebar lists all nine US-07 section labels with distinct hrefs

#### Scenario: Mi cuenta route is separate from dashboard

- **WHEN** a user activates the sidebar item "Mi cuenta"
- **THEN** the browser navigates to `/intranet/mi-cuenta`
- **AND** not to `/cuenta`

### Requirement: Contabilidad nested navigation scaffold

The portal SHALL provide a Contabilidad section with sub-navigation for Facturas emitidas, Albaranes, Vencimientos, Cifra 347, and Presupuestos as scaffold pages without ERP or PDF data.

#### Scenario: Contabilidad subnav visible on financial routes

- **WHEN** a user opens `/intranet/contabilidad/facturas`
- **THEN** a secondary navigation shows the five Contabilidad subsections
- **AND** "Facturas emitidas" is marked active

#### Scenario: Contabilidad index redirects to facturas

- **WHEN** a user opens `/intranet/contabilidad`
- **THEN** the browser is redirected to `/intranet/contabilidad/facturas`

### Requirement: Explicit intranet routes replace catch-all placeholders

Each US-07 section SHALL have a dedicated App Router page under `/intranet/...` instead of a single catch-all route.

#### Scenario: Pedido rápido has dedicated route

- **WHEN** a user opens `/intranet/pedido-rapido`
- **THEN** a page renders with section title "Pedido rápido"
- **AND** the URL is not served by a generic `[...section]` catch-all

### Requirement: Portal section scaffolds describe upcoming roadmap work

Non-implemented intranet sections SHALL render a structured scaffold with business-oriented copy and reference to the future OpenSpec change that will deliver functionality, without fetching ERP data. Sections that have been delivered by a later roadmap change SHALL render their production UI instead of a scaffold.

#### Scenario: Histórico de pedidos scaffold

- **WHEN** a user opens `/intranet/pedidos` before purchase history is implemented
- **THEN** the page shows an empty state explaining order history is coming
- **AND** no order rows or ERP identifiers are displayed

#### Scenario: Histórico de pedidos production view

- **WHEN** a validated B2B user opens `/intranet/pedidos` after purchase history is implemented
- **THEN** the purchase history list with filters and repeat-to-cart actions is shown
- **AND** the scaffold empty state and "Próximamente" badge are not shown

#### Scenario: Financial scaffold does not expose documents

- **WHEN** a user opens `/intranet/contabilidad/facturas`
- **THEN** the page shows a scaffold message deferring PDF download to change #37
- **AND** no invoice list or download buttons are shown

### Requirement: B2B dashboard provides quick access and company summary

The portal dashboard at `/intranet` SHALL show welcome copy, company summary (commercial name, tax id, customer group label), and quick-access cards linking to each primary intranet section.

#### Scenario: Dashboard quick links navigate to sections

- **WHEN** a user activates a quick-access card for "Precios especiales"
- **THEN** the browser navigates to `/intranet/precios`

#### Scenario: Dashboard shows company header fields

- **WHEN** a validated B2B user loads `/intranet`
- **THEN** commercial name and tax id are visible in the portal header area per US-07 CA5

### Requirement: Intranet breadcrumbs reflect portal hierarchy

Intranet pages SHALL render breadcrumbs starting with "Portal" and including the current section and subsection labels where applicable.

#### Scenario: Contabilidad vencimientos breadcrumb trail

- **WHEN** a user opens `/intranet/contabilidad/vencimientos`
- **THEN** breadcrumbs show Portal → Contabilidad → Vencimientos with correct hrefs

### Requirement: Active state in intranet navigation

The intranet sidebar and Contabilidad sub-navigation SHALL highlight the item matching the current pathname.

#### Scenario: Sidebar highlights pedidos section

- **WHEN** pathname is `/intranet/pedidos`
- **THEN** the "Histórico de pedidos" nav item has active styling
- **AND** the dashboard item is not active

### Requirement: Portal top bar includes shop return and logout

The portal top bar SHALL include a link to the public catalog home, a read-only B2B price mode indicator, and a logout control that clears the session.

#### Scenario: Logout from portal

- **WHEN** a user activates logout in the portal top bar
- **THEN** the session is cleared
- **AND** subsequent `/intranet` requests redirect to login
