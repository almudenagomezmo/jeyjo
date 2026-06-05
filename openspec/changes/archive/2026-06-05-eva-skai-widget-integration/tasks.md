## 1. SKAI adapter core (CMS)

- [x] 1.1 Create `apps/cms/src/eva/types.ts` with `SkaiEvaAdapter`, `SkaiWidgetConfig`, `SkaiMetrics`, `SkaiOrderPayload` (verify: types compile)
- [x] 1.2 Implement `eva/registry.ts` resolving `SKAI_ADAPTER` stub|live mirroring `erp/registry.ts` (verify: dev defaults to stub without env)
- [x] 1.3 Implement stub adapter with fixture widget config, metrics, and no-op upload (verify: unit test returns enabled widget id)
- [x] 1.4 Implement live adapter HTTP client with 5 s timeout, health check, and metrics fetch (verify: mock fetch test for validateConnection)
- [x] 1.5 Add `resolveEvaContext(token)` building anonymous vs authenticated payloads with purchase history + pricing (#23, #6) (verify: two customer tokens never cross-leak in int test)

## 2. SKAI settings and admin config

- [x] 2.1 Add Payload global or singleton `skaiSettings` (enabled, hours, fallback contacts, uploaded PDF refs) (verify: admin saves and reads back)
- [x] 2.2 Create `SkaiConfigView` component + SCSS using Payload UI patterns (verify: superadmin sees form at `/admin/skai-config`)
- [x] 2.3 Register custom admin view and restrict access to `superadmin` only (verify: `catalogo` role gets 403)
- [x] 2.4 Add "Probar EVA" embed panel with staff test token (verify: no customer PII in network payload)
- [x] 2.5 Wire metrics section (30-day conversations + unresolved questions) from adapter (verify: stub shows fixture labels)

## 3. EVA order webhook (CMS)

- [x] 3.1 Add `POST /api/eva/orders` with HMAC `X-Skai-Signature` validation using `SKAI_WEBHOOK_SECRET` (verify: invalid signature returns 401)
- [x] 3.2 Map `SkaiOrderPayload` to Payload `orders` with `origin=eva`, `validatedEva=false`, `jeyjoStatus=pending_confirmation`, line snapshots (verify: order appears in EVA queue view)
- [x] 3.3 Implement idempotency on `skaiExternalId` / external order number (verify: duplicate POST returns 200 without second doc)
- [x] 3.4 Add integration test with signed fixture payload (verify: `pnpm --filter cms test` passes)

## 4. Context and bootstrap APIs

- [x] 4.1 Add CMS `GET /api/eva/context` validating short-lived JWT and returning scoped payload (verify: anonymous omits customer id)
- [x] 4.2 Add storefront `GET /api/eva/bootstrap` reading `skaiSettings`, issuing context JWT, and returning widget config + fallback contacts (verify: disabled setting returns `enabled: false`)
- [x] 4.3 Add rate limiting on bootstrap and context-token endpoints (verify: burst returns 429)
- [x] 4.4 Document JWT signing secret `EVA_CONTEXT_JWT_SECRET` shared between storefront and CMS (verify: documented in both `.env.example`)

## 5. Storefront EVA widget UI

- [x] 5.1 Add EVA launcher styles using `globals.css` tokens (primary color, shadow, z-index above minicart) (verify: no hardcoded hex in component)
- [x] 5.2 Implement `EvaWidgetLauncher` client component: fetch bootstrap, load SKAI script when enabled, show RI-005 fallback on error (verify: forced 500 shows Spanish fallback message)
- [x] 5.3 Pass PDP context (sku, title) from server layout or page props into bootstrap (verify: PDP network payload includes `productSku`)
- [x] 5.4 Mount launcher in `app/layout.tsx` and intranet layout (verify: button visible on `/` and `/intranet`)
- [x] 5.5 Respect `EVA_WIDGET_ENABLED` feature flag (verify: flag off mounts nothing)

## 6. Dashboard EVA panel upgrade

- [x] 6.1 Extend `buildEvaPanel` to call adapter metrics when `SKAI_ADAPTER=live` and health OK (verify: live mock returns non-zero activeConversations)
- [x] 6.2 Merge SKAI unresolved queries with pending EVA orders (verify: both sources appear in panel list)
- [x] 6.3 Update `DashboardKpisView` to hide preview label when live metrics available (verify: stub still shows preview label)
- [x] 6.4 Update dashboard int test for live vs stub panel behavior (verify: test passes in CI)

## 7. Configuration, docs, and verification

- [x] 7.1 Add env vars to `apps/cms/.env.example` and `apps/storefront/.env.example`: `SKAI_ADAPTER`, `SKAI_API_URL`, `SKAI_API_KEY`, `SKAI_WIDGET_ID`, `SKAI_WIDGET_SCRIPT_URL`, `SKAI_WEBHOOK_SECRET`, `EVA_CONTEXT_JWT_SECRET`, `EVA_WIDGET_ENABLED` (verify: defaults documented)
- [x] 7.2 Add `apps/cms/docs/skai-integration.md` with webhook contract, context token flow, and open questions (verify: RI-005 referenced)
- [x] 7.3 Seed or fixture: one EVA webhook order and stub metrics for manual QA (verify: optional seed block)
- [x] 7.4 Manual checklist US-22: floating button all pages, anonymous product question, fallback contacts, no special prices for guest
- [x] 7.5 Manual checklist US-20: save hours/contacts, upload PDF, test panel, metrics section; US-19: dashboard live count when adapter live
- [x] 7.6 Manual checklist CA-BACKEND-003: webhook order in EVA queue → validate/reject flows unchanged
