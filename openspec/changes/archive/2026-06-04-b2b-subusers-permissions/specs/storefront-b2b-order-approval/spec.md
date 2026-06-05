## ADDED Requirements

### Requirement: Subuser orders may require company approval

When a subuser has `ordersRequireApproval: true`, checkout place-order SHALL create the Payload order with `jeyjoStatus = pending_company_approval` instead of `pending_confirmation` (US-12 CA3).

#### Scenario: Subuser with approval flag creates pending order

- **WHEN** a subuser with `ordersRequireApproval: true` completes B2B checkout
- **THEN** the created order has `jeyjoStatus` `pending_company_approval`
- **AND** `submittedByUserId` records the subuser's profile id
- **AND** the confirmation UI explains the order awaits company approval

#### Scenario: Subuser without approval flag uses standard B2B flow

- **WHEN** a subuser with `ordersRequireApproval: false` completes B2B checkout
- **THEN** the order has `jeyjoStatus` `pending_confirmation` as today

#### Scenario: Superadmin orders never require company approval

- **WHEN** a `b2b_superadmin` completes B2B checkout
- **THEN** the order has `jeyjoStatus` `pending_confirmation`
- **AND** `ordersRequireApproval` on any profile is not applied

### Requirement: Superadmin approves or rejects pending company orders

The storefront SHALL expose a queue of `pending_company_approval` orders for the company superadmin with approve and reject actions.

#### Scenario: Approve advances order to staff confirmation

- **WHEN** superadmin approves order ORD-2026-0100 in `pending_company_approval`
- **THEN** `jeyjoStatus` becomes `pending_confirmation`
- **AND** the order becomes visible in OMS inbox per existing rules

#### Scenario: Reject cancels pending order

- **WHEN** superadmin rejects a pending company order with optional reason
- **THEN** `jeyjoStatus` becomes `cancelled`
- **AND** the subuser who submitted can see the order as rejected in their allowed history view

### Requirement: Pending approval queue API is superadmin only

`GET /api/intranet/order-approvals` and approve/reject endpoints SHALL require `b2b_superadmin` and SHALL scope results to the authenticated company's `customerRef`.

#### Scenario: Subuser cannot approve orders

- **WHEN** a subuser calls `POST /api/intranet/order-approvals/:id/approve`
- **THEN** the response status is 403

#### Scenario: Superadmin sees only own company pending orders

- **WHEN** superadmin requests the approval queue
- **THEN** only orders with matching `customerRef` and status `pending_company_approval` are returned
