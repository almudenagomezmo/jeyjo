# CMS Merchant Center feed

## Purpose

Automatic Google Merchant Center product feed generation and serving from Payload CMS per **RF-028**, **RI-008**, and **RD-004**.

## Requirements

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

### Requirement: Merchant feed is served at a stable public URL

The CMS SHALL expose the latest generated feed at `GET /api/feeds/merchant-center.xml` with `Content-Type: application/xml` and cache headers suitable for Google fetch, per **RI-008**.

#### Scenario: Public fetch returns XML

- **WHEN** Google Merchant Center or an unauthenticated client requests the feed URL
- **THEN** the response is HTTP 200 with valid RSS XML
- **AND** includes `ETag` or `Last-Modified` when a snapshot exists

#### Scenario: Feed disabled by configuration

- **WHEN** `MERCHANT_FEED_ENABLED` is `false` or `analyticsSettings.merchantFeedEnabled` is false
- **THEN** the feed route returns HTTP 404 or 503 without exposing partial catalog data

### Requirement: Merchant feed regenerates at least daily

The CMS SHALL regenerate the feed snapshot at least once per day via `GET /api/cron/merchant-feed` protected by `CRON_SECRET`, per **RI-008** (cron nocturno).

#### Scenario: Cron succeeds

- **WHEN** the nightly cron runs with valid authorization
- **THEN** a new XML snapshot is stored
- **AND** `analyticsSettings.lastFeedGeneratedAt` is updated

#### Scenario: Cron unauthorized

- **WHEN** the cron endpoint is called without valid `CRON_SECRET`
- **THEN** the response is HTTP 401 and no snapshot is mutated

### Requirement: Feed uses shared catalog image resolution

The feed generator SHALL resolve `image_link` using `@jeyjo/catalog-images` `resolveCatalogImage` with the same priority as storefront PLP/PDP, per **RF-024** preparation for GMC.

#### Scenario: Own image preferred over provider URL

- **WHEN** a product has both `ownImage` and `providerImageUrl`
- **THEN** `g:image_link` uses the own image absolute URL

### Requirement: Feed cron failure surfaces operational alert

When merchant feed regeneration fails on two consecutive scheduled runs, the CMS SHALL surface an alert compatible with the backoffice system alerts pattern.

#### Scenario: Repeated cron failure

- **WHEN** the merchant feed cron fails twice in a row
- **THEN** staff see a feed sync error alert on the KPI dashboard or alerts tray
