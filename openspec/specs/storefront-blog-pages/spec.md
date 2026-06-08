# Storefront blog pages

## Purpose

Public blog index and article routes on the Jeyjo storefront integrated with the global shop shell (US-24 CA4, alcance §1.13, change #33).

## Requirements

### Requirement: Blog index renders at /blog

The storefront SHALL provide `/blog` within the `(shop)` layout showing a paginated grid of visible blog posts fetched from the CMS public blog API, with post title, featured image, category label, formatted publish date, excerpt, and link to `/blog/[slug]`.

#### Scenario: Visitor opens blog index

- **WHEN** at least one visible post exists in CMS
- **THEN** `GET /blog` returns HTTP 200 with a grid of post cards inside the global header and footer shell

#### Scenario: Empty blog shows friendly state

- **WHEN** no visible posts exist
- **THEN** `/blog` shows an empty state message without breaking the layout

### Requirement: Blog index supports category filter and pagination

The blog index SHALL support `?category={slug}` to filter by category and `?page={n}` for pagination, preserving filter in pagination links.

#### Scenario: Filter by category

- **WHEN** a visitor opens `/blog?category=material-de-oficina`
- **THEN** only posts in that category are displayed

#### Scenario: Page two navigation

- **WHEN** more posts exist than the page size
- **THEN** pagination controls link to `/blog?page=2` (and preserve category query when set)

### Requirement: Blog article renders at /blog/[slug]

The storefront SHALL provide `/blog/[slug]` for visible posts, rendering featured image, title, author byline, publish date, category link, Lexical body content via sanitized HTML, and breadcrumbs Home → Blog → article title.

#### Scenario: Visitor reads published article

- **WHEN** a visible post exists with slug `consejos-pedido-b2b`
- **THEN** `GET /blog/consejos-pedido-b2b` returns HTTP 200 with rendered article content

#### Scenario: Hidden or missing slug returns 404

- **WHEN** no visible post matches the slug
- **THEN** the storefront returns the styled 404 page within the global layout

### Requirement: Blog routes set SEO metadata

Blog index SHALL set title `Blog | Jeyjo`. Article routes SHALL set `<title>` to `{postTitle} | Jeyjo` and meta description from CMS `metaDescription` when present.

#### Scenario: Article meta description

- **WHEN** a post defines `metaDescription`
- **THEN** the article page includes that value in the description meta tag

### Requirement: Blog content uses shared Lexical rendering

Article body SHALL be rendered using the same Lexical-to-HTML sanitization pipeline as site pages, with prose typography tokens from the design system.

#### Scenario: Rich content displays safely

- **WHEN** post content includes H2 headings and links
- **THEN** the rendered article shows semantic headings and styled links without raw script injection

### Requirement: Blog pages use CMS fetch with revalidation

Storefront blog data fetching SHALL use cached server fetch against CMS public blog endpoints with revalidation interval of approximately 300 seconds.

#### Scenario: Server component fetches list

- **WHEN** the blog index server component renders
- **THEN** it retrieves posts from `GET /api/blog/posts` on the CMS base URL configured in environment variables
