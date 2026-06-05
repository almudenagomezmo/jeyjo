# Manual verification — quick-order-excel (US-11)

Staging B2B account validated (e.g. empresa demo seed).

## CA1 — Manual reference and quantity

- [ ] Open `/intranet/pedido-rapido`
- [ ] Enter a known Jeyjo reference and quantity
- [ ] Confirm fields are visible and usable

## CA2 — Live validation preview

- [ ] After typing reference, preview shows product name, image, and **Precio actual**
- [ ] Add to cart increases minicart / cart count with correct product

## CA3 — Excel bulk add

- [ ] Download template from page link
- [ ] Upload Excel with 10 valid references
- [ ] Summary shows 10 OK rows
- [ ] **Añadir todas las válidas** adds 10 lines in one action (RF-019)

## CA4 — Uncatalogued reference

- [ ] Enter unknown reference → not found message and free-text form
- [ ] Save request → no cart line
- [ ] Complete checkout → observations include `[Solicitudes no catalogadas]` block

## Regression

- [ ] `/intranet/pedidos` purchase history still works
- [ ] Portal nav shows Pedido rápido without "Próximamente" badge
