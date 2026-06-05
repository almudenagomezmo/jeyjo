## 1. Supabase schema and dispatch core

- [x] 1.1 Add migration for `notifications`, `notification_preferences`, `erp_invoice_sync_state` with RLS policies and indexes (verify: `supabase db reset` applies cleanly)
- [x] 1.2 Add security definer function or service-role insert path for idempotent notification create (verify: duplicate `idempotency_key` rejected)
- [x] 1.3 Implement `dispatchNotification` in `apps/cms/src/lib/notifications/dispatch.ts` with channel resolution and profile fan-out (verify: unit test portal-only skips email)
- [x] 1.4 Backfill default `notification_preferences` for existing B2B profiles in seed or migration (verify: new B2B login has preferences row)

## 2. ERP invoice sync stub

- [x] 2.1 Extend `ErpInvoiceListItem` and `ErpDocumentsReader.listInvoicesByCustomer` in `@jeyjo/erp-ports` (verify: stub tests pass)
- [x] 2.2 Add CA-B2B-006 fixture invoice for empresa@test.com erp customer code (verify: stub returns new id after seed scenario)
- [x] 2.3 Implement `runInvoiceSync` comparing stub results to `erp_invoice_sync_state` (verify: unit test emits one `invoice_new` per new id)
- [x] 2.4 Add `GET /api/cron/invoice-sync` with `CRON_SECRET` and register 5-minute cron in Vercel config (verify: manual curl with secret runs sync)

## 3. Proactive emails (RI-009)

- [x] 3.1 Create React Email templates: invoice, order status, quote status, quote expiring (verify: render snapshots or storyless HTML output)
- [x] 3.2 Implement send helpers in `apps/cms/src/lib/notifications/emails/` using Payload transport (verify: Mailpit receives test message in dev)
- [x] 3.3 Wire email send into `dispatchNotification` with retry logging (verify: failure leaves `email_sent_at` null and logs error)
- [x] 3.4 Handle Resend hard bounce → set `email_disabled_at` (verify: unit test preference update)

## 4. CMS event hooks

- [x] 4.1 Add `Orders` `afterChange` hook for `jeyjoStatus` customer-visible transitions (verify: integration test creates notification on shipped)
- [x] 4.2 Add `Quotes` `afterChange` hook for `sent` / `accepted` / `cancelled` B2B (verify: sent transition dispatches `quote_status`)
- [x] 4.3 Add `GET /api/cron/quote-expiry-notifications` daily job for `validUntil` +7 days (verify: idempotent second run same day)
- [x] 4.4 Gate hooks behind `NOTIFICATIONS_ENABLED` env for safe rollout (verify: flag off skips dispatch)

## 5. Storefront APIs

- [x] 5.1 `GET /api/intranet/notifications` with pagination and unread filter (verify: 401 without B2B session)
- [x] 5.2 `PATCH /api/intranet/notifications` mark one / mark all (verify: badge count decreases)
- [x] 5.3 `GET` and `PATCH /api/intranet/notification-preferences` (verify: PATCH persists `invoice_channel`)

## 6. Portal UI

- [x] 6.1 Build `NotificationBell` client component using design tokens only (verify: no hardcoded hex in component)
- [x] 6.2 Integrate bell into `PortalTopBar` with unread badge (verify: intranet route shows bell)
- [x] 6.3 Subscribe to Supabase Realtime + 60s polling fallback (verify: insert row updates badge without reload)
- [x] 6.4 Replace `/intranet/mi-cuenta` scaffold with `NotificationPreferencesForm` (verify: US-21 CA3 channels save)
- [x] 6.5 Remove scaffold entry for mi-cuenta in `lib/intranet/navigation.ts` if present (verify: no Próximamente badge)

## 7. Verification and docs

- [x] 7.1 Unit tests: dispatch idempotency, preferences channels, invoice diff (verify: `pnpm --filter storefront test` and cms tests pass)
- [x] 7.2 Integration test CA-B2B-006: sync new invoice for empresa@test.com → email subject + portal row within cron window (verify: test passes in CI)
- [x] 7.3 Manual checklist US-21: mark read, portal-only, off, order status email, quote expiry
- [x] 7.4 Document `CRON_SECRET`, `NOTIFICATIONS_ENABLED`, and cron paths in `apps/storefront/README` or env example
