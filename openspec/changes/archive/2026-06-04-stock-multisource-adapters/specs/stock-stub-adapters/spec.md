## ADDED Requirements

### Requirement: Stub Distrisantiago adapter provides deterministic stock file

The stub `StockSourceReader` for Distrisantiago SHALL return a fixed in-memory dataset keyed by wholesale reference, suitable for local development and automated tests, aligned with Jeyjo seed SKUs where applicable.

#### Scenario: Stub returns stock for seeded wholesale ref

- **WHEN** `STOCK_DISTRI_ADAPTER=stub` and `getStockByRef` is called with a ref present in stub fixtures
- **THEN** a snapshot with non-negative `quantity` and `sourceId=distrisantiago` is returned

#### Scenario: Stub list includes multiple refs

- **WHEN** `listStockSnapshots` is invoked in stub mode
- **THEN** at least three distinct `wholesaleRef` values are returned

### Requirement: Stub Arnoia adapter provides deterministic web-link simulation

The stub Arnoia reader SHALL simulate daily web-link stock lookup with the same `StockSnapshotDto` shape as Distrisantiago but `sourceId=arnoia`.

#### Scenario: Arnoia stub returns distinct dataset

- **WHEN** the Arnoia stub is queried for a ref present only in Arnoia fixtures
- **THEN** the snapshot reflects Arnoia quantities independent of Distrisantiago stub data

### Requirement: Stub supports per-source failure simulation

Each stub reader SHALL support test-only toggles to simulate `STOCK_UNAVAILABLE` independently per source for resilience tests (RNF-007).

#### Scenario: Distrisantiago outage does not affect Arnoia stub

- **WHEN** Distrisantiago failure simulation is enabled and Arnoia simulation is disabled
- **THEN** Distrisantiago reads reject while Arnoia reads succeed

### Requirement: Stub fixtures cover RF-005 acceptance scenarios

Stub datasets SHALL include fixtures for REF-001..004 (or equivalent seed SKUs) supporting green, blue (ERP low), and limited indicator outcomes after sync and semaphore resolution.

#### Scenario: REF-002 ERP low fixture

- **WHEN** stub ERP catalog reports `erpStock=2` for REF-002 and wholesale stubs provide higher quantities
- **THEN** after full stock pipeline, the resolved indicator is `low` per CA-ERP-001 threshold default 5
