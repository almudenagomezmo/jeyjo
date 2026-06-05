# payload-quote-collection

## ADDED Requirements

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
