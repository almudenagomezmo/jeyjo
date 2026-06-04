# Manual verify — quick-order-excel

## Preconditions

- B2B user validated (e.g. `empresa@test.com`); CMS catalog with known SKUs and optional OEM/EAN fields.
- `QUICK_ORDER_ENABLED=true` (default); storefront env: CMS URL, Supabase session.

## Checklist

- [ ] `/intranet/pedido-rapido` shows reference form and Excel upload (no “Próximamente” scaffold).
- [ ] Valid SKU: live preview with name, image, **Precio actual** (B2B net).
- [ ] Add single line → minicart opens; cart line uses current B2B price.
- [ ] Unknown reference → non-catalog panel; save request → listed as pending.
- [ ] Pending non-catalog appears in checkout **Observaciones** (within 500 chars).
- [ ] After place order, pending non-catalog list is cleared.
- [ ] Excel template downloads; upload 10 valid refs → validate table → **Añadir N válidas** adds 10 cart lines.
- [ ] OEM and EAN lookups resolve same product when configured in CMS.
- [ ] Wildcard `9000000001` rejected in lookup and Excel validation.
- [ ] Without B2B session: quick-order APIs return 401.

## US-11 / RF-019

- CA3: Excel with 10 valid published references adds 10 cart lines in one confirm action.
- CA4: Failed lookup offers free-text non-catalog request merged at checkout.
