## ADDED Requirements

### Requirement: Single-SKU price resolution for PDP

The storefront SHALL resolve `PriceQuote` for the PDP primary SKU server-side during page load using the same rules as `/api/pricing/resolve`, and pass the quote to the buy box as initial data.

#### Scenario: PDP server prefetch quote

- **WHEN** the PDP page loads for SKU REF-001 as an anonymous visitor
- **THEN** the server-rendered HTML includes a P1-based quote for that SKU without a client-side pricing flash

#### Scenario: PDP pricing API available for refresh

- **WHEN** a client calls `/api/pricing/resolve` with the PDP product SKU
- **THEN** the response matches the server prefetch rules for the same session context

### Requirement: PDP buy box uses PriceQuote not stub prices

`ProductBuyBox` on PDP routes SHALL render dual prices from `PriceQuote` via `getDualPrice` / `getPriceView`, not from hardcoded `Product.priceNoVat` on demo data.

#### Scenario: Buy box shows dual price from quote

- **WHEN** the buy box receives a quote with net 1.00 and gross 1.21 for an anonymous visitor in B2C display mode
- **THEN** the displayed primary and secondary prices match RF-011 for that mode

#### Scenario: Offer badge from quote list price

- **WHEN** a quote includes `listUnit` greater than `netUnit`
- **THEN** the buy box may show the limited-offer badge consistent with PLP card behavior
