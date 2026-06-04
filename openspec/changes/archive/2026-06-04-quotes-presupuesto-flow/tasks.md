## 1. Payload quotes collection

- [x] 1.1 Create `apps/cms/src/collections/Quotes/` with fields (`quoteNumber`, `status`, `segment`, `customerRef`, `guestEmail`, `lineSnapshots`, delivery snapshots, totals, `validUntil`, `convertedOrderRef`, `emailSentAt`) and staff access rules (verify: Payload admin shows Quotes group for administracion)
- [x] 1.2 Implement `status-transitions.ts` and `beforeChange` guard mirroring orders pattern (verify: invalid transition `requested` → `sent` rejected)
- [x] 1.3 Add `beforeValidate` hook for `quoteNumber` assignment (`P-{YYYY}-{seq}` unique) (verify: two creates get distinct numbers)
- [x] 1.4 Register collection in `payload.config.ts` and regenerate `payload-types.ts` (verify: `pnpm --filter cms typecheck`)

## 2. CMS quote services and endpoints

- [x] 2.1 Implement `apps/cms/src/lib/quotes/map-quote-input.ts` and quote→order conversion helper reusing order snapshot shapes (verify: unit test maps line snapshots correctly)
- [x] 2.2 Implement `POST /api/quotes/storefront-create` (API key, prepare token validation, persist `requested`) (verify: curl with storefront key creates quote doc)
- [x] 2.3 Implement `PATCH /api/quotes/:id/status` for staff transitions (verify: `requested` → `in_review` succeeds with audit log)
- [x] 2.4 Implement `POST /api/quotes/:id/convert-to-order` from `accepted` only (verify: creates order with correct `jeyjoStatus` per segment and sets `convertedOrderRef`)
- [x] 2.5 Implement `GET /api/quotes/inbox-summary` with customer label enrichment (verify: guest quote shows email in label)
- [x] 2.6 Implement `sendQuoteRequestEmail` using `payload.sendEmail` (verify: Mailpit receives email with quote number in dev)

## 3. Backoffice quotes inbox UI

- [x] 3.1 Add `QuotesInboxView` + shared SCSS (filters, status actions, convert button, email warning badge) (verify: `/admin/quotes` lists quotes for administracion)
- [x] 3.2 Register view and nav under Presupuestos/Pedidos group; restrict access to administracion/superadmin (verify: catalogo user gets 403 on `/admin/quotes`)
- [x] 3.3 Link converted order from quote detail/inbox row to OMS order (verify: `ordered` quote row opens linked order)

## 4. Storefront quote request flow

- [x] 4.1 Add `QUOTES_ENABLED` env flag to storefront `.env.example` (verify: flag documented)
- [x] 4.2 Implement `POST /api/quotes/prepare` and `POST /api/quotes/request` reusing checkout cart/pricing helpers (verify: prepare returns token; request creates quote via CMS)
- [x] 4.3 Build `/presupuesto` page and `/presupuesto/confirmacion` (contact, delivery optional, review, no payment) (verify: guest flow requires email; success shows quote number)
- [x] 4.4 Enable **Solicitar presupuesto** on `/cart` when flag on (verify: navigates to `/presupuesto`, not disabled)
- [x] 4.5 Add **Solicitar presupuesto** secondary action on checkout review step (verify: US-05 CA1 — visible without payment selection)
- [x] 4.6 Implement `GET /api/quotes/mine` and `/cuenta/presupuestos` list page with sidebar link (verify: authenticated customer sees own quotes only)

## 5. Seed and tests

- [x] 5.1 Add seed fixture quote in `requested` and one in `accepted` for staging (verify: appear in quotes inbox after seed)
- [x] 5.2 CMS int tests: status transitions, convert-to-order, catalog role 403, storefront-create (verify: `pnpm --filter cms test` passes new specs)
- [x] 5.3 Storefront tests: prepare empty cart 400, quote request clears cart (verify: `pnpm --filter storefront test` passes new specs)
- [x] 5.4 Manual checklist: US-05 CA1–CA4 — cart/checkout buttons, backend Solicitado, confirmation email with number (verify: document steps in `MANUAL-VERIFY.md`)
- [x] 5.5 Run `pnpm --filter cms typecheck`, `pnpm --filter storefront typecheck`, and `openspec status --change quotes-presupuesto-flow` shows complete
