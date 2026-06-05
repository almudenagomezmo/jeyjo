## MODIFIED Requirements

### Requirement: PLP lists public products from CMS by category

The storefront SHALL render category, subcategory, and family PLP routes using server-fetched published, non-wildcard products from Payload CMS whose category slug matches the active navigation node **or any descendant category slug in the CMS navigation tree**, replacing the demo `lib/data/products.ts` source on `/c/*` routes.

#### Scenario: Category page shows CMS products

- **WHEN** a user opens `/c/escritura` and Payload has published products linked to a descendant category slug such as `boligrafos` (but not directly to `escritura`)
- **THEN** the PLP displays those products in the grid with a total count matching the filtered public set for the `escritura` tree

#### Scenario: Subcategory page includes family products

- **WHEN** a user opens `/c/escritura/boligrafos` and Payload has published products linked only to a family slug such as `boligrafos-gel`
- **THEN** the PLP displays those products in the grid

#### Scenario: Family page shows only family products

- **WHEN** a user opens `/c/escritura/boligrafos/boligrafos-gel` and Payload has published products linked to `boligrafos-gel`
- **THEN** the PLP displays only products in that family branch (not products from sibling families under the same subcategory)

#### Scenario: Empty category shows empty state

- **WHEN** no published products match any slug in the active navigation subtree
- **THEN** the PLP shows an empty-state message without throwing
