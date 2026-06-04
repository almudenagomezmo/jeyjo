## 1. Supabase pricing schema

- [x] 1.1 Add migration `special_prices` and `group_offers` with `numeric(12,6)`, validity columns, and CHECK constraints (pricing-data-schema)
- [x] 1.2 Add seed/fixture SQL for REF-001..004 and CA-PRECIOS customers (empresa@test.com, empresa2@test.com)
- [x] 1.3 Verify: `supabase db reset` (local) then query fixtures returns expected rows for REF-003 offer and REF-004 special price

## 2. Package `@jeyjo/pricing`

- [x] 2.1 Scaffold `packages/pricing` (package.json, tsconfig, exports `resolvePrice`, types `PricingInput`, `PriceQuote`)
- [x] 2.2 Implement strategy chain: special → group offer → B2B discount → P1 retail with non-accumulation guard
- [x] 2.3 Add decimal rounding helper (2 dp HALF_UP) and VAT gross derivation
- [x] 2.4 Define `PricingRepository` interface; implement pure in-memory repo for unit tests
- [x] 2.5 Verify: `pnpm --filter @jeyjo/pricing test` passes CA-PRECIOS-001..004 fixtures; `test:coverage` ≥80%

## 3. ERP pricing read port

- [x] 3.1 Add `ErpSpecialPriceDto`, `ErpGroupOfferDto`, and `ErpPricingReader` to `packages/erp-ports`
- [x] 3.2 Implement stub `pricing-reader.ts` with REF-001..004 dataset
- [x] 3.3 Expose `pricingReader` from `getErpAdapters()` in CMS registry
- [x] 3.4 Verify: Vitest covers stub list methods and registry exposes `pricingReader` when `ERP_ADAPTER=stub`

## 4. Supabase + Payload repositories

- [x] 4.1 Implement `SupabasePricingRepository` in CMS (and/or shared package) for customers, special prices, offers
- [x] 4.2 Implement `PayloadProductPriceSource` reading P1/P2/vat by `skuErp` with per-request cache
- [x] 4.3 Wire composite repository used by pricing engine in CMS context
- [x] 4.4 Verify: integration test resolves REF-002 to 9.00 net for B2B fixture customer against local DB

## 5. Order IVA snapshot (CMS)

- [x] 5.1 Add `beforeChange` hook on orders when status → confirmed: set `ivaRateSnapshot` from linked product VAT
- [x] 5.2 Reject confirmation if any line product lacks VAT rate (order-iva-snapshot spec)
- [x] 5.3 Verify: int test confirms draft line may omit snapshot; confirmed line keeps snapshot after product VAT change

## 6. Storefront price resolution

- [x] 6.1 Add `POST` Route Handler (or Server Action) calling `@jeyjo/pricing` with Supabase session → customer context
- [x] 6.2 Update `apps/storefront/src/lib/utils/price.ts` to accept `PriceQuote`; keep jeyjo-next-compatible exports
- [x] 6.3 Connect `PriceModeToggle` / header label to B2C vs B2B segment (RF-011, CA-PRECIOS-001)
- [x] 6.4 Add `PRICING_ENGINE_ENABLED` to `.env.example`; document fallback behavior
- [x] 6.5 Verify: `pnpm --filter storefront exec tsc --noEmit`; manual/API test anonymous REF-001 returns P1 rule; response omits P2

## 7. Monorepo wiring and docs

- [x] 7.1 Add `@jeyjo/pricing` to `apps/storefront` and `apps/cms` package.json workspace deps
- [x] 7.2 Update `apps/cms/README.md` and `apps/storefront` docs with pricing engine section
- [x] 7.3 Ensure CI runs pricing package tests and typecheck
- [x] 7.4 Verify: `pnpm exec tsc --noEmit` (or project filter set) passes at repo root

## 8. Acceptance traceability

- [x] 8.1 Map unit tests to CA-PRECIOS-001..004 in test descriptions or README table
- [x] 8.2 Run staging smoke: 100 single-SKU pricing requests; record p95 &lt;200 ms (RNF-003) or file Open Question if Payload latency blocks
- [x] 8.3 Verify: checklist in `06-criterios-aceptacion-jeyjo.md` CA-PRECIOS-001..004 marked ready for QA sign-off after deploy
