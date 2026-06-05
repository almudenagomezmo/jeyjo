## ADDED Requirements

### Requirement: Dashboard displays search queue KPI cards

The Payload admin landing dashboard SHALL display KPI cards for search index queue depth: pending event count, processing count, error count, and oldest pending age (seconds or humanized duration), sourced from `getSearchQueueStats()`, per **RF-009** and **RF-026** operational visibility.

#### Scenario: Admin sees queue KPIs on landing

- **WHEN** a staff user with dashboard access opens `/admin`
- **THEN** search queue KPI cards show current pending, processing, and error counts
- **AND** oldest pending age is shown when pending count is greater than zero

#### Scenario: Zero backlog KPIs

- **WHEN** the search queue has no pending, processing, or error rows
- **THEN** KPI cards display zero without error

### Requirement: Optional Qdrant index coverage indicator

When Qdrant is configured, the dashboard MAY display a non-blocking coverage ratio of Qdrant `products` point count versus published non-wildcard Payload product count, cached for at most 5 minutes, with em dash when Qdrant is unreachable.

#### Scenario: Coverage ratio displayed

- **WHEN** Qdrant reports 4800 product points and Payload has 5000 published non-wildcard products
- **THEN** the coverage indicator shows approximately 96% or equivalent fraction

#### Scenario: Qdrant unavailable

- **WHEN** Qdrant count API fails
- **THEN** the coverage indicator shows an em dash
- **AND** queue KPI cards still render from Supabase stats
