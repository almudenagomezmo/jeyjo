## ADDED Requirements

### Requirement: Internal session beacons coexist with GA4 web analytics

The storefront analytics sessions capability SHALL continue operating independently of GA4; GA4 is the external web analytics channel per **RF-028** while Supabase beacons remain the source for backoffice dashboard visitor metrics per **RF-026**.

#### Scenario: Both systems active

- **WHEN** `NEXT_PUBLIC_GA4_ENABLED` is true and `NEXT_PUBLIC_ANALYTICS_BEACONS_ENABLED` is true
- **THEN** heartbeats continue posting to `/api/analytics/heartbeat`
- **AND** GA4 events are emitted in parallel without sharing PII between systems

#### Scenario: GA4 disabled beacons continue

- **WHEN** GA4 is disabled but beacons are enabled
- **THEN** dashboard visitor metrics continue to update from Supabase sessions
