# Backoffice SKAI configuration

## Purpose

Superadmin configuration of EVA/SKAI integration: business hours, fallback contacts, knowledge uploads, and test panel (US-20).

## Requirements

### Requirement: Superadmin can open SKAI configuration view

The Payload admin SHALL expose a dedicated "Configuración SKAI" view accessible only to users with the `superadmin` staff role, per **US-20** CA1.

#### Scenario: Superadmin opens SKAI config

- **WHEN** a user with `superadmin` navigates to `/admin/skai-config`
- **THEN** the SKAI configuration form is displayed

#### Scenario: Non-superadmin denied

- **WHEN** a user with only `catalogo` navigates to `/admin/skai-config`
- **THEN** access is denied per staff role rules

### Requirement: SKAI configuration manages connection and business hours

The configuration view SHALL allow staff to enable or disable the widget integration, store EVA business hours, out-of-hours redirect message, and fallback contact channels (phone, email, WhatsApp), per **US-20** CA1.

#### Scenario: Save business hours and fallback contacts

- **WHEN** superadmin saves weekday hours 09:00–18:00 and a WhatsApp number
- **THEN** subsequent widget bootstrap responses include those fallback contacts

#### Scenario: Disable EVA widget from admin

- **WHEN** superadmin sets `enabled` to false in SKAI settings
- **THEN** storefront bootstrap returns `enabled: false` and the widget is not mounted

### Requirement: Superadmin can upload knowledge documents for EVA

The configuration view SHALL allow uploading catalog PDFs or product sheets to be forwarded to SKAI via the adapter when supported, per **US-20** CA1.

#### Scenario: PDF upload in live mode

- **WHEN** superadmin uploads `catalogo-2026.pdf` with `SKAI_ADAPTER=live`
- **THEN** the file is stored and the adapter `uploadKnowledgeDocument` is invoked

#### Scenario: PDF upload in stub mode

- **WHEN** superadmin uploads a PDF with `SKAI_ADAPTER=stub`
- **THEN** the file is stored locally and the UI shows success without calling SKAI network APIs

### Requirement: Superadmin can test EVA from the backoffice

The configuration view SHALL include a "Probar EVA" panel that embeds or launches the widget with a staff test token without exposing real customer data, per **US-20** CA2.

#### Scenario: Test panel loads widget

- **WHEN** superadmin opens the test panel
- **THEN** an EVA test session starts with an anonymous or staff-scoped context token
- **AND** no production customer PII is injected

### Requirement: Configuration shows conversation analytics summary

The configuration view SHALL display conversation count for the last 30 days and the most frequent unresolved questions returned by the SKAI adapter, per **US-20** CA4.

#### Scenario: Metrics section populated

- **WHEN** SKAI metrics are available from the adapter
- **THEN** the view shows monthly conversation count and at least one unresolved question label or an explicit empty state
