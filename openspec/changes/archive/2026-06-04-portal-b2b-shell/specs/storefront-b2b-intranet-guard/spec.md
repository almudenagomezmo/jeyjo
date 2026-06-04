## MODIFIED Requirements

### Requirement: B2B intranet route shell

The storefront SHALL expose `/intranet` as an authenticated area for validated B2B customers (`customer_group` 2, 3, or 4) with a production portal shell per `storefront-b2b-portal-shell`: dashboard, explicit section routes, Contabilidad sub-navigation, and navigation matching US-07 menu labels (Mi cuenta, Contabilidad, Histórico de pedidos, Pedido rápido, Precios especiales, RMA, Avisos de stock, Descargas, Contacto).

#### Scenario: B2B user lands on intranet after login

- **WHEN** a validated B2B user completes login
- **THEN** the default route is `/intranet` (or `/intranet/dashboard` as child redirecting to `/intranet`)
- **AND** the intranet header shows company `commercial_name` and `tax_id`

#### Scenario: Intranet section pages use structured scaffolds

- **WHEN** a B2B user opens a non-dashboard intranet section that is not yet implemented
- **THEN** the UI shows a structured scaffold with section title and roadmap-oriented empty state
- **AND** does not expose financial documents or ERP transactional data
