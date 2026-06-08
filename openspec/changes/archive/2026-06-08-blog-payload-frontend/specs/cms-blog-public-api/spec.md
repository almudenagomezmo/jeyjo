# CMS blog public API

## Purpose

Public read-only HTTP API on the CMS app for storefront blog consumption (change #33).

## ADDED Requirements

### Requirement: Public list endpoint returns visible posts only

The CMS SHALL expose `GET /api/blog/posts` returning paginated blog posts where `published` is true and `publishedAt` is less than or equal to the current server time. Draft and future-scheduled posts SHALL NOT appear.

#### Scenario: Published post appears in list

- **WHEN** a post has `published` true and `publishedAt` yesterday
- **THEN** `GET /api/blog/posts` includes that post in the results

#### Scenario: Scheduled future post excluded

- **WHEN** a post has `published` true and `publishedAt` tomorrow
- **THEN** `GET /api/blog/posts` does not include that post

#### Scenario: Draft post excluded

- **WHEN** a post has `published` false
- **THEN** `GET /api/blog/posts` does not include that post

### Requirement: List endpoint supports pagination and filters

`GET /api/blog/posts` SHALL accept query parameters `page` (default 1), `limit` (default 12, max 24), `category` (category slug), and `tag` (normalized tag string). Results SHALL be ordered by `publishedAt` descending.

#### Scenario: Category filter

- **WHEN** `GET /api/blog/posts?category=material-de-oficina` is called
- **THEN** only posts in that category are returned

#### Scenario: Pagination metadata

- **WHEN** more than `limit` visible posts exist
- **THEN** the response includes `totalDocs`, `page`, `totalPages`, and `hasNextPage`

### Requirement: List response uses storefront DTO shape

Each item in the list response SHALL include `slug`, `title`, `excerpt`, `publishedAt`, `authorName`, `tags`, `category` object with `slug` and `name`, and absolute `featuredImageUrl`.

#### Scenario: Excerpt fallback from content

- **WHEN** a post has no `excerpt` field
- **THEN** the list DTO includes a plain-text excerpt derived from body content truncated to approximately 160 characters

### Requirement: Public detail endpoint returns single post

The CMS SHALL expose `GET /api/blog/posts/[slug]` returning full post detail for visible posts only, including Lexical `content` JSON, `metaDescription`, and list-level metadata fields.

#### Scenario: Detail for published slug

- **WHEN** a visible post exists with slug `consejos-pedido-b2b`
- **THEN** `GET /api/blog/posts/consejos-pedido-b2b` returns HTTP 200 with title and content

#### Scenario: Unknown or hidden slug returns 404

- **WHEN** no visible post matches the slug
- **THEN** the endpoint returns HTTP 404

### Requirement: Public blog API sets cache headers

Successful responses from public blog endpoints SHALL include `Cache-Control: public, max-age=60, stale-while-revalidate=300`.

#### Scenario: List response cacheable

- **WHEN** `GET /api/blog/posts` succeeds
- **THEN** the response includes the cache control header
