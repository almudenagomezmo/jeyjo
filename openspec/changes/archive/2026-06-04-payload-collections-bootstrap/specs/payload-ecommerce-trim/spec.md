## ADDED Requirements

### Requirement: Stripe payment adapter is optional

The ecommerce plugin configuration SHALL NOT require Stripe environment variables for CMS dev or CI build to succeed.

#### Scenario: CMS starts without Stripe keys

- **WHEN** `pnpm --filter cms dev` runs without `STRIPE_SECRET_KEY`
- **THEN** Payload admin starts and no payment adapter initialization throws

### Requirement: Product variants disabled for Jeyjo v1

New products SHALL default to `enableVariants: false` and variant types/options SHALL be hidden or de-emphasized in admin navigation for the bootstrap phase.

#### Scenario: Default product without variants

- **WHEN** a staff user creates a product without enabling variants
- **THEN** the product saves with single-SKU semantics suitable for ERP sync later

### Requirement: Media uploads use catalog-media bucket

When Supabase storage is configured, product and media uploads SHALL target the `catalog-media` bucket (or env override `SUPABASE_BUCKET`) per storage-buckets-core spec.

#### Scenario: Own image upload to Supabase

- **WHEN** a staff user uploads an own product image with Supabase storage env configured
- **THEN** the file is stored under the catalog media bucket prefix documented in cms docs

### Requirement: Admin navigation grouped for Jeyjo operations

The Payload admin SHALL group collections into at least Catálogo (products, categories, suppliers), Pedidos (orders), and Contenido (pages, media, forms) via collection `admin.group` settings.

#### Scenario: Catalog staff finds products

- **WHEN** a staff user opens the admin sidebar
- **THEN** products, categories, and suppliers appear under a Catálogo group label
