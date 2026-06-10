## ADDED Requirements

### Requirement: Group offer quote label is Oferta de grupo

When `resolvePrice` applies `group_offer`, the optional `label` field SHALL be **Oferta de grupo** (not «En oferta»).

#### Scenario: Group offer label

- **WHEN** `resolvePrice` returns `appliedRule` `group_offer`
- **THEN** `label` is `Oferta de grupo`

## MODIFIED Requirements

### Requirement: Price resolution applies RF-007 priority chain

The `@jeyjo/pricing` package SHALL expose `resolvePrice` that evaluates pricing rules in strict order: (1) valid customer special price, (2) active group offer, (3) B2B P2 minus general discount when no offer applied, (4) P1 for anonymous or B2C customers. When both (1) and (2) match, (1) SHALL prevail.

#### Scenario: Special price wins over concurrent group offer

- **WHEN** a validated B2B customer has active special price 5.00 and an active group offer 8.00 for the same SKU
- **THEN** `netUnit` is 5.00
- **AND** `appliedRule` is `special_price`
