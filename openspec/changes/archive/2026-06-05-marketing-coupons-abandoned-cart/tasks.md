## 1. Payload coupons and marketing settings

- [x] 1.1 Create `Coupons` collection with fields, unique code hook, uppercase normalization, and expiry deactivation hook (verify: create BLOG5 in admin UI)
- [x] 1.2 Create `marketing-settings` global with abandoned cart delays, discount percent default 10, B2B group allowlist (verify: global loads in admin)
- [x] 1.3 Add Marketing admin group and staff access rules for coupons + settings (verify: superadmin sees Marketing nav)
- [x] 1.4 Seed coupon BLOG5 (5%, no minimum) and optional MAYO10 in CMS seed (verify: Payload REST returns BLOG5 active)
- [x] 1.5 Add daily cron or hook path to deactivate expired coupons (verify: coupon past validUntil reads inactive)

## 2. Coupon validation engine

- [x] 2.1 Implement `apps/storefront/src/lib/coupon/validate.ts` with Payload fetch, date/uses/minimum checks (verify: unit test valid BLOG5)
- [x] 2.2 Add eligible subtotal helper excluding `group_offer` lines (verify: unit test CA-CHECKOUT-005 mixed cart → 2.50 € discount)
- [x] 2.3 Support percent and fixed discount types with cap at eligible subtotal (verify: fixed 15 on 10 eligible → 10 €)
- [x] 2.4 Add 60s server cache for coupon lookup with invalidation note in CMS hook (verify: second call within TTL skips fetch)
- [x] 2.5 Refactor `buildCheckoutTotals` to use validation result instead of `validateDemoCoupon` (verify: existing checkout totals tests updated)

## 3. Storefront coupon APIs and UI

- [x] 3.1 Add `POST /api/cart/coupon` and `DELETE /api/cart/coupon` routes (verify: curl apply BLOG5 returns discount 5%)
- [x] 3.2 Wire `/cart` coupon form to API; show errors and offer-exclusion warning (verify: CA-CHECKOUT-005 message visible)
- [x] 3.3 Update checkout prepare/place-order to revalidate coupon and embed in prepare token (verify: tampered coupon returns 400)
- [x] 3.4 Remove `DEMO_COUPONS` and `validateDemoCoupon` after migration (verify: no imports remain)
- [x] 3.5 Gate behind `MARKETING_COUPONS_ENABLED` env for safe rollout (verify: flag off skips discount)

## 4. Abandoned cart persistence

- [x] 4.1 Add Supabase migration `abandoned_cart_snapshots` with RLS and indexes (verify: `supabase db reset` applies)
- [x] 4.2 Implement `POST /api/cart/sync` debounced from cart store for authenticated B2C only (verify: guest sync no-op)
- [x] 4.3 Mark snapshot `converted` on successful place-order (verify: order JEY-TEST sets status converted)
- [x] 4.4 Implement HMAC recover token `GET /api/cart/recover` and `/cart?recover=` client merge (verify: token restores lines)
- [x] 4.5 Hook cart store mutations to call sync API (verify: add item updates `last_activity_at`)

## 5. Recovery emails and cron

- [x] 5.1 Create React Email templates: first reminder and second with coupon (verify: HTML renders in dev)
- [x] 5.2 Implement `runAbandonedCartRecovery` job reading marketing-settings (verify: unit test selects eligible snapshots)
- [x] 5.3 First email at 2h default with subject US-23 CA1 (verify: Mailpit receives correct subject)
- [x] 5.4 Second email generates single-use RECOVER coupon or uses configured fixed coupon (verify: Payload coupon created maxUses 1)
- [x] 5.5 Skip second email when snapshot converted (verify: unit test CA3)
- [x] 5.6 Add `GET /api/cron/abandoned-cart` with `CRON_SECRET` and Vercel cron every 15 min (verify: manual curl runs job)
- [x] 5.7 Respect B2B opt-in per pricing group from settings (verify: B2B default skipped)

## 6. Order coupon usage tracking

- [x] 6.1 Add Orders `afterChange` hook to increment coupon `usesCount` on committed status (verify: BLOG5 usesCount +1 after order)
- [x] 6.2 Idempotency guard per orderNumber (verify: duplicate hook does not double increment)

## 7. Verification and docs

- [x] 7.1 Unit tests: coupon validation, offer exclusion, recovery job selection, recover token (verify: `pnpm --filter storefront test` passes)
- [x] 7.2 Integration tests CA-CHECKOUT-004 and CA-CHECKOUT-005 fixtures (verify: tests pass in CI)
- [x] 7.3 Manual checklist US-18: create coupon, expiry, max uses; US-23: Mailpit 2h/24h flow in staging with shortened delays
- [x] 7.4 Document `MARKETING_COUPONS_ENABLED`, `CRON_SECRET`, `CART_RECOVER_SECRET` in env examples
