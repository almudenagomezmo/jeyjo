## MODIFIED Requirements

### Requirement: Checkout order statuses before payment integration

New web orders from storefront checkout SHALL use status `pending_payment` for B2C segment until payment is authorized, then `confirmed`; B2B segment SHALL use `pending_confirmation` until OMS processing in later roadmap items.

#### Scenario: B2C draft awaits payment

- **WHEN** a B2C checkout completes place-order with a gateway method
- **THEN** the order `status` is `pending_payment`
- **AND** `paymentStatus` is `pending`

#### Scenario: B2C authorized payment confirms order

- **WHEN** Redsys or PayPal authorization succeeds for a B2C order
- **THEN** the order `status` is `confirmed`
- **AND** `paymentStatus` is `authorized`

#### Scenario: B2B draft awaits confirmation

- **WHEN** a B2B checkout completes in this change
- **THEN** the order `status` is `pending_confirmation`
- **AND** no gateway payment fields are required

## ADDED Requirements

### Requirement: Payment transaction fields on orders

The Payload `orders` collection SHALL store payment gateway metadata: `paymentStatus` (pending, authorized, failed, cancelled), `gateway` (redsys, paypal, transfer, erp), `gatewayTransactionId`, `gatewayAuthCode`, `paidAmount`, `paidAt`, and `paymentFailureReason` (nullable).

#### Scenario: Redsys authorization persisted

- **WHEN** a Redsys notification authorizes payment
- **THEN** `gateway` is `redsys`
- **AND** `gatewayAuthCode` and `paidAmount` match the notification
- **AND** `paidAt` is set

#### Scenario: Failed payment records reason

- **WHEN** the customer returns from Redsys with a denied response
- **THEN** `paymentStatus` is `failed`
- **AND** `paymentFailureReason` stores the Redsys response description when available
- **AND** order `status` remains `pending_payment` for retry

#### Scenario: Transfer order gateway marker

- **WHEN** a B2C order is placed with bank transfer
- **THEN** `gateway` is `transfer`
- **AND** `paymentStatus` is `pending` until staff confirmation in a later change

### Requirement: Payment notification audit log

The system SHALL persist Redsys notification payloads idempotently for audit and duplicate detection.

#### Scenario: Notification stored once

- **WHEN** a valid Redsys notification is processed
- **THEN** a notification record exists with order reference and signature
- **AND** duplicate signatures do not create second records
