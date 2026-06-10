## MODIFIED Requirements

### Requirement: Delivery methods US-04 CA2

The checkout delivery step SHALL let the user choose exactly one of: ship to default billing address, ship to another address (saved or newly created inline in checkout), or pickup at store Alfaro or Rincón de Soto.

#### Scenario: Home delivery uses billing address

- **WHEN** the user selects ship to billing address
- **THEN** the order snapshot uses the authenticated customer's billing fields from `customers`
- **AND** pickup store fields are empty

#### Scenario: Alternate saved address

- **WHEN** the user selects a saved `customer_addresses` row
- **THEN** the order snapshot stores that address id and copied line fields

#### Scenario: Store pickup Alfaro

- **WHEN** the user selects pickup at Alfaro
- **THEN** the delivery method is `pickup_alfaro`
- **AND** shipping cost for the order is 0

#### Scenario: Store pickup Rincón de Soto

- **WHEN** the user selects pickup at Rincón de Soto
- **THEN** the delivery method is `pickup_rincon`
- **AND** shipping cost for the order is 0

### Requirement: Delivery step separates shipping address card

For home delivery and alternate address methods, the checkout delivery step SHALL show a dedicated **Dirección de envío** card after the delivery method selection, distinct from store pickup options.

#### Scenario: Home delivery shows billing address card

- **WHEN** the user selects ship to billing address
- **THEN** a **Dirección de envío** card displays the billing address summary
- **AND** copy indicates shipment goes to the billing address
- **AND** observations and continue action appear in that card

#### Scenario: Alternate address selection in shipping card

- **WHEN** the user selects ship to another address
- **THEN** the **Dirección de envío** card lists saved addresses as radio options
- **AND** shows **Añadir nueva dirección** to open an inline form without leaving checkout

#### Scenario: Store pickup keeps compact delivery card

- **WHEN** the user selects store pickup Alfaro or Rincón de Soto
- **THEN** no separate shipping address card is shown
- **AND** observations and continue remain in the Entrega card

## ADDED Requirements

### Requirement: Checkout inline address creation US-04

When alternate delivery is selected, authenticated checkout SHALL let the user create a new shipping address inline via `POST /api/account/addresses`, persist it in `customer_addresses`, auto-select it for the current order, and remain on the delivery step without navigating to `/cuenta/direcciones`.

#### Scenario: Inline form from add button

- **WHEN** a logged-in user selects **Envío a otra dirección**
- **AND** clicks **Añadir nueva dirección**
- **THEN** an inline address form appears inside the **Dirección de envío** card
- **AND** the user can cancel to return to the address list

#### Scenario: Created address selected and saved

- **WHEN** the user submits valid address fields from the inline form
- **THEN** a new `customer_addresses` row is created for the customer
- **AND** that address is selected as `alternateAddressId`
- **AND** the inline form closes
- **AND** the new address appears in the radio list

#### Scenario: Empty address book opens form

- **WHEN** a logged-in user selects **Envío a otra dirección** with zero saved addresses
- **THEN** the inline new-address form is shown automatically

#### Scenario: Continue requires address selection

- **WHEN** alternate delivery is selected without a chosen or newly created address
- **THEN** continue is blocked with validation **Selecciona o añade una dirección de envío**
