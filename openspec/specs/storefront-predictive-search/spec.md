# Storefront predictive search

## Purpose

Server-backed vector suggest API (Qdrant + embeddings), header SearchBar dropdown, and vector-backed full search candidates for `/search?q=`.

## Requirements

### Requirement: Predictive suggest API is server-only and Qdrant-backed

The storefront SHALL expose a server route `/api/search/suggest` that accepts a normalized query of at least three characters, generates a 384-dimensional embedding with the same model as the CMS search indexer, queries Qdrant collections `products` and `categories`, and returns JSON suitable for the header dropdown without exposing Qdrant credentials to the browser.

#### Scenario: Valid query returns product and category suggestions

- **WHEN** a client sends `POST /api/search/suggest` with body `{ "q": "boli" }` and Qdrant contains indexed product points
- **THEN** the response includes up to ten product suggestions and up to four category suggestions ordered by vector similarity score

#### Scenario: Short query is rejected

- **WHEN** a client sends a query with fewer than three non-whitespace characters
- **THEN** the route responds with HTTP 400 and does not call Qdrant

#### Scenario: Qdrant unavailable in production

- **WHEN** Qdrant is unreachable and `NODE_ENV` is production
- **THEN** the route responds with HTTP 503 and the header UI shows an error or empty state without silently using demo catalog data

### Requirement: Product suggestions include US-01 visual fields

Each product suggestion in the suggest response SHALL include at least: public title, link href to PDP (`/p/{slug}` or stable sku path), thumbnail or placeholder glyph, wholesale reference, OEM reference when present, EAN when present, and resolved price presentation for the active price mode (dual labels per price-resolution spec).

#### Scenario: Typo-tolerant match surfaces BIC pen

- **WHEN** Qdrant indexes "Bolígrafo BIC Cristal Azul" and the user queries "boligrafo vic"
- **THEN** the suggest response includes that product in the product list

#### Scenario: EAN search returns matching SKU

- **WHEN** a product with EAN `3086123519963` is indexed and the user queries that EAN
- **THEN** the first product suggestion corresponds to that SKU

### Requirement: Wildcard and non-public products are excluded from suggestions

Hits returned from Qdrant SHALL be filtered after CMS hydration so that products with `isWildcard = true` or not in published public catalog state never appear in the dropdown.

#### Scenario: Wildcard SKU in Qdrant is not shown

- **WHEN** Qdrant returns a point for a wildcard product that is not public
- **THEN** that SKU is omitted from the suggest response

### Requirement: Category suggestions link to catalog routes

Category suggestions SHALL include a human-readable label and an href under `/c/` derived from the indexed category slug.

#### Scenario: Category chip navigates to PLP

- **WHEN** the suggest response includes a category with slug `escritura`
- **THEN** the category href is `/c/escritura` (or the correct nested path when subcategory)

### Requirement: Header SearchBar uses predictive suggest with debounce

The `SearchBar` component SHALL request `/api/search/suggest` with debounce after the user types at least three characters, show a rich dropdown (product rows with image, name, price; category chips), support keyboard navigation and ARIA combobox semantics, and navigate to `/search?q=` on Enter or explicit "view all results" action.

#### Scenario: Dropdown opens from third character

- **WHEN** a user types three characters in the header search field
- **THEN** the dropdown opens and displays product and/or category sections when the API returns data

#### Scenario: Empty suggest shows US-01 message

- **WHEN** the API returns no products and no categories for a non-empty query
- **THEN** the dropdown shows the message "No hemos encontrado resultados para «{q}»" and MAY show related category chips when available

#### Scenario: Submit navigates to faceted search page

- **WHEN** a user presses Enter with query "boligrafo"
- **THEN** the browser navigates to `/search?q=boligrafo`

### Requirement: Suggest latency target is measured server-side

The suggest route SHALL record phase timings (embed, Qdrant, hydrate) and log total duration; staging verification SHALL target p95 total duration under 150 ms when Qdrant and CMS are in the same region as the storefront deployment.

#### Scenario: Staging latency check

- **WHEN** operators run the documented verification command against staging with a warmed model
- **THEN** at least 9 of 10 sequential suggest requests for "boli" complete in under 150 ms server-side

### Requirement: Vector search backs full search results page

The function that resolves product candidates for `/search?q=` SHALL use the same embedding and Qdrant `products` search as suggest (with a higher result limit suitable for PLP facet aggregation) instead of demo token matching or CMS `contains` text-only filtering alone.

#### Scenario: Search page uses vector candidates

- **WHEN** a user opens `/search?q=boligrafo`
- **THEN** the PLP shell lists public products whose SKUs were returned by vector search before facet filters are applied
