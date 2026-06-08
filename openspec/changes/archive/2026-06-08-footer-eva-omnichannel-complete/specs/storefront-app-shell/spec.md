## ADDED Requirements

### Requirement: Footer satisfies alcance §1.12 beyond newsletter

In addition to the operational newsletter block, the storefront `Footer` SHALL render omnichannel contact, physical stores, social links when configured, EU funding badge when enabled, payment method indicators, and legal micro-links as defined in `storefront-footer-omnichannel`, without breaking the existing responsive grid or newsletter integration.

#### Scenario: Full footer on home page

- **WHEN** a visitor loads `/` with footer configuration and legal pages seeded
- **THEN** the footer displays newsletter, omnichannel contact, store locations, and bottom legal bar in a single cohesive layout

#### Scenario: Footer remains hidden on portal empresa routes

- **WHEN** a validated B2B user loads `/cuenta/empresa/pedidos`
- **THEN** the public footer including new §1.12 sections is not rendered
