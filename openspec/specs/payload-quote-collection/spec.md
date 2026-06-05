# Payload quote collection

## Purpose

Payload `quotes` collection for web presupuesto requests (RF-015), with status lifecycle, pricing snapshots, and optional conversion to orders.

## Requirements

### Requirement: Quotes collection models web presupuestos

The CMS SHALL expose a `quotes` collection with Jeyjo-specific fields: unique `quoteNumber`, `status`, `segment` (b2c or b2b), optional `customerRef` (Supabase customer uuid), optional `guestEmail`, `lineSnapshots` (json array with sku, title, quantity, unit prices, iva snapshot), delivery snapshots, `customerNotes`, monetary totals, optional `validUntil`, and optional `convertedOrderRef` to `orders`.

#### Scenario: Quote created with requested status

- **WHEN** a storefront quote request succeeds
- **THEN** a quote document exists with `status` `requested`
- **AND** `quoteNumber` is assigned before persist

#### Scenario: Quote linked to authenticated customer

- **WHEN** a logged-in customer requests a quote
- **THEN** `customerRef` stores their Supabase customer uuid
- **AND** `guestEmail` may mirror account email

### Requirement: Quote status lifecycle RF-015

Quote `status` SHALL follow the lifecycle: `requested` → `in_review` → `sent` → `accepted` → `ordered`, with `cancelled` as terminal from any non-ordered state. Labels in admin UI SHALL display Spanish equivalents (Solicitado, En revisión, Enviado, Aceptado, Pedido, Cancelado).

#### Scenario: Initial status is requested

- **WHEN** a new quote is created from the storefront
- **THEN** `status` is `requested`

#### Scenario: Ordered is terminal

- **WHEN** a quote reaches `ordered`
- **THEN** further status changes except audit metadata are rejected

### Requirement: Quote line snapshots preserve pricing at request time

Each quote line snapshot SHALL store sku, product title, quantity, net unit, gross unit, vat rate, and applied pricing rule label at request time, aligned with order line snapshot conventions from the pricing engine.

#### Scenario: Snapshot retains price after catalog change

- **WHEN** a quote is created with line net 10.00
- **AND** the product list price changes later
- **THEN** the quote line snapshot net remains 10.00

### Requirement: Quote conversion references created order

When staff converts an accepted quote to an order, the quote SHALL set `status` to `ordered` and persist `convertedOrderRef` pointing to the new Payload order document.

#### Scenario: Conversion links order

- **WHEN** staff converts quote P-2026-00001 to an order
- **THEN** `convertedOrderRef` references that order id
- **AND** quote `status` is `ordered`

### Requirement: Quotes are staff-only in admin

Only authenticated Payload staff users with `superadmin` or `administracion` in `staffRoles` SHALL have read and update access to quotes in admin and quotes inbox views. Storefront creation SHALL use the storefront API key only.

#### Scenario: Staff lists quotes

- **WHEN** an administracion user opens the Quotes collection or quotes inbox
- **THEN** quotes are listed with quote number, date, status, customer label, and total

#### Scenario: Catalog-only staff denied quotes

- **WHEN** a catalogo-only staff user requests quotes admin or REST API
- **THEN** access is denied with 403 semantics

### Requirement: Quote status change notifies B2B customer

When staff changes quote `status` to `sent`, `accepted`, or `cancelled` for a quote with `customerRef` or B2B segment, the CMS SHALL dispatch `quote_status` notifications to B2B profiles of that customer subject to quote channel preferences.

#### Scenario: Quote sent notifies customer

- **WHEN** staff moves quote P-2026-00020 from `in_review` to `sent` with B2B `customerRef`
- **THEN** B2B profiles with quote channel not `off` receive in-app notification
- **AND** email is sent when channel is `email`

#### Scenario: Guest-only quote does not use intranet dispatch

- **WHEN** a quote has only `guestEmail` and no `customerRef`
- **THEN** only email to `guestEmail` may be sent if applicable
- **AND** no intranet notification rows are created

### Requirement: Quote expiry job RF-022c

A scheduled job SHALL daily find quotes with `status` in `sent` or `accepted`, non-null `validUntil` equal to seven calendar days from today, and dispatch `quote_expiring` once per quote per expiry date via idempotency key.

#### Scenario: Seven-day warning once

- **WHEN** quote P-2026-00030 has `validUntil` on 2026-06-11 and today is 2026-06-04
- **THEN** exactly one `quote_expiring` notification is created per profile
- **AND** a second run the same day does not duplicate

#### Scenario: Ordered quote excluded

- **WHEN** quote status is `ordered`
- **THEN** the expiry job does not dispatch for that quote
