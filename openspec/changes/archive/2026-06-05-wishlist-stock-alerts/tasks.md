## 1. Supabase schema and preferences

- [x] 1.1 Add migration `stock_watches` table with unique `(web_profile_id, sku)`, RLS policies, and index on `sku` (verify: `supabase db reset` applies)
- [x] 1.2 Add `wishlist_channel` column to `notification_preferences` default `email` (verify: existing rows backfill)
- [x] 1.3 Regenerate database types if project uses codegen (verify: `stock_watches` in `@jeyjo/database-types`)

## 2. Notification service extensions

- [x] 2.1 Extend `NotificationType` and `channelFieldForType` with `stock_available` → `wishlist_channel` (verify: unit test mapping)
- [x] 2.2 Implement `dispatchProfileNotification` in `apps/cms/src/lib/notifications/dispatch-profile.ts` (verify: single profile receives row)
- [x] 2.3 Add `stock-available` React Email template and register in `sendProactiveEmail` (verify: Mailpit preview in dev)
- [x] 2.4 Gate dispatch behind `WISHLIST_STOCK_ALERTS_ENABLED` aligned with `NOTIFICATIONS_ENABLED` (verify: flag off skips dispatch)

## 3. Stock sync wishlist job

- [x] 3.1 Capture per-SKU `previousIndicator` / `newIndicator` in `StockSyncOrchestrator` for updated products only (verify: orchestrator test returns transition map)
- [x] 3.2 Implement `processWishlistStockAlerts` with watch query, idempotency key, and watch metadata update (verify: unit test limited→available dispatches once)
- [x] 3.3 Invoke wishlist job at end of `runStockSync` when `productsUpdated > 0` and status success/partial (verify: int test stub sync triggers mock dispatch)
- [x] 3.4 Cap dispatches per run at 500 with warning log (verify: unit test overflow logs warning)

## 4. Storefront wishlist APIs

- [x] 4.1 Implement `GET/POST/DELETE/PUT /api/wishlist` with session `web_profile` auth (verify: curl POST creates watch row)
- [x] 4.2 Implement `GET /api/intranet/stock-watches` with B2B guard and Payload indicator enrichment (verify: validated B2B returns indicators)
- [x] 4.3 Extend `GET/PATCH /api/intranet/notification-preferences` with `wishlist_channel` (verify: PATCH persists fourth category)

## 5. Storefront UI

- [x] 5.1 Add `useWishlistSync` hook: merge localStorage on login, server toggle on authenticated toggle (verify: login merges SKUs)
- [x] 5.2 Update `ProductCard` and `ProductBuyBox` to call wishlist APIs when session exists (verify: heart persists after reload when logged in)
- [x] 5.3 Add PDP toast for validated B2B adding limited-stock product (verify: message shown once per add)
- [x] 5.4 Replace `/intranet/stock` scaffold with `StockWatchesTable` using design tokens (verify: US-07 CA2 menu opens live page)
- [x] 5.5 Add Avisos de stock category to `NotificationPreferencesForm` (verify: mi cuenta shows fourth row)
- [x] 5.6 Remove `scaffold` from stock entry in `navigation.ts` (verify: no `IntranetScaffoldPage` on `/intranet/stock`)

## 6. Verification and docs

- [x] 6.1 Unit tests: transition detection, idempotency, channel off, profile-scoped dispatch (verify: `pnpm --filter cms test` passes)
- [x] 6.2 Storefront tests: wishlist API auth, stock-watches guard, merge hook (verify: `pnpm --filter storefront test` passes)
- [x] 6.3 Integration: watch SKU → manual stock sync stub → notification row + optional Mailpit email (verify: end-to-end in staging)
- [x] 6.4 Manual checklist: US-07 CA2 Avisos de stock page; RF-022 wishlist notification in bell; preference off blocks email
- [x] 6.5 Document `WISHLIST_STOCK_ALERTS_ENABLED` in `apps/cms/.env.example` and `apps/storefront/.env.example`
