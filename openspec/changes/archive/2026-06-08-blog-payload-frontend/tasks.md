## 1. Payload blog categories collection

- [x] 1.1 Create `BlogCategories` collection with name, slug, optional description, admin group "Blog" (verify: category visible in Payload admin)
- [x] 1.2 Register staff access for `superadmin`, `personalizacion`, `marketing` in `staffRoles.ts`; wire audit hooks
- [x] 1.3 Add beforeDelete guard blocking delete when posts reference category (verify: delete with dependents fails)

## 2. Payload blog posts collection

- [x] 2.1 Create `BlogPosts` collection with fields per design (title, slug, category, tags, featuredImage, excerpt, content Lexical, authorName, metaDescription, published, publishedAt)
- [x] 2.2 Add hooks: tag normalization, default `publishedAt` on publish, featuredImage required when published, slug uniqueness (verify: draft saves without image; published without image rejected)
- [x] 2.3 Register staff access and audit hooks; register both collections in `payload.config.ts` and run migration + `pnpm --filter cms generate:types`

## 3. CMS public blog API

- [x] 3.1 Create `lib/blog/map-post-dto.ts` with excerpt fallback, absolute featured image URL, visibility helper (`published && publishedAt <= now`)
- [x] 3.2 Implement `GET /api/blog/posts` with pagination, category/tag filters, cache headers (verify: curl list excludes draft and future posts)
- [x] 3.3 Implement `GET /api/blog/posts/[slug]` detail endpoint with 404 for hidden slugs (verify: curl returns Lexical content JSON)
- [x] 3.4 CMS integration tests: list filters, scheduled exclusion, DTO shape

## 4. CMS seed

- [x] 4.1 Add `endpoints/seed/blog-posts.ts` with 2 categories and 3 posts (published, draft, scheduled +7d) (verify: seed script runs in dev)
- [x] 4.2 Document seed invocation in `apps/cms/docs/seed.md` if not already wired

## 5. Storefront blog service layer

- [x] 5.1 Create `lib/blog/types.ts`, `fetch-posts.ts`, `fetch-post.ts` mirroring `fetch-site-page` pattern with `unstable_cache` revalidate 300
- [x] 5.2 Unit tests: map CMS JSON to view models, pagination params, category query string

## 6. Storefront blog UI

- [x] 6.1 Create `/blog` index page in `(shop)` — grid cards, category filter via search param, pagination, empty state (verify: uses globals.css tokens only)
- [x] 6.2 Create `/blog/[slug]` article page — hero image, byline, breadcrumbs, `SitePageContent` body, SEO metadata (verify: H2/H3 render in prose)
- [x] 6.3 Add `generateMetadata` for index and article routes (verify: title pattern `{postTitle} | Jeyjo`)

## 7. Verification

- [x] 7.1 Run CMS and storefront tests for blog module (`pnpm --filter cms test`, `pnpm --filter storefront test`)
- [x] 7.2 Manual US-24 checklist: staff creates post with rich text → visible on `/blog` → footer link works after enabling `blogEnabled` in footer settings
- [x] 7.3 Manual: scheduled post with future `publishedAt` absent from list until date passes
