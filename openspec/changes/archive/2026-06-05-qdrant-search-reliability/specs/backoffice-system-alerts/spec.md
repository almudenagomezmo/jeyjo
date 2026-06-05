## ADDED Requirements

### Requirement: Search index health alert in system alerts tray

The admin dashboard system alerts tray SHALL surface a warning when `search_events` has `error` count greater than zero or oldest pending age exceeds 300 seconds, and an error alert when `error` count is at least 10 or oldest pending age exceeds 900 seconds, with action link to search queue diagnostics context, per **RF-009** operational criteria.

#### Scenario: Pending backlog warning

- **WHEN** the oldest pending search event is 400 seconds old and error count is zero
- **THEN** a warning alert appears in the system alerts tray describing search index lag

#### Scenario: Accumulated errors trigger error alert

- **WHEN** `search_events` has 10 or more rows with `status = 'error'`
- **THEN** an error-severity alert appears before warning-severity alerts from other sources at the same severity tier

#### Scenario: Healthy queue shows no search alert

- **WHEN** pending count is zero, error count is zero, and no stale processing rows exist
- **THEN** no search-index alert is shown in the tray
