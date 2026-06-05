## 1. Package `@jeyjo/erp-excel`

- [x] 1.1 Scaffold `packages/erp-excel` with `exceljs`, export `parseImportacionArticulos` and `serializeImportacionArticulos`
- [x] 1.2 Implement column header detection and row mapping per `docs/avansuite-catalog-import.md` stub
- [x] 1.3 Add wildcard SKU flagging (`ERP_WILDCARD_SKUS`) and EAN check-digit validation
- [x] 1.4 Add unit tests with fixture `ImportaciónArticulos_test.xlsx` (50 rows + `9000000001`; verify: `pnpm --filter @jeyjo/erp-excel test`)

## 2. Excel catalog adapter

- [x] 2.1 Implement `ExcelCatalogReader` (file path + in-memory DTO modes) in `packages/erp-excel` or `apps/cms/src/erp/adapters/excel`
- [x] 2.2 Implement `ExcelCatalogWriter` with accumulate + `flush()` buffer
- [x] 2.3 Wire `ERP_ADAPTER=excel` in `registry.ts` replacing `ERP_NOT_IMPLEMENTED`
- [x] 2.4 Add registry integration test (`pnpm test:int` erp-registry with `ERP_ADAPTER=excel`)

## 3. Storage and API routes

- [x] 3.1 Create private Supabase Storage bucket `erp-imports` (or document local dev fallback)
- [x] 3.2 `POST /api/erp/catalog-import/parse` — upload, persist, dry-run response
- [x] 3.3 `POST /api/erp/catalog-import/apply` — load by `importId`, sync via `ErpCatalogSyncService`, audit + `erp_sync_runs`
- [x] 3.4 `GET /api/erp/catalog-export` and template download route
- [x] 3.5 Enqueue `search_events` for updated SKUs post-apply (reuse #7 pattern)

## 4. Admin UI

- [x] 4.1 Create `CatalogImportView` at `/admin/catalog-import` (roles `superadmin` | `catalogo`)
- [x] 4.2 Register view in `payload.config.ts` admin nav under Catálogo
- [x] 4.3 UI: upload, error table, apply confirmation, export + template links (Payload admin styling, no hardcoded hex)

## 5. Documentation and verification

- [x] 5.1 Write `apps/cms/docs/avansuite-catalog-import.md` with column mapping and open questions
- [x] 5.2 Integration test: apply import → Payload `p1Price` updated; CA-BACKEND-002 wildcard absent from public read
- [x] 5.3 Update `apps/cms/README.md` with `ERP_ADAPTER=excel` env vars and manual verify steps
- [x] 5.4 Manual checklist: upload test file in staging, confirm audit_log `IMPORT_CATALOG_EXCEL` entry
