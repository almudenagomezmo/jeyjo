## ADDED Requirements

### Requirement: Intranet routes enforce B2B net price mode presentation

On all `/intranet/*` routes, the storefront SHALL display RF-011 B2B net pricing mode with a read-only "Precios sin IVA" indicator and SHALL NOT allow the manual B2C/B2B price toggle to override session segment.

#### Scenario: Portal top bar shows B2B price label

- **WHEN** a validated B2B user loads `/intranet`
- **THEN** the portal top bar shows "Precios sin IVA" or equivalent B2B net mode label
- **AND** no interactive price mode toggle is offered

#### Scenario: Intranet scaffold amounts use B2B presentation when shown

- **WHEN** any intranet page renders a monetary amount from the pricing engine
- **THEN** the amount follows B2B net presentation rules from RF-011
- **AND** gross VAT is not shown as the primary price
