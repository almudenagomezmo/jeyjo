## MODIFIED Requirements

### Requirement: CMS generates Google Merchant Center product feed

The CMS SHALL generate a Google Merchant Center product feed in RSS 2.0 XML with the Google namespace containing public catalog products with fields `id`, `title`, `description`, `link`, `image_link`, `price`, `availability`, `brand`, and `gtin` when present, per **RF-028**, **RI-008**, and **RD-004**. The `brand` field SHALL be populated from the product's linked `brands.name` when a brand is assigned, and MUST NOT use `suppliers.name`.

#### Scenario: Published product with brand appears in feed

- **WHEN** a product is published, non-wildcard, has brand BIC, resolved catalog image, public P1 price, and stock semaphore not blocking sale
- **THEN** the feed XML contains `g:brand` with value "BIC"

#### Scenario: Product without brand omits g:brand

- **WHEN** a published product has no linked brand
- **THEN** the feed item does not include `g:brand`
- **AND** the product may still appear if other required fields are present

#### Scenario: Published product appears in feed

- **WHEN** a product is published, non-wildcard, has resolved catalog image, public P1 price, and stock semaphore not `out_of_stock` blocking sale
- **THEN** the feed XML contains one `item` with SKU as `g:id`, absolute PDP URL, price formatted as `NN.NN EUR`, and `g:availability` reflecting stock semaphore

#### Scenario: Product without image is omitted

- **WHEN** a published product has no resolvable catalog image
- **THEN** that SKU is excluded from the feed
- **AND** the generator records an omitted count for admin visibility

#### Scenario: Draft or wildcard products excluded

- **WHEN** a product is draft or marked wildcard
- **THEN** it does not appear in the feed XML
