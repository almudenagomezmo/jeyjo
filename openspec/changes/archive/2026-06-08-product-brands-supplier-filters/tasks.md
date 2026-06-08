## 1. CMS brands collection

- [x] 1.1 Add `Brands` collection (`name`, optional unique `slug`) under Catálogo with staff access and audit hooks (verify: `/admin/collections/brands` loads)
- [x] 1.2 Add optional `brand` relationship on `products` sidebar; update `defaultPopulate` and `defaultColumns` to include `brand` + `supplier` (verify: admin save persists both)
- [x] 1.3 Register `brands` in `payload.config`, staff collection visibility, and search event hooks if products/categories pattern applies (verify: collection in admin nav)
- [x] 1.4 Generate and apply Payload migration for `brands` table and `products.brand_id` FK (verify: `pnpm --filter cms payload migrate` succeeds)

## 2. Seed and demo data

- [x] 2.1 Split `JEYJO_SUPPLIERS` into `JEYJO_BRANDS` (manufacturers) and logistics-only `JEYJO_SUPPLIERS` (verify: seed creates both collections)
- [x] 2.2 Update product seed to set `brand` and `supplier` independently (e.g. BIC + Distrisantiago) (verify: sample product has both relations in CMS)
- [x] 2.3 Update `apps/cms/docs/seed.md` and README supplier table to document brands vs suppliers (verify: docs mention separate entities)

## 3. Storefront catalog mapping

- [x] 3.1 Extend `CmsProductListDoc` / `PlpProductRow` with `brand: string | null` and `supplier: string | null`; map from `doc.brand` and `doc.supplier` in `mapDocToRow` (verify: unit test — brand not derived from supplier)
- [x] 3.2 Update `mapPdpDocToView` and `PdpProductView` with separate brand/supplier; specs rows "Marca" and "Proveedor" (verify: `fetch-product-pdp.test.ts` passes)
- [x] 3.3 Update `plpRowToProduct`, cart-products, and related mappers to use `brand` only in customer-facing strings (verify: typecheck passes)

## 4. PLP supplier filter

- [x] 4.1 Extend `PlpActiveFilters`, `apply-filters`, `facet-aggregates`, `filters-utils` with `suppliers` dimension (verify: unit test — brand + supplier intersection)
- [x] 4.2 Extend `plp-search-params` parse/serialize for `?supplier=` (verify: round-trip `?brand=BIC&supplier=Distrisantiago`)
- [x] 4.3 Add "Proveedor" facet group in `FacetSidebar`; keep "Marca / fabricante" on `brands` (verify: manual — both filters narrow grid)
- [x] 4.4 Update PDP page header to show brand only; specs table shows both (verify: `/p/{slug}` renders correctly)

## 5. Merchant feed and tests

- [x] 5.1 Update `resolveBrand` in merchant feed to read `doc.brand` relationship, omit when unset (verify: feed XML has `g:brand` only when brand assigned)
- [x] 5.2 Update storefront tests: `facet-aggregates`, `plp-search-params`, `fetch-product-pdp`, `load-pdp-page` for new shape (verify: `pnpm --filter storefront test` passes)
- [x] 5.3 Run `pnpm --filter storefront typecheck` and `pnpm --filter cms typecheck` (verify: no errors)
- [x] 5.4 Manual RF-010: select brand BIC + supplier Distrisantiago — intersection shown; URL share preserves both filters
