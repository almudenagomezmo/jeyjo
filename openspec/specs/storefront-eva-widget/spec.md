# Storefront EVA widget

## Purpose

Floating SKAI/EVA widget on public storefront and B2B intranet with page context and graceful degradation (US-22, RI-005).

## Requirements

### Requirement: EVA floating widget is visible on all storefront pages

The public storefront SHALL render a persistent EVA floating action button on every page, including PLP, PDP, home, cart, and checkout, per **US-22** CA1 and alcance §1.12.

#### Scenario: Anonymous visitor opens any public page

- **WHEN** an unauthenticated user loads any public storefront route with `EVA_WIDGET_ENABLED` true
- **THEN** a floating EVA launcher button is visible without blocking primary navigation or checkout actions

#### Scenario: Widget disabled by configuration

- **WHEN** `EVA_WIDGET_ENABLED` is false
- **THEN** no EVA launcher or SKAI script is mounted on public pages

### Requirement: EVA widget is visible in B2B intranet

The B2B intranet shell SHALL mount the same EVA widget launcher on all authenticated intranet routes, per ÉPICA-05 (widget en intranet).

#### Scenario: B2B user opens intranet dashboard

- **WHEN** an authenticated B2B user navigates within `/intranet`
- **THEN** the EVA floating launcher is visible alongside intranet navigation

### Requirement: Widget receives page context for product assistance

The storefront SHALL provide the active page context (path and product SKU/name when on a PDP) to the EVA bootstrap flow so SKAI can answer product-specific questions, per **US-22** CA2 and **RI-005**.

#### Scenario: User opens a product detail page

- **WHEN** a visitor is on a PDP for SKU `REF-001`
- **THEN** the EVA bootstrap payload includes `productSku: REF-001` and the public product title

#### Scenario: User browses a non-product page

- **WHEN** a visitor is on `/categoria/escritura`
- **THEN** the EVA bootstrap payload includes the pathname without customer-specific fields

### Requirement: Widget shows graceful degradation when SKAI is unavailable

When SKAI bootstrap or script load fails, the storefront SHALL display the message defined in **RI-005** and configured fallback contact options (phone, email, WhatsApp, business hours), per **US-22** CA3.

#### Scenario: SKAI bootstrap returns error

- **WHEN** `GET /api/eva/bootstrap` fails or returns `enabled: false` due to upstream error
- **THEN** the user sees "El asistente no está disponible en este momento; puedes contactar con nosotros por teléfono o email"
- **AND** configured human contact channels are shown

#### Scenario: SKAI cannot resolve a query

- **WHEN** the widget session ends in an unresolved state exposed by SKAI callbacks
- **THEN** the widget offers human contact options with configured business hours

### Requirement: Anonymous users never receive privileged pricing or account data

The EVA widget bootstrap and context flow for unauthenticated users SHALL NOT expose B2B special prices, customer account identifiers, or order history, per **US-22** CA4 and **RI-005** security.

#### Scenario: Anonymous bootstrap request

- **WHEN** `GET /api/eva/bootstrap` is called without a valid Supabase session
- **THEN** the response context token is scoped to `anonymous`
- **AND** no customer id, special price, or purchase history is included in any server-side context resolution
