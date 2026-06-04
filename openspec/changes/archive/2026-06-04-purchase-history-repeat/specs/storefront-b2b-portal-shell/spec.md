## MODIFIED Requirements

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
