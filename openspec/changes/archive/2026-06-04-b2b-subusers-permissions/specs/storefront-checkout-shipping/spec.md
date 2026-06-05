## ADDED Requirements

### Requirement: B2B subuser checkout respects orders permission and approval flag

B2B checkout place-order SHALL require `orders` permission for `b2b_subuser` sessions and SHALL branch order status per `storefront-b2b-order-approval`.

#### Scenario: Subuser without orders permission cannot place order

- **WHEN** a subuser with `orders: false` calls checkout place-order
- **THEN** the response status is 403

#### Scenario: Subuser with approval required creates pending company order

- **WHEN** a subuser with `orders: true` and `ordersRequireApproval: true` completes place-order
- **THEN** the created order status is `pending_company_approval`
- **AND** the response message indicates approval is required before Jeyjo processing
