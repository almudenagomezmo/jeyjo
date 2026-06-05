# cms-marketing-admin-ui

## ADDED Requirements

### Requirement: Marketing admin group in Payload

The CMS admin navigation SHALL include a **Marketing** group containing the `coupons` collection list and access to the `marketing-settings` global.

#### Scenario: Superadmin sees Marketing group

- **WHEN** a superadmin opens the Payload admin
- **THEN** a Marketing group is visible with Coupons and Abandoned cart settings

#### Scenario: Coupon list filters

- **WHEN** staff opens the coupons list
- **THEN** they can filter by active, expired, or recovery source

### Requirement: Coupon form exposes all US-18 fields

The coupon create/edit form SHALL expose code, discount type, value, minimum order, validity dates, max uses, and active flag with inline validation messages.

#### Scenario: Percent discount validation

- **WHEN** staff sets discount type percent with value 150
- **THEN** validation fails before save

#### Scenario: Uses count read-only

- **WHEN** staff edits an existing coupon
- **THEN** `usesCount` is displayed but not editable
