## 1. Package `@jeyjo/erp-ports`

- [x] 1.1 Scaffold `packages/erp-ports` (package.json, tsconfig, `src/index.ts` exports)
- [x] 1.2 Define `ErpProductDto`, `ErpSupplierDto`, pagination types, and `ErpIntegrationError` with codes per spec
- [x] 1.3 Define ports: `ErpCatalogReader`, `ErpCatalogWriter`, `ErpDocumentsReader` (documents methods throw `ERP_NOT_IMPLEMENTED` in default export docs)
- [x] 1.4 Verify: `pnpm --filter @jeyjo/erp-ports exec tsc --noEmit` passes

## 2. Stub adapter

- [x] 2.1 Implement `packages/erp-ports/src/adapters/stub/catalog-reader.ts` with deterministic sample products/suppliers (align SKUs with seed where possible)
- [x] 2.2 Implement `packages/erp-ports/src/adapters/stub/catalog-writer.ts` with in-memory idempotent upserts
- [x] 2.3 Add test-only failure simulation flag for `ERP_UNAVAILABLE`
- [x] 2.4 Verify: Vitest in package covers list/get, upsert idempotency, and simulated outage (erp-stub-adapter spec scenarios)

## 3. Adapter registry (CMS)

- [x] 3.1 Create `apps/cms/src/erp/registry.ts` resolving reader/writer/documents from `ERP_ADAPTER`
- [x] 3.2 Register stub bundle; `excel` and `api` paths fail with clear `ERP_NOT_IMPLEMENTED` or config error (no silent fallback in production)
- [x] 3.3 Add `ERP_ADAPTER=stub` to `apps/cms/.env.example` with comment
- [x] 3.4 Verify: unit test asserts `stub` in development and unknown value throws

## 4. DTO mappers and sync service

- [x] 4.1 Add `apps/cms/src/erp/mappers/product.ts` and `supplier.ts` (`mapErpProductDtoToPayload`, supplier equivalent)
- [x] 4.2 Implement `ErpCatalogSyncService` using Payload API with `overrideAccess` and `req.context.erpSync = true`
- [x] 4.3 Set `syncErpAt` on successful product/supplier apply
- [x] 4.4 Verify: int test or script applies stub DTO to existing seed product; `syncErpAt` and ERP fields update (payload-catalog-collections MODIFIED scenario)

## 5. Payload hooks — ERP field guard

- [x] 5.1 Add `beforeChange` on Products (and Suppliers for ERP-sourced fields) blocking ERP field mutation unless `context.erpSync === true`
- [x] 5.2 Keep `erpReadOnlyFieldAccess` for admin UI; document dual layer in `erpFields.ts` comment
- [x] 5.3 Verify: staff save with edited `p1Price` in admin does not persist; sync service path does persist

## 6. CMS wiring and docs

- [x] 6.1 Add `@jeyjo/erp-ports` dependency to `apps/cms/package.json` and wire workspace protocol
- [x] 6.2 Export optional dev helper endpoint or script `sync-from-stub` (manual trigger only, no cron) for local verification
- [x] 6.3 Update `apps/cms/README.md` with ERP ports section and link to this change
- [x] 6.4 Verify: `pnpm --filter cms exec tsc --noEmit` and `pnpm --filter cms test` (or erp-specific vitest path) pass

## 7. Monorepo CI

- [x] 7.1 Ensure root `pnpm install` links `erp-ports`; add package to CI typecheck matrix if separate job exists
- [x] 7.2 Verify: `pnpm exec tsc --noEmit` at repo root (or documented filter set) passes
