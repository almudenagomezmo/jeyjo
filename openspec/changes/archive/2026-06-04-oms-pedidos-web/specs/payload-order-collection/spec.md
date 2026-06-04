## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Orders are staff-only in admin

Only authenticated Payload staff users with `superadmin` or `administracion` in `staffRoles` SHALL have full read/update access to orders in the admin and OMS custom views; users with only other staff roles SHALL NOT access order data. Public order lookup flows remain deferred to storefront changes.

#### Scenario: Staff lists orders

- **WHEN** an administracion user opens the Orders collection or OMS inbox
- **THEN** orders are listed with default columns including order number, date, status, and origin

#### Scenario: Catalog-only staff denied OMS

- **WHEN** a catalogo-only staff user requests OMS inbox API or view
- **THEN** access is denied with 403 semantics

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
