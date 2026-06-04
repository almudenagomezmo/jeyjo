# Manual QA — checkout-shipping-b2c-b2b

Run on staging with `CHECKOUT_ENABLED=true`, Supabase migrated, CMS running, and matching `STOREFRONT_PAYLOAD_API_KEY` on CMS + storefront.

## CA-CHECKOUT-001 (B2C below threshold)

1. Guest or B2C session, cart subtotal after coupon ≈ 38,00 € (home delivery).
2. Open `/checkout`, complete delivery, go to review.
3. Expect shipping line: **Gastos de envío: 5,00 € (IVA incluido)** and total **43,00 €**.

## CA-CHECKOUT-002 (B2C free shipping)

1. Cart merchandise subtotal ≥ 40,00 €, home delivery.
2. Expect **Envío gratuito** and shipping cost 0 in summary.

## CA-CHECKOUT-006 (B2B read-only payment)

1. Log in as validated B2B (`validated_at` set, group 2–4) with `default_payment_method` e.g. "Giro a 30 días".
2. Open `/checkout` → review step.
3. Expect read-only payment label; **no** card/Bizum/PayPal radios.
4. Place order → status `pending_confirmation` in CMS.

## Pickup Alfaro

1. Select **Recogida en tienda — Alfaro** on delivery step.
2. Summary shipping cost must be **0**.
