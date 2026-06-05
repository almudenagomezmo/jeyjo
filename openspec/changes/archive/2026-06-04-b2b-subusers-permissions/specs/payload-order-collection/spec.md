## ADDED Requirements

### Requirement: Company approval pending status for subuser orders

The orders collection SHALL support `jeyjoStatus` value `pending_company_approval` for B2B subuser orders awaiting superadmin approval before staff confirmation (US-12 CA3).

#### Scenario: Order stores submitter identity

- **WHEN** a subuser places an order requiring company approval
- **THEN** the order persists optional `submittedByUserId` matching the subuser profile uuid
- **AND** `jeyjoStatus` is `pending_company_approval`

#### Scenario: OMS default views exclude company-pending orders

- **WHEN** staff opens the OMS inbox without filtering for company-pending status
- **THEN** orders in `pending_company_approval` are not listed as awaiting Jeyjo confirmation
- **AND** orders appear after transition to `pending_confirmation`

### Requirement: Allowed status transitions include company approval

Staff and storefront APIs SHALL allow transitions: `pending_company_approval` → `pending_confirmation` or `cancelled` for superadmin approval flows.

#### Scenario: Approve company pending order

- **WHEN** storefront superadmin approval API transitions order from `pending_company_approval` to `pending_confirmation`
- **THEN** the transition is accepted by status guards
- **AND** staff may subsequently confirm the order per existing OMS rules

#### Scenario: Invalid skip to confirmed rejected

- **WHEN** an API attempts `pending_company_approval` → `confirmed` without intermediate `pending_confirmation`
- **THEN** the transition is rejected
