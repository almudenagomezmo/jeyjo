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

### Requirement: Orders track stock validation pending flag

The Payload `orders` collection SHALL include boolean `stockValidationPending` defaulting to false, set by staff stock recheck or inbox summary logic when any line quantity exceeds available ERP stock for the SKU.

#### Scenario: Stock shortfall sets flag

- **WHEN** recheck determines ordered quantity exceeds available stock for a line
- **THEN** `stockValidationPending` is true on the order

#### Scenario: Sufficient stock clears flag

- **WHEN** recheck finds all lines within available stock
- **THEN** `stockValidationPending` is false

### Requirement: Orders record ERP export timestamp

The Payload `orders` collection SHALL include nullable `exportedToErpAt` (date) updated on successful Avansuite Excel export.

#### Scenario: Export records timestamp

- **WHEN** Avansuite export completes for an order
- **THEN** `exportedToErpAt` is populated

### Requirement: EVA rejection reason optional field

Orders with `origin` eva SHALL support optional text field `evaRejectionReason` set when staff rejects an EVA order.

#### Scenario: Rejection stores reason

- **WHEN** staff rejects an EVA order with reason "Cliente desconocido"
- **THEN** `evaRejectionReason` stores that text

### Requirement: Confirmed web orders contribute to B2B purchase history aggregation

Confirmed storefront orders stored in Payload SHALL be readable as a secondary source for B2B purchase history line aggregation by `customerRef`, using line SKU and quantity with unit price snapshot as historical reference only (not as current sale price).

#### Scenario: Confirmed B2B order lines are eligible

- **WHEN** an order has `customerRef` matching the session customer, `origin` b2b, and `jeyjoStatus` confirmed
- **THEN** its line items are included when building purchase history merge input

#### Scenario: Draft or cancelled orders are excluded

- **WHEN** an order has `jeyjoStatus` pending_payment or cancelled
- **THEN** its lines are not included in purchase history aggregation

#### Scenario: Line snapshot is historical reference only

- **WHEN** a web order line has unit price snapshot 4.00 at confirmation
- **THEN** purchase history may expose 4.00 as historicalUnitPrice
- **AND** repeat-to-cart and list active price still use pricing engine current quote

### Requirement: Orders are staff-only in admin

Only authenticated Payload staff users with `superadmin` or `administracion` in `staffRoles` SHALL have full read/update access to orders in the admin and OMS custom views; users with only other staff roles SHALL NOT access order data. Public order lookup flows remain deferred to storefront changes.

#### Scenario: Staff lists orders

- **WHEN** an administracion user opens the Orders collection or OMS inbox
- **THEN** orders are listed with default columns including order number, date, status, and origin

#### Scenario: Catalog-only staff denied OMS

- **WHEN** a catalogo-only staff user requests OMS inbox API or view
- **THEN** access is denied with 403 semantics

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

New web orders from storefront checkout SHALL use status `pending_payment` for B2C segment until payment is authorized, then `confirmed`; B2B segment SHALL use `pending_confirmation` until staff or OMS confirms to `confirmed`. Staff SHALL advance B2C transfer orders from `pending_payment` to `confirmed` without gateway authorization.

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

#### Scenario: Staff confirms B2B from OMS

- **WHEN** administracion staff confirms a B2B order in `pending_confirmation`
- **THEN** `jeyjoStatus` becomes `confirmed`

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
