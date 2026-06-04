## ADDED Requirements

### Requirement: Batch price resolution for home carousels

The storefront batch pricing endpoint or function SHALL resolve `PriceQuote` for all SKUs displayed on the home page carousels in one request, using the same session and P1/P2 rules as PLP batch resolution.

#### Scenario: Home batch anonymous quotes use P1 only

- **WHEN** an unauthenticated home page requests batch quotes for SKUs in the B2C top-sales carousel
- **THEN** each quote uses `p1_retail` and the response does not include P2 fields

#### Scenario: Home batch honors B2B display mode

- **WHEN** the active price mode is B2B (manual toggle) and the home requests batch quotes for B2B carousel SKUs
- **THEN** quotes follow the same B2B presentation rules as PLP for that mode

### Requirement: Home product cards use PriceQuote not stub prices

`ProductCard` on home carousel sections SHALL render dual prices from `PriceQuote` via `getDualPrice` / `getPriceView` helpers, not from hardcoded demo product prices.

#### Scenario: Home card shows dual price from quote

- **WHEN** a home carousel card receives a quote with net 1.00 and gross 1.21 for an anonymous visitor in B2C display mode
- **THEN** the card primary and secondary prices match RF-011 presentation for that mode
