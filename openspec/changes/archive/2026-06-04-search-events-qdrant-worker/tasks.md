## 1. Dependencies and Qdrant collections

- [x] 1.1 Add `@xenova/transformers` to `apps/cms` and document model download in `apps/cms/docs/qdrant.md` (verify: `pnpm --filter @jeyjo/cms install` succeeds)
- [x] 1.2 Add `categories` entry to `qdrant-collections.ts` (vectorSize 384) and confirm `onInit` creates it (verify: `curl localhost:6333/collections` lists `categories`)

## 2. Embedding and indexer core

- [x] 2.1 Implement `src/search-indexer/embedding.ts` with lazy singleton and 384-dim output (verify: unit test vector length === 384)
- [x] 2.2 Implement `buildIndexText` / Qdrant payload mappers for `producto` and `categoria` (verify: unit test includes skuErp + ean in index string)
- [x] 2.3 Implement `claimSearchEvents`, `completeSearchEvent`, `failSearchEvent`, and stale `processing` reset in `supabase-server` or dedicated module (verify: int test claims only pending rows)
- [x] 2.4 Implement `runSearchIndexerBatch()` with upsert/delete, wildcard skip, and unpublished delete (verify: int test wildcard product does not upsert point)

## 3. Payload integration

- [x] 3.1 Extend `buildSearchPayload` in `searchEventHooks.ts` with `skuErp`, `mainWholesaleRef`, `oemRef`, `ean`, `isWildcard`, `_status` (verify: `supabase-server.int.spec` payload shape)
- [x] 3.2 Load full product/category from Payload when hook payload lacks ERP fields (verify: int test after simulated minimal enqueue)

## 4. Cron, manual trigger, and ops

- [x] 4.1 Add `GET /api/cron/search-indexer` with `CRON_SECRET` and `maxDuration` 120 (verify: 401 without secret, 200 with secret)
- [x] 4.2 Add `POST /next/process-search-events` for admin in non-production (verify: manual route returns batch summary)
- [x] 4.3 Register cron `* * * * *` in `vercel.json` and document in `apps/cms/.env.example` + README (verify: file contains path `/api/cron/search-indexer`)

## 5. Integration verification (RF-009 / CA-SEARCH)

- [x] 5.1 Add CMS int test: enqueue product event → run worker → Qdrant point exists with expected payload (verify: `pnpm --filter @jeyjo/cms test:int` search-indexer)
- [x] 5.2 Add int test: delete event removes Qdrant point; Qdrant down marks `error` with message (verify: mock or skip if Qdrant absent in CI with env guard)
- [x] 5.3 Run `pnpm typecheck` and manual smoke: edit product in admin → within 60s point searchable via `searchPoints` in local script (verify: CA-SEARCH-002 prep — index lag &lt; 60s)
