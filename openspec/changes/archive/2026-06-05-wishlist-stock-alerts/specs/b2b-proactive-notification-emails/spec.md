## ADDED Requirements

### Requirement: Stock available email RF-022 wishlist

When `stock_available` is dispatched and the profile `wishlist_channel` allows email, the system SHALL send a transactional email with subject `Ya hay stock de {sku} en Jeyjo` and body including the product title, public stock label, and link to the PDP.

#### Scenario: Stock email sent to active preference

- **WHEN** SKU REF-001 becomes available for a profile with `wishlist_channel` `email`
- **THEN** an email is sent to the profile email
- **AND** the subject is `Ya hay stock de REF-001 en Jeyjo`

#### Scenario: Portal-only wishlist skips stock email

- **WHEN** `wishlist_channel` is `portal` and `stock_available` is dispatched
- **THEN** no stock alert email is sent
- **AND** an in-app notification may still be created
