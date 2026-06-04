## ADDED Requirements

### Requirement: Orders collection models web orders

The CMS SHALL expose an `orders` collection (via ecommerce plugin override) with Jeyjo-specific fields: `orderNumber`, `origin`, `status`, customer reference, EVA validation flag, and order totals.

#### Scenario: Order origin captured

- **WHEN** a web order is created with origin B2C
- **THEN** the stored `origin` value is `b2c`

#### Scenario: Order number assigned

- **WHEN** a new order is created without an explicit order number
- **THEN** the system assigns a unique human-readable `orderNumber` before persist

### Requirement: Order line items support IVA snapshot field

Each order line item SHALL include an `ivaRateSnapshot` numeric field prepared for immutable tax recording at order confirmation (RF-007 preparation).

#### Scenario: Line item stores IVA snapshot

- **WHEN** an order line is saved with a product VAT rate of 21
- **THEN** `ivaRateSnapshot` on the line reflects 21 regardless of later product VAT changes

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
