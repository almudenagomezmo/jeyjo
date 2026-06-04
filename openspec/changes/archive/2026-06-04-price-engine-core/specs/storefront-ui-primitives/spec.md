## MODIFIED Requirements

### Requirement: Price and format utilities available

The storefront SHALL include `lib/utils/price.ts` and `lib/utils/format.ts` where `price.ts` consumes `PriceQuote` from `@jeyjo/pricing` (via the server pricing API) and exposes `getPriceView`, `getDualPrice`, and related helpers compatible with jeyjo-next component signatures.

#### Scenario: Price helper uses resolved quote

- **WHEN** a page renders a product price after calling the pricing resolution API
- **THEN** `getPriceView` derives display figures from the quote net and gross values
- **AND** the module remains at `apps/storefront/src/lib/utils/price.ts`

#### Scenario: Format helper unchanged path

- **WHEN** components import currency formatting from `lib/utils/format.ts`
- **THEN** the module path is unchanged from the foundation change
