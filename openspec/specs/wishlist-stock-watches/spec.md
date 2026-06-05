# wishlist-stock-watches

## Purpose

Server-side wishlist stock watch persistence and storefront APIs (alcance §1.21, change #35).

## Requirements

### Requirement: Stock watches persist per web profile

The system SHALL store wishlist stock watches in Supabase table `stock_watches` with `web_profile_id`, `sku`, optional denormalized `product_title`, `last_indicator`, `last_notified_at`, and `created_at`, with a unique constraint on `(web_profile_id, sku)`.

#### Scenario: Authenticated user adds watch

- **WHEN** a signed-in user with `web_profile_id` P1 POSTs `{ sku: "REF-001", productTitle: "Bolígrafo" }` to `/api/wishlist`
- **THEN** a `stock_watches` row exists for P1 and REF-001
- **AND** `last_indicator` is initialized from the current product stock indicator when available

#### Scenario: Duplicate watch is idempotent

- **WHEN** the same profile POSTs the same SKU twice
- **THEN** at most one row exists for that profile and SKU

### Requirement: RLS restricts watches to owning profile

Authenticated users SHALL read, insert, and delete only their own `stock_watches` rows via Supabase RLS tied to `web_profiles.user_id = auth.uid()`. Server jobs SHALL update `last_indicator` and `last_notified_at` using the service role only.

#### Scenario: User cannot read another profile watches

- **WHEN** user A queries watches for user B profile id
- **THEN** zero rows are returned

### Requirement: Wishlist APIs for authenticated storefront

The storefront SHALL expose `GET`, `POST`, `DELETE /api/wishlist` and bulk `PUT /api/wishlist` for the session web profile. Unauthenticated requests SHALL return 401.

#### Scenario: GET returns profile watches

- **WHEN** an authenticated user requests `GET /api/wishlist`
- **THEN** the response includes `skus` array for that profile only

#### Scenario: DELETE removes watch

- **WHEN** the user calls `DELETE /api/wishlist?sku=REF-001`
- **THEN** the watch row for that profile and SKU is removed

### Requirement: Local wishlist merges on login

When an authenticated B2B-validated session hydrates, the storefront SHALL merge localStorage wishlist SKUs with server watches (union), persist the merged set to the server via `PUT /api/wishlist`, and update the local store to match the server result.

#### Scenario: Login merges local and server SKUs

- **WHEN** localStorage contains SKU A and the server has SKU B for the same profile
- **THEN** after merge both A and B exist on the server
- **AND** localStorage reflects the merged list
