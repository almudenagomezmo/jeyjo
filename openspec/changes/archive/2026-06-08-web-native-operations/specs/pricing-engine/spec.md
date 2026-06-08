## ADDED Requirements

### Requirement: Special prices and group offers are CMS-administered in web-native mode

When `webNativeMode` is true, authoritative writes to `special_prices` and `group_offers` SHALL originate from Payload pricing collections via mirror hooks. `ErpPricingSyncService` SHALL NOT run on schedule or manual trigger.

#### Scenario: Cart uses CMS-mirrored special price

- **WHEN** staff set special price 7.00 for customer C1 SKU REF-002 in CMS and the customer adds REF-002 to cart
- **THEN** `resolvePrice` applies rule `special_price` with net unit 7.00

#### Scenario: Pricing sync service skipped

- **WHEN** `webNativeMode` is true and ERP pricing sync endpoint is invoked
- **THEN** the response status is 410 or the service no-ops without mutating Supabase pricing tables
