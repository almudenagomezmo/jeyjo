## 1. Payload RMA collection

- [x] 1.1 Create `RmaIncidents` collection with fields per design (rmaNumber, status, customerRef, articleSku, deliveryNoteNumber, reason, observations, emailSentAt)
- [x] 1.2 Implement `beforeValidate` hook for `RMA-{YYYY}-{seq}` numbering (verify: second create in same year increments seq)
- [x] 1.3 Restrict admin access to `superadmin` and `administracion`; allow storefront API key create-only
- [x] 1.4 Add status transition validation helper and audit log on staff changes (verify: `requested` → `authorized` rejected)

## 2. RMA confirmation email

- [x] 2.1 Add HTML email template with rmaNumber, SKU, albarán, motivo, authorization reminder
- [x] 2.2 Implement send hook/endpoint; set `emailSentAt` on success, log on failure without rollback (verify: Mailpit captures in dev)
- [x] 2.3 Integration test: email failure leaves document with `emailSentAt` null

## 3. Backoffice RMA inbox

- [x] 3.1 Create `RmaInboxView` with columns, status/reason labels in Spanish, email warning badge
- [x] 3.2 Add filters: date range, status, search by RMA number/SKU/albarán/customer
- [x] 3.3 Wire inbox nav under Operaciones; staff status actions with valid transitions only (verify: new incident visible < 1 min CA-B2B-005)

## 4. Storefront service layer

- [x] 4.1 Create `lib/intranet/rma/types.ts` and Payload client helpers for list/create
- [x] 4.2 Implement duplicate guard (same customerRef + articleSku + deliveryNoteNumber within 24h → 409)
- [x] 4.3 Optional CMS enrich: product title by SKU for list rows
- [x] 4.4 Unit tests: validation (other + short observations), reason labels, open/closed status grouping

## 5. Storefront APIs

- [x] 5.1 `GET /api/intranet/rma-incidents` with B2B guard, status filter, pagination
- [x] 5.2 `POST /api/intranet/rma-incidents` — validate, create Payload doc, trigger confirmation email
- [x] 5.3 Integration tests: 401 without session, successful create returns rmaNumber, list scoped to customerRef, 409 duplicate

## 6. Intranet UI

- [x] 6.1 Replace `/intranet/rma` scaffold with `RmaIncidentsPage` (authorization banner, form, tabs Abiertas/Cerradas/Todas)
- [x] 6.2 Remove `scaffold` entry for `/intranet/rma` in `lib/intranet/navigation.ts`
- [x] 6.3 Client form: reason select, observations validation, submit disable + success toast with RMA number
- [x] 6.4 Status badges and responsive table/cards using design tokens only

## 7. Verification and docs

- [x] 7.1 Manual/staging **CA-B2B-005**: `empresa@test.com` submits REF-011 + ALB-2026-001 → RMA number, email, inbox row, estado Solicitada
- [x] 7.2 Assert authorization notice visible (US-13 CA4) and closed tab empty until staff resolves
- [x] 7.3 Document rollback: restore `IntranetScaffoldPage` if `RMA_INCIDENTS_ENABLED=false`
