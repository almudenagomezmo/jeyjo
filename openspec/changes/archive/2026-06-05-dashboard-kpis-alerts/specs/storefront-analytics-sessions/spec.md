## ADDED Requirements

### Requirement: Storefront records anonymous session heartbeats

The storefront SHALL persist session heartbeats to Supabase for dashboard visitor metrics without storing PII beyond an anonymous session identifier and optional user-agent hash.

#### Scenario: First visit creates session row

- **WHEN** a new visitor loads any storefront page with beacons enabled
- **THEN** a `storefront_sessions` row is created with a new `session_id`
- **AND** an HttpOnly cookie holds the same `session_id` for subsequent heartbeats

#### Scenario: Repeat heartbeat updates last seen

- **WHEN** the same browser sends a heartbeat within 24 hours
- **THEN** `last_seen_at` updates for the existing `session_id`
- **AND** no duplicate session row is created for that cookie

### Requirement: Storefront reports cart activity with heartbeats

When the cart store has one or more line items, heartbeats SHALL upsert `storefront_cart_activity` for the session with `line_count`, `total_qty`, and `updated_at`.

#### Scenario: Cart with items updates activity

- **WHEN** a session has two cart lines and sends a heartbeat
- **THEN** `storefront_cart_activity` reflects `line_count` 2 and a recent `updated_at`

#### Scenario: Empty cart clears active cart signal

- **WHEN** the cart becomes empty and the next heartbeat runs
- **THEN** cart activity for the session is removed or shows `line_count` 0 such that the session is not counted as an active cart

### Requirement: Heartbeat endpoint is rate limited and anonymous-safe

The storefront API route for analytics heartbeats SHALL accept unauthenticated requests, validate payload shape, apply basic rate limiting per IP or session, and MUST NOT require staff or customer JWT.

#### Scenario: Valid heartbeat returns success

- **WHEN** the client POSTs a valid heartbeat payload
- **THEN** the API responds with HTTP 200

#### Scenario: Malformed payload rejected

- **WHEN** the client POSTs an invalid payload
- **THEN** the API responds with HTTP 400 and does not mutate session tables

### Requirement: Dashboard reads session metrics via service role only

CMS dashboard aggregation SHALL read `storefront_sessions` and `storefront_cart_activity` using Supabase service role credentials; anon and storefront JWT MUST NOT query these tables directly.

#### Scenario: Active visitors counted from last seen

- **WHEN** the dashboard requests realtime metrics
- **THEN** active visitors equal distinct `session_id` with `last_seen_at` within the last 5 minutes

#### Scenario: Unique visitors in period counted from first seen

- **WHEN** the dashboard computes conversion for a date range
- **THEN** unique visitors equal distinct `session_id` with `first_seen_at` within that range

### Requirement: Beacons can be disabled by feature flag

The storefront SHALL skip heartbeat network calls when `ANALYTICS_BEACONS_ENABLED` is `false`.

#### Scenario: Flag off skips requests

- **WHEN** `ANALYTICS_BEACONS_ENABLED` is `false`
- **THEN** no heartbeat requests are sent from the storefront client
