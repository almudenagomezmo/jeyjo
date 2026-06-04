# CA-CHECKOUT-003 — Manual E2E (Redsys staging)

## Prerequisites

- `PAYMENTS_ENABLED=true` in `apps/storefront/.env.local`
- Redsys test credentials (`REDSYS_MERCHANT_CODE`, `REDSYS_TERMINAL`, `REDSYS_SECRET_KEY`, `REDSYS_ENV=test`)
- `NEXT_PUBLIC_STOREFRONT_URL` reachable by Redsys (use ngrok for local webhook)
- Payload CMS running with `paymentSettings` global and storefront API key

## Steps

1. Add products to cart and open `/checkout` as B2C guest or customer.
2. Select **Tarjeta** and confirm order.
3. Storefront auto-submits to `sis-t.redsys.es` test TPV.
4. Pay with test card **4548812049400004**, valid expiry, CVV **123**.
5. On OK return, order shows on `/checkout/confirmacion?order=…&paid=1`.
6. In Payload admin, order `jeyjoStatus` = `confirmed`, `paymentStatus` = `authorized`.

## Webhook

- Redsys posts to `/api/payments/redsys/notify` — verify `payment_notifications` row in Supabase.
- Duplicate notifications must not double-update the order.

## KO retry

- Force KO in TPV → `/checkout/retorno/ko` → **Reintentar pago** calls `/api/payments/redsys/init` without new place-order.
