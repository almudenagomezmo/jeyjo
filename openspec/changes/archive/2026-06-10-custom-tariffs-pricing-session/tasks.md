## 1. Tarifas personalizadas (UI + API)

- [x] 1.1 Columna **Tarifa en tienda** con `appliedNetPrice` desde `resolvePriceQuotesBatch`
- [x] 1.2 Tooltip ℹ cuando el pactado no es la regla activa
- [x] 1.3 Badge **Vigente** en estilo danger (rojo)
- [x] 1.4 Omitir descuento derivado negativo si neto ≥ P2

## 2. Sesión B2B en resolución SSR

- [x] 2.1 `getSessionPricingCustomerId` compartido
- [x] 2.2 PDP, PLP, home, suggest, compare y mega-menú pasan `customerId` al batch

## 3. CMS y motor

- [x] 3.1 Validación: neto pactado ≤ P2 en `special-prices`
- [x] 3.2 Etiqueta oferta de grupo: «Oferta de grupo»
- [x] 3.3 Quitar badge «Oferta limitada» en `ProductBuyBox`

## 4. Documentación OpenSpec

- [x] 4.1 Delta specs y sincronización a `openspec/specs/*`
- [x] 4.2 ROADMAP #60
