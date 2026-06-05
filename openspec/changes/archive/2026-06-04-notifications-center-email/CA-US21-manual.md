# Manual checklist — US-21 / RF-022

- [ ] Login as B2B `empresa@test.com`; bell visible on `/intranet`
- [ ] Staff changes order to `shipped` → portal notification + email (Mailpit) when `NOTIFICATIONS_ENABLED=true`
- [ ] Mark single notification read → badge decreases
- [ ] Mark all read → badge hidden
- [ ] Mi cuenta → Facturas "Solo portal" → new invoice sync does not email (portal row only)
- [ ] Mi cuenta → Pedidos "Desactivado" → no order notifications
- [ ] Cron `GET /api/cron/invoice-sync` with `CRON_SECRET` after bootstrap adds `INV-2026-0003` to stub → one new notification
- [ ] Quote with `validUntil` in 7 days → expiry cron creates `quote_expiring` once
