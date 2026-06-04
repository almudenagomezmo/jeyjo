## MODIFIED Requirements

### Requirement: Order line items support IVA snapshot field

Each order line item SHALL include an `ivaRateSnapshot` numeric field. The field MUST be populated automatically when the parent order reaches confirmed status, recording the VAT rate in effect at confirmation (RF-007). Before confirmation, the field MAY be empty.

#### Scenario: Line item stores IVA snapshot on confirm

- **WHEN** an order transitions to confirmed with a line for a product at VAT rate 21
- **THEN** `ivaRateSnapshot` on that line is 21

#### Scenario: Historical order unchanged after product VAT edit

- **WHEN** a confirmed order line has `ivaRateSnapshot` 21 and the product VAT is later updated to 10
- **THEN** the line `ivaRateSnapshot` remains 21
