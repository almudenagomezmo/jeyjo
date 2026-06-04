# Payload order collection

## Purpose

Payload `orders` collection adapted for Jeyjo web orders (OMS bootstrap), with origin tracking, customer reference, and IVA snapshot on line items.

## Requirements

### Requirement: Orders collection models web orders

The CMS SHALL expose an `orders` collection (via ecommerce plugin override) with Jeyjo-specific fields: `orderNumber`, `origin`, `status`, customer reference, EVA validation flag, and order totals.

#### Scenario: Order origin captured

- **WHEN** a web order is created with origin B2C
- **THEN** the stored `origin` value is `b2c`

#### Scenario: Order number assigned

- **WHEN** a new order is created without an explicit order number
- **THEN** the system assigns a unique human-readable `orderNumber` before persist

### Requirement: Order line items support IVA snapshot field

Each order line item SHALL include an `ivaRateSnapshot` numeric field. The field MUST be populated automatically when the parent order reaches confirmed status, recording the VAT rate in effect at confirmation (RF-007). Before confirmation, the field MAY be empty.

#### Scenario: Line item stores IVA snapshot on confirm

- **WHEN** an order transitions to confirmed with a line for a product at VAT rate 21
- **THEN** `ivaRateSnapshot` on that line is 21

#### Scenario: Historical order unchanged after product VAT edit

- **WHEN** a confirmed order line has `ivaRateSnapshot` 21 and the product VAT is later updated to 10
- **THEN** the line `ivaRateSnapshot` remains 21

### Requirement: Orders reference external customer identity

Orders SHALL store a logical reference to Supabase `customers.id` (uuid string or dedicated field) without duplicating full customer master data in Payload.

#### Scenario: Order linked to customer

- **WHEN** an order is created for a known customer uuid
- **THEN** the order persists the customer reference for OMS filtering in later changes

### Requirement: Orders are staff-only in admin

Only authenticated Payload staff users SHALL have full read/update access to orders in the admin; public order lookup flows remain deferred to storefront changes.

#### Scenario: Staff lists orders

- **WHEN** an admin user opens the Orders collection
- **THEN** orders are listed with default columns including order number, date, status, and origin

### Requirement: Checkout delivery fields on orders

The Payload `orders` collection SHALL store checkout-specific fields: `deliveryMethod` (enum: home, alternate_address, pickup_alfaro, pickup_rincon), `shippingAddressSnapshot` (json), `billingAddressSnapshot` (json), `pickupStoreLabel` (text nullable), `shippingCost` (number), `couponCode` (text nullable), `customerNotes` (text nullable), `guestEmail` (email nullable), `paymentMethodCode` (text), `paymentMethodLabel` (text).

#### Scenario: Home delivery order stores snapshots

- **WHEN** an order is placed with home delivery to billing address
- **THEN** `deliveryMethod` is `home`
- **AND** `billingAddressSnapshot` contains copied billing fields

#### Scenario: Pickup order zero shipping

- **WHEN** an order uses pickup at Alfaro
- **THEN** `deliveryMethod` is `pickup_alfaro`
- **AND** `shippingCost` is 0
- **AND** `pickupStoreLabel` identifies the Alfaro store

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
