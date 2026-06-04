## MODIFIED Requirements

### Requirement: Search route reuses PLP shell

The `/search` route SHALL reuse the same faceted listing shell when a query parameter `q` is present, resolving product candidates via storefront vector search (Qdrant + public catalog hydration) per `storefront-predictive-search`, then applying existing facet filters and pagination on that candidate set.

#### Scenario: Search with query shows faceted results

- **WHEN** a user navigates to `/search?q=boligrafo` and Qdrant returns matching public products
- **THEN** the page shows a faceted product grid scoped to vector-matched public products

#### Scenario: Vector miss shows empty state

- **WHEN** a user navigates to `/search?q=zzznomatch` and vector search returns no public SKUs
- **THEN** the page shows the empty search state without demo catalog injection in production
