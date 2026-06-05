# SKAI EVA integration

## Purpose

Bidirectional SKAI/EVA adapter in CMS: context API, signed order webhook, and health/metrics (RI-005, MOD-10).

## Requirements

### Requirement: SKAI integration uses a pluggable adapter

The CMS SHALL expose a `SkaiEvaAdapter` resolved from `SKAI_ADAPTER` ∈ `stub|live`, following the same registry pattern as ERP adapters, per **RI-005** and MOD-10.

#### Scenario: Development without SKAI credentials

- **WHEN** `NODE_ENV=development` and `SKAI_ADAPTER` is unset
- **THEN** the stub adapter is selected and returns fixture widget config and metrics without network calls

#### Scenario: Production requires live configuration

- **WHEN** `SKAI_ADAPTER=live` in a non-development environment
- **THEN** missing `SKAI_API_URL`, `SKAI_API_KEY`, or `SKAI_WIDGET_ID` prevents adapter initialization with a clear startup error

### Requirement: Context API returns session-scoped customer data only

The platform SHALL expose a server endpoint that SKAI calls with a short-lived signed context token and returns data strictly limited to the authenticated customer in that token, per **RI-005** security and **US-20** CA3.

#### Scenario: Authenticated B2B context resolution

- **WHEN** SKAI requests context with a valid token for customer `C-100`
- **THEN** the response includes profile, resolved prices, and recent purchase history for `C-100` only

#### Scenario: Cross-customer isolation

- **WHEN** SKAI requests context with a valid token for customer `C-100`
- **THEN** no fields from customer `C-200` appear in the response

#### Scenario: Anonymous context resolution

- **WHEN** SKAI requests context with an anonymous token
- **THEN** the response includes only public catalog, general availability, and shipping policy data

### Requirement: EVA order webhook creates pending validation orders

The CMS SHALL accept authenticated `POST /api/eva/orders` payloads from SKAI and create Payload `orders` with `origin` `eva`, `validatedEva` false, and `jeyjoStatus` `pending_confirmation`, per **RI-005** and **CA-BACKEND-003**.

#### Scenario: Valid signed order webhook

- **WHEN** SKAI posts a signed order payload with three line items for customer `C-100`
- **THEN** a new order is created with `origin` eva and `validatedEva` false
- **AND** the order appears in the EVA pending validation queue

#### Scenario: Invalid webhook signature rejected

- **WHEN** a request omits or provides an invalid `X-Skai-Signature`
- **THEN** the endpoint returns 401 and creates no order

#### Scenario: Duplicate external order id is idempotent

- **WHEN** SKAI retries the same `skaiExternalId`
- **THEN** the endpoint returns success without creating a duplicate order document

### Requirement: SKAI adapter exposes health and conversation metrics

The live adapter SHALL implement `validateConnection` and `getConversationMetrics` for dashboard and admin configuration use, per **US-19** CA2 and **US-20** CA4.

#### Scenario: Live adapter health check

- **WHEN** `SKAI_ADAPTER=live` and credentials are valid
- **THEN** `validateConnection` returns healthy status

#### Scenario: Metrics include conversation volume

- **WHEN** staff requests SKAI metrics for the last 30 days
- **THEN** the adapter returns active conversation count and a list of unresolved queries when the SKAI API provides them
