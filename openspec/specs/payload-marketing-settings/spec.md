# Payload marketing settings

## Purpose

Payload global `marketingSettings` for abandoned cart recovery configuration (US-23, RF-027, change #31).

## Requirements

### Requirement: Marketing global settings singleton

The CMS SHALL expose a Payload global `marketing-settings` with abandoned cart configuration: `abandonedCartEnabled`, `firstEmailDelayMinutes`, `secondEmailDelayMinutes`, `secondEmailDiscountPercent`, optional `secondEmailUseFixedCoupon` relationship, `b2bRecoveryEnabled`, and `b2bRecoveryCustomerGroups` (array of pricing group codes).

#### Scenario: Default delays match US-23

- **WHEN** marketing settings are seeded or first opened
- **THEN** `firstEmailDelayMinutes` is 120
- **AND** `secondEmailDelayMinutes` is 1440
- **AND** `secondEmailDiscountPercent` defaults to 10 until business confirms otherwise

### Requirement: B2B recovery is opt-in per group US-23 CA4

Abandoned cart recovery emails for B2B customers SHALL only run when `b2bRecoveryEnabled` is true and the customer's pricing group is listed in `b2bRecoveryCustomerGroups`.

#### Scenario: B2B recovery disabled globally

- **WHEN** `b2bRecoveryEnabled` is false
- **THEN** no abandoned cart emails are sent to B2B profiles regardless of group

#### Scenario: B2B recovery enabled for one group

- **WHEN** `b2bRecoveryEnabled` is true and groups include `DISTRIBUIDOR`
- **AND** a B2B customer in group `DISTRIBUIDOR` abandons a cart
- **THEN** recovery emails MAY be sent per delay settings

#### Scenario: B2B group not in allowlist skipped

- **WHEN** `b2bRecoveryEnabled` is true but customer group `RETAIL` is not in the list
- **THEN** no recovery email is sent for that profile
