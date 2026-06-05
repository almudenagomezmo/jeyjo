# payload-order-collection

## ADDED Requirements

### Requirement: Order status change notifies B2B customer RF-022b

When `jeyjoStatus` changes on an order with `customerRef` to a customer-visible state (`confirmed`, `preparing`, `shipped`, `delivered`, or `cancelled`), the CMS SHALL invoke the notification dispatch service for all B2B web profiles of that customer with type `order_status`, including `orderNumber`, Spanish status label, and intranet href.

#### Scenario: Shipped transition creates notification

- **WHEN** staff updates order WEB-2026-0099 from `preparing` to `shipped`
- **AND** the order has `customerRef` for a B2B company
- **THEN** each B2B profile with `order_channel` not `off` receives an in-app notification
- **AND** profiles with email channel receive transactional email

#### Scenario: Internal status does not notify

- **WHEN** `jeyjoStatus` changes from `pending_payment` to `pending_confirmation`
- **THEN** no `order_status` notification is dispatched

#### Scenario: Idempotent status notification

- **WHEN** the same status is saved again without change
- **THEN** no duplicate notification is created
