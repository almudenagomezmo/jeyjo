# abandoned-cart-persistence

## ADDED Requirements

### Requirement: B2C cart snapshots persist in Supabase

The system SHALL maintain table `abandoned_cart_snapshots` with one row per B2C `web_profile_id`, storing `lines` jsonb, `last_activity_at`, `status` (`active` | `converted` | `abandoned`), email sent timestamps, and optional `recovery_coupon_id`.

#### Scenario: Sync upserts snapshot on cart mutation

- **WHEN** an authenticated B2C user adds or changes cart lines
- **THEN** `POST /api/cart/sync` upserts the snapshot with current lines and `last_activity_at` now

#### Scenario: Guest cart does not sync

- **WHEN** no authenticated user mutates the cart
- **THEN** no snapshot row is created or updated

#### Scenario: Successful order marks converted US-23 CA3

- **WHEN** place-order succeeds for a profile with an active snapshot
- **THEN** snapshot `status` becomes `converted`
- **AND** `converted_order_id` stores the new order id

### Requirement: Cart recovery token restores client cart

The storefront SHALL expose `GET /api/cart/recover?token=` that validates an HMAC-signed token and returns cart lines for merge into `jeyjo-cart` local storage.

#### Scenario: Valid recover token merges lines

- **WHEN** user opens `/cart?recover=<validToken>`
- **THEN** cart lines from the snapshot are merged into the zustand store
- **AND** the user sees their abandoned items

#### Scenario: Expired token rejected

- **WHEN** recover token TTL is exceeded
- **THEN** the API returns 400
- **AND** cart is not modified
