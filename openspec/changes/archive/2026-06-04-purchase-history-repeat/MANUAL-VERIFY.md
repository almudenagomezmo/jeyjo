# Manual verify — purchase-history-repeat

## Preconditions

- B2B user `empresa@test.com` (customer `B2B-EMPRESA1`) validated; CMS catalog seeded with `REF-010` (`ref-010` slug).
- Storefront env: `STOREFRONT_PAYLOAD_API_KEY`, CMS URL, Supabase service role.

## Checklist

- [ ] `/intranet/pedidos` shows **Datos histórico** table (no “Próximamente” scaffold).
- [ ] REF-010 row shows **Precio actual** at ~5,50 € (not 5,00 € as active price); historical 5,00 € tachado si aplica.
- [ ] Filtros: fecha desde/hasta, referencia `REF-01`, departamento **Sede central** (si visible).
- [ ] Paginación cuando >25 líneas (opcional con fixture ampliado).
- [ ] Seleccionar REF-010 → **Añadir al carrito** → minicart abierto; carrito con cantidad 12 y precio actual.
- [ ] Toast menciona observaciones en checkout.
- [ ] SKU `9000000001` no aparece en listado.
- [ ] Sin sesión B2B: API devuelve 401.

## CA-B2B-004

Dado histórico REF-010 a 5,00 € y precio motor ~5,50 €: repetir pedido y confirmar línea en carrito usa precio actual.
