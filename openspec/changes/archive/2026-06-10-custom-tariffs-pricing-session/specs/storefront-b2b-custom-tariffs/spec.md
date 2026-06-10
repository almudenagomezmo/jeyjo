## MODIFIED Requirements

### Requirement: B2B custom tariffs page replaces precios scaffold

The storefront SHALL render a production custom tariffs view at `/cuenta/empresa/precios` titled **Precios especiales**, replacing the portal scaffold empty state for validated B2B customers (RF-020, US-14). Legacy `/intranet/precios` MAY redirect to the cuenta empresa route per #52.

#### Scenario: Validated B2B user sees tariffs table

- **WHEN** a validated B2B user opens `/cuenta/empresa/precios`
- **THEN** a table of special prices and a group offers section are shown
- **AND** the "Próximamente" scaffold badge is not displayed

## ADDED Requirements

### Requirement: Shop-active price column on custom tariffs

The special prices table and group offers block SHALL include a **Tarifa en tienda** column showing only the net unit price that `resolvePrice` applies today for the authenticated B2B customer in catalog and cart.

#### Scenario: Active special price shown in shop column

- **WHEN** a vigente special price exists for SKU REF-004 and `resolvePrice` returns `special_price` net 5.00
- **THEN** the Tarifa en tienda cell shows `5,00 €` without a rule-type badge

#### Scenario: Expired pact shows alternate rule price with info hint

- **WHEN** a caducado special price exists but an active group offer applies net 8.00
- **THEN** Tarifa en tienda shows `8,00 €`
- **AND** an info icon displays a tooltip explaining the pactado no longer applies in shop

### Requirement: Vigente status uses danger styling

Rows with status **Vigente** SHALL render the status badge with danger (red) presentation; **Caducado** remains neutral/muted.

#### Scenario: Vigente badge is red

- **WHEN** a special price row has status **Vigente**
- **THEN** the status badge uses danger soft background and danger text tokens

### Requirement: Derived discount omits invalid negative percentages

When `discount1Pct` is derived from P2 vs net pactado, the UI SHALL omit the percentage (em dash) when net pactado is greater than or equal to recommended P2.

#### Scenario: Net above P2 shows no derived discount

- **WHEN** recommended P2 is 0.30 and pact net is 100.00 with no ERP `discount1Pct`
- **THEN** Dto. 1 displays an em dash, not a negative percentage
