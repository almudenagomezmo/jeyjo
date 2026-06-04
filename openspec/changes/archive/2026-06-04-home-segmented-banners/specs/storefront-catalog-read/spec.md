## ADDED Requirements

### Requirement: List public products by curated IDs for home carousels

The storefront SHALL expose a server-only function `listPublicProductsByIds(ids: string[])` that returns PLP row shapes for published, non-wildcard products whose CMS document IDs or SKUs match the input, preserving caller-provided order.

#### Scenario: Curated IDs resolve in order

- **WHEN** `listPublicProductsByIds` is called with three IDs for published products in order A, B, C
- **THEN** the result contains exactly those three rows in order A, B, C

#### Scenario: Draft or wildcard omitted

- **WHEN** the input includes a draft product ID and a wildcard published SKU
- **THEN** those entries are omitted from the result without throwing

#### Scenario: Unknown IDs skipped

- **WHEN** the input includes an ID that does not exist
- **THEN** the function returns only matching public products and does not fail the whole batch

### Requirement: Home product list uses server-side CMS access only

Home carousel product resolution SHALL use the same server-only CMS access pattern as PLP listing and MUST NOT expose CMS credentials to the browser.

#### Scenario: Client bundle has no home list credentials

- **WHEN** inspecting the storefront client bundle for home carousel fetching
- **THEN** no Payload secret or service role key is present
