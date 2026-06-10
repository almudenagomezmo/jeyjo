## MODIFIED Requirements

### Requirement: Single-SKU price resolution for PDP

The storefront SHALL resolve `PriceQuote` for the PDP primary SKU server-side during page load using the same rules as `/api/pricing/resolve`, including validated B2B `pricingCustomerId` when present, and pass the quote to the buy box as initial data.

#### Scenario: PDP server prefetch quote for anonymous visitor

- **WHEN** the PDP page loads for SKU REF-001 as an anonymous visitor
- **THEN** the server-rendered HTML includes a P1-based quote for that SKU without a client-side pricing flash

#### Scenario: PDP server prefetch honors B2B special price

- **WHEN** a validated B2B customer with an active special price for SKU REF-004 loads the PDP
- **THEN** the prefetched quote uses `appliedRule` `special_price`
- **AND** the quote matches `/api/pricing/resolve` for the same session

#### Scenario: PDP pricing API available for refresh

- **WHEN** a client calls `/api/pricing/resolve` with the PDP product SKU
- **THEN** the response matches the server prefetch rules for the same session context

### Requirement: Batch price resolution for PLP

The storefront SHALL expose a server-only batch pricing endpoint or function that resolves `PriceQuote` for multiple SKUs in one request for use on PLP pages, using the shared pricing engine and caller session rules from single-SKU resolution.

#### Scenario: PLP batch honors validated B2B session

- **WHEN** a validated B2B customer loads a PLP page
- **THEN** batch quotes use `pricingCustomerId` and may return `special_price` or `group_offer` per RF-007

### Requirement: PDP buy box uses PriceQuote not stub prices

`ProductBuyBox` on PDP routes SHALL render dual prices from `PriceQuote` via `getDualPrice` / `getPriceView`, not from hardcoded `Product.priceNoVat` on demo data. When `listUnit` exceeds `netUnit`, the buy box MAY use strikethrough and offer background styling but SHALL NOT render a textual «Oferta limitada» badge.

#### Scenario: Buy box shows dual price from quote

- **WHEN** the buy box receives a quote with net 1.00 and gross 1.21 for an anonymous visitor in B2C display mode
- **THEN** the displayed primary and secondary prices match RF-011 for that mode

#### Scenario: Offer styling without limited-offer text badge

- **WHEN** a quote includes `listUnit` greater than `netUnit`
- **THEN** the buy box shows strikethrough reference price and offer background
- **AND** no «Oferta limitada» text badge is rendered
