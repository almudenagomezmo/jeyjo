## 1. Config and shared embedding

- [x] 1.1 Add `QDRANT_URL` and `QDRANT_API_KEY` to `apps/storefront/.env.example` and document in README (verify: vars listed next to `CMS_URL`)
- [x] 1.2 Create `packages/search-embedding` (or equivalent) with `embedQueryText` using `Xenova/multilingual-e5-small` and 384-dim output; wire CMS indexer to import it (verify: `pnpm typecheck` passes monorepo-wide)
- [x] 1.3 Add `@qdrant/js-client-rest` to storefront and thin `src/lib/qdrant/client.ts` mirroring CMS Cosine search (verify: unit test mocks `searchPoints` call shape)

## 2. Server suggest API

- [x] 2.1 Implement `POST /api/search/suggest` with validation (q ≥ 3 chars), embed, Qdrant search on `products` (limit 10) and `categories` (limit 4), phase timing logs (verify: `curl -X POST localhost:3000/api/search/suggest -d '{"q":"boli"}'` returns JSON with `products` array)
- [x] 2.2 Implement hydration: map Qdrant ids → `fetchPublicProductsBySkus`, filter wildcard/unpublished, preserve score order (verify: int test omits wildcard SKU)
- [x] 2.3 Attach batch pricing to suggest response via existing pricing API (verify: response includes price fields for B2C dual display)
- [x] 2.4 Add LRU/cache for query embeddings (TTL 60s) and 503 when Qdrant down in production (verify: test returns 503 when client throws)

## 3. Vector-backed full search

- [x] 3.1 Implement `vectorSearchProductSkus(q, { limit })` shared by suggest and PLP (verify: unit test returns ordered sku list from mocked Qdrant)
- [x] 3.2 Refactor `searchPublicProducts` / `loadPlpPageFromSearch` to use vector candidates then existing facet pipeline (verify: `/search?q=boligrafo` shows grid in dev with indexed Qdrant data)
- [x] 3.3 Gate demo `lib/utils/search.ts` behind `PLP_DEMO_FALLBACK` only; remove silent demo in production suggest path (verify: production build without flag does not import `lib/data/products` in suggest route)

## 4. SearchBar UI (tokens first)

- [x] 4.1 Review `globals.css` for search dropdown tokens; add only if missing (shadow, z-index) without new hex (verify: no raw `#` in new component classes)
- [x] 4.2 Add `usePredictiveSearch` hook with debounce 250ms and `AbortController` (verify: Vitest aborts stale fetch)
- [x] 4.3 Refactor `SearchBar.tsx`: min 3 chars, `SearchSuggestPanel` sections, US-01 empty copy, keyboard/ARIA combobox (verify: manual — ArrowDown moves active option)
- [x] 4.4 Wire dual price display and category chips; keep Enter → `/search?q=` and "Ver todos" CTA (verify: CA-SEARCH-001 visual check in browser)

## 5. Feature flag and ops

- [x] 5.1 Add `PREDICTIVE_SEARCH_ENABLED` default true; when false, fall back to CMS text search for `/search` only (verify: flag false restores previous `searchPublicProducts` behavior)
- [x] 5.2 Document staging warm-up and latency check script in change notes or `apps/storefront/README` (verify: 10 sequential suggests logged under 150ms p95 on staging)

## 6. Verification (RF-009 / CA-SEARCH)

- [x] 6.1 Vitest: suggest route validation, wildcard filter, EAN query mock (verify: `pnpm --filter @jeyjo/storefront test`)
- [x] 6.2 Staging smoke: query "boligrafo vic" returns BIC pen in dropdown &lt;150ms after warm (verify: **CA-SEARCH-002**)
- [x] 6.3 Staging smoke: EAN full string returns REF product first (verify: **CA-SEARCH-003**)
- [x] 6.4 Run `pnpm typecheck` and `pnpm lint` for storefront (verify: CI clean)
