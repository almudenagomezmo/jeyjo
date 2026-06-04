## ADDED Requirements

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

New web orders from storefront checkout SHALL use status `pending_payment` for B2C segment and `pending_confirmation` for B2B segment until payment or OMS changes process them in later roadmap items.

#### Scenario: B2C draft awaits payment

- **WHEN** a B2C checkout completes in this change
- **THEN** the order `status` is `pending_payment`

#### Scenario: B2B draft awaits confirmation

- **WHEN** a B2B checkout completes in this change
- **THEN** the order `status` is `pending_confirmation`
