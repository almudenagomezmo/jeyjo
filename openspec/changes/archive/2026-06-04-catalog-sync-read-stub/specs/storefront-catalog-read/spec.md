## ADDED Requirements

### Requirement: Storefront reads product price bases from synced CMS catalog

The storefront SHALL resolve `ProductPriceBase` (sku, p1Price, p2Price, vatRate) from Payload CMS data populated by ERP sync instead of hardcoded local stubs.

#### Scenario: REF-001 price base from CMS after sync

- **WHEN** catalog sync has applied stub data for REF-001 and the product is published
- **THEN** `getProductPriceBase('REF-001')` returns p1/p2/vat matching the synced Payload ERP fields

#### Scenario: Unknown SKU returns null

- **WHEN** `getProductPriceBase` is called for a SKU that does not exist or is not publicly visible
- **THEN** the function returns `null` without throwing

### Requirement: Catalog read uses server-side CMS access only

Price base resolution SHALL occur server-side using authenticated CMS access (Local API or internal REST with secret) and MUST NOT expose CMS credentials to the browser.

#### Scenario: Client bundle has no CMS secret

- **WHEN** inspecting the storefront client bundle for pricing resolution
- **THEN** no Payload secret or service role key is present

### Requirement: Catalog read respects public visibility rules

Price base resolution SHALL apply the same public visibility filters as catalog listing (published status, non-wildcard).

#### Scenario: Draft synced product not priced publicly

- **WHEN** sync creates a new product in draft status
- **THEN** `getProductPriceBase` returns null for that SKU until staff publishes it
