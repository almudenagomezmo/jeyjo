## ADDED Requirements

### Requirement: Category snapshot file format

The storefront SHALL maintain a versioned JSON snapshot at `apps/storefront/data/category-tree.snapshot.json` containing `syncedAt` (ISO-8601), `source` (CMS base URL used at sync time), and `docs` as a flat array of category documents with at minimum `id`, `title`, `slug`, `parent`, `sortOrder`, and optional `homeGlyph`.

#### Scenario: Snapshot documents sync metadata

- **WHEN** the sync script completes successfully
- **THEN** the snapshot file includes a non-empty `syncedAt` timestamp and the CMS URL in `source`

#### Scenario: Snapshot docs match CMS flat export

- **WHEN** the sync script runs against a CMS with published categories
- **THEN** each entry in `docs` includes a non-empty `slug` and valid `parent` reference or null for roots

### Requirement: Category sync script

The monorepo SHALL expose `pnpm sync:categories` (storefront filter) that fetches all categories from Payload REST (`GET /api/categories?depth=0&limit=500&sort=sortOrder`) using `CMS_URL` or `CMS_INTERNAL_URL` and writes the snapshot file.

#### Scenario: Sync succeeds with CMS available

- **WHEN** an operator runs `pnpm sync:categories` with a reachable CMS containing categories
- **THEN** the snapshot file is updated on disk and the process exits with code 0

#### Scenario: Sync fails when CMS returns no categories

- **WHEN** the sync script runs and CMS returns zero category documents
- **THEN** the process exits with a non-zero code and does not overwrite the snapshot with an empty `docs` array

### Requirement: Runtime category resolution order

The storefront server SHALL resolve category documents in this order: (1) live CMS fetch with a bounded timeout, (2) versioned snapshot file, (3) empty list with a server-side warning. It SHALL NOT use the legacy static `CATEGORIES` TypeScript array as a runtime taxonomy source.

#### Scenario: Live CMS preferred

- **WHEN** the CMS categories API returns at least one document within the configured timeout
- **THEN** `getNavigationTree` builds the tree from live CMS data

#### Scenario: Snapshot used when CMS unavailable

- **WHEN** the live CMS fetch fails or returns zero documents and the snapshot file contains at least one document
- **THEN** `getNavigationTree` builds the tree from snapshot `docs`

#### Scenario: Empty tree when both sources fail

- **WHEN** live CMS and snapshot both yield zero resolvable documents
- **THEN** `getNavigationTree` returns an empty array and logs a warning without throwing HTTP 500 on public pages

### Requirement: Empty CMS responses are not cached as hits

The storefront SHALL NOT store an empty live CMS categories response in `unstable_cache` as a cache hit that suppresses subsequent live or snapshot resolution within the revalidation window.

#### Scenario: CMS empty on first request then populated

- **WHEN** the first live CMS fetch returns zero documents and a later fetch within the same process would return categories
- **THEN** the storefront does not serve a frozen empty tree solely because of a cached empty CMS response
