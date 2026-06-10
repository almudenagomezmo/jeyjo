## ADDED Requirements

### Requirement: Special price net must not exceed catalog P2

When staff saves a `specialPrices` record, validation SHALL reject `netPrice` greater than the linked product `p2Price` with a clear error message, unless future business rules define exceptions.

#### Scenario: Net above P2 rejected

- **WHEN** staff saves special price net 100.00 for SKU 10102007 whose catalog P2 is 0.30
- **THEN** validation fails with a message that net cannot exceed P2
