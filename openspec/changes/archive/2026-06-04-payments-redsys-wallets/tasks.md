## 1. Data model and CMS configuration

- [x] 1.1 Add Supabase migration `payment_notifications` with unique signature column and order reference (verify: migration applies; duplicate insert fails)
- [x] 1.2 Create Payload global `paymentSettings` with method toggles and transfer IBAN fields (verify: admin Settings shows payment section)
- [x] 1.3 Extend Payload `orders` with payment fields from delta spec (`paymentStatus`, `gateway`, auth codes, amounts) (verify: admin order document shows payment group)
- [x] 1.4 Regenerate `@jeyjo/database-types` if Supabase schema changed (verify: `pnpm --filter @jeyjo/database-types build`)

## 2. Redsys core library

- [x] 2.1 Add `apps/storefront/src/lib/payments/redsys/sign.ts` — HMAC SHA256 parameter signing and verification (verify: unit test with Redsys doc test vectors)
- [x] 2.2 Add `apps/storefront/src/lib/payments/redsys/build-redirect.ts` — card and Bizum parameter builder with env config (verify: test — amount 4500 cents, order ref length valid)
- [x] 2.3 Add `apps/storefront/src/lib/payments/redsys/parse-notification.ts` — decode `Ds_MerchantParameters`, map response codes (verify: test — authorized code → authorized boolean)
- [x] 2.4 Add `apps/storefront/src/lib/payments/orchestrator.ts` — route method code to Redsys, PayPal, or transfer (verify: unit test — disabled method throws)

## 3. Payment APIs (storefront)

- [x] 3.1 Implement `GET /api/payments/methods` reading CMS flags with cache (verify: disable Bizum in CMS → API omits bizum)
- [x] 3.2 Implement `POST /api/payments/redsys/init` — validate order, return signed form (verify: pending order → 200; authorized order → 409)
- [x] 3.3 Implement `POST /api/payments/redsys/notify` — verify signature, idempotent persist, PATCH Payload order (verify: integration test with fixture notification → status confirmed)
- [x] 3.4 Implement return routes `/checkout/retorno/ok` and `/checkout/retorno/ko` with signature check (verify: invalid sig → error page)
- [x] 3.5 Implement PayPal create + capture in `/api/payments/paypal/*` and return handler (verify: sandbox mock → order confirmed)
- [x] 3.6 Add `GET /api/payments/redsys/reconcile` cron route for stale pending orders (verify: order older than threshold appears in reconcile output)
- [x] 3.7 Extend `POST /api/checkout/place-order` response with `nextStep` for B2C gateway methods (verify: card → nextStep type redirect)

## 4. Payload order updates

- [x] 4.1 Add server helper `updateOrderPaymentStatus` calling Payload REST with service key (verify: mock PATCH sets paymentStatus authorized)
- [x] 4.2 Wire webhook and PayPal capture to set `status: confirmed` and IVA snapshot hook on confirm (verify: confirmed order line items eligible for ivaRateSnapshot per existing hook)

## 5. Checkout UI

- [x] 5.1 Filter B2C payment radios using `/api/payments/methods`; add Apple Pay and Google Pay buttons using design tokens only (verify: disabled wallet flag hides buttons)
- [x] 5.2 After place-order, auto-submit Redsys form or redirect per `nextStep` (verify: card selection navigates to Redsys test TPV in staging)
- [x] 5.3 Add `/checkout/transferencia` page with IBAN from CMS and order reference (verify: transfer method shows instructions, no Redsys)
- [x] 5.4 Update confirmation page to show paid vs pending transfer states (verify: authorized order shows confirmed copy)
- [x] 5.5 Add KO retry flow re-calling init without new place-order (verify: retry button on failed return)

## 6. Wallet integration

- [x] 6.1 Load Redsys InSite/wallet script conditionally on checkout when settings allow (verify: script absent when applePayEnabled false)
- [x] 6.2 Implement Apple Pay session start and Google Pay Payment Request handoff to Redsys (verify: manual test on supported device or mocked token path)
- [x] 6.3 Add domain verification assets under `public/.well-known` as required by Redsys/Apple docs (verify: file reachable at production URL)

## 7. Environment and documentation

- [x] 7.1 Document Redsys, PayPal, and `PAYMENTS_ENABLED` vars in `apps/storefront/.env.example` and `apps/cms/.env.example` (verify: all vars from design listed)
- [x] 7.2 Add `PAYMENTS_ENABLED` guard mirroring checkout flag pattern (verify: false → place-order skips gateway nextStep)

## 8. Tests and verification

- [x] 8.1 Unit tests: Redsys sign/verify, notification parse, orchestrator (verify: `pnpm --filter storefront test` passes)
- [x] 8.2 Integration test: notify endpoint idempotency with duplicate signature (verify: second call 200, single order update)
- [x] 8.3 Manual/E2E script for CA-CHECKOUT-003 on Redsys staging with card 4548812049400004 (verify: documented in change folder or PR notes)
- [x] 8.4 Run `pnpm --filter storefront typecheck` and `build` (verify: no errors)
- [x] 8.5 Confirm B2B checkout unchanged — no gateway options (**CA-CHECKOUT-006**) (verify: Playwright or manual with B2B fixture)
