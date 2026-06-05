## ADDED Requirements

### Requirement: Stock sync triggers wishlist alert evaluation

After `runStockSync()` completes with status `success` or `partial` and at least one product updated, the CMS SHALL invoke wishlist stock alert processing for SKUs whose `stockIndicator` transitioned from `limited` to `available` or `low`.

#### Scenario: Limited to available triggers evaluation

- **WHEN** a stock sync run updates SKU REF-001 from indicator `limited` to `available`
- **THEN** wishlist alert processing runs for REF-001 before the sync response is returned

#### Scenario: No transition skips dispatch

- **WHEN** SKU REF-002 remains `limited` after sync
- **THEN** no `stock_available` notification is created for watchers of REF-002

#### Scenario: Failed sync skips wishlist job

- **WHEN** stock sync status is `failed` with zero product updates
- **THEN** wishlist alert processing does not run

### Requirement: Alerts dispatch per watching profile

For each alertable SKU, the system SHALL query `stock_watches` by SKU and dispatch a `stock_available` notification to each distinct `web_profile_id` using profile-scoped dispatch that respects `wishlist_channel` preferences.

#### Scenario: Two profiles watch same SKU

- **WHEN** profiles P1 and P2 watch REF-001 and REF-001 becomes available
- **THEN** one notification is created for P1 and one for P2

#### Scenario: Off preference skips notification

- **WHEN** profile P1 has `wishlist_channel` `off`
- **THEN** no notification row or email is created for P1

### Requirement: Stock alert dispatch is idempotent per sync run

Each profile and SKU combination SHALL use idempotency key `stock:{sku}:{webProfileId}:{stockSyncRunId}` so duplicate processing within the same sync run creates at most one notification.

#### Scenario: Re-entrant job does not duplicate

- **WHEN** wishlist alert processing runs twice for the same sync run id and profile
- **THEN** at most one notification row exists for that idempotency key

### Requirement: Watch metadata updates after dispatch

After a successful dispatch for a watch, the system SHALL set `last_notified_at` to the current timestamp and `last_indicator` to the new indicator level for that watch row.

#### Scenario: Notified watch records timestamp

- **WHEN** a stock alert is dispatched for profile P1 and SKU REF-001
- **THEN** the watch row for P1 and REF-001 has non-null `last_notified_at`

### Requirement: Stock available notification payload

Dispatched `stock_available` notifications SHALL include `payload` with `sku`, `productTitle`, `stockLabel` (Spanish public label), and `href` pointing to the product PDP path.

#### Scenario: Payload includes PDP link

- **WHEN** product slug is `boligrafo-azul` and SKU is REF-001
- **THEN** `payload.href` is `/producto/boligrafo-azul` or the canonical PDP route for that SKU
