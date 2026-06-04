## 1. Supabase server module

- [x] 1.1 Create `apps/cms/src/lib/supabase-server.ts` with service-role client using `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- [x] 1.2 Implement `enqueueSearchEvent({ entityType, entityId, action, payload })` inserting into `search_events` with status `pending`
- [x] 1.3 Implement `writeAuditLog({ actorId, entityType, entityId, action, metadata })` append-only insert into `audit_log`
- [x] 1.4 Add env vars to `apps/cms/.env.example` and document in `docs/local-development.md`
- [x] 1.5 Verify: unit or int test mocks Supabase client and asserts insert payloads match schema types from `packages/database-types`

## 2. Suppliers collection

- [x] 2.1 Create `apps/cms/src/collections/Suppliers/index.ts` with fields `name`, `erpCode`, `type`, `baseImageUrl`, admin group Catálogo
- [x] 2.2 Register `Suppliers` in `payload.config.ts` and run `pnpm --filter cms dev` to confirm table creation
- [x] 2.3 Verify: create supplier in admin UI and confirm row in Postgres `suppliers` table

## 3. Categories hierarchy

- [x] 3.1 Extend `apps/cms/src/collections/Categories.ts` with `parent` (self-relationship), `sortOrder`, `imageUrl`, unique slug validation
- [x] 3.2 Set admin labels in Spanish and group Catálogo; default columns `title`, `parent`, `slug`
- [x] 3.3 Verify: create parent + child category; duplicate slug rejected on save

## 4. Products collection (ERP + relations)

- [x] 4.1 Extend `ProductsCollection` with ERP tab fields (read-only access): `skuErp`, `mainWholesaleRef`, `oemRef`, `ean`, `shortDescription`, `p1Price`, `p2Price`, `vatRate`, `packUnit`, `isWildcard`, `allowOrderWithoutStock`, `syncErpAt`, stub `erpStock`
- [x] 4.2 Add `supplier` relationship to `suppliers`; wire categories sidebar as today
- [x] 4.3 Verify: ERP fields visible but not editable by staff; supplier relationship persists

## 5. Enrichment and dual image (RF-024 bootstrap)

- [x] 5.1 Add Marketing/SEO tab: `longDescription` (lexical), `metaDescription` (maxLength 160 + admin description counter), `keywords` array
- [x] 5.2 Add `providerImageUrl` text field and `ownImage` upload (relationTo media); document priority in field descriptions
- [x] 5.3 Implement `beforeValidate` hook: auto-generate slug from title when empty; validate unique slug across products
- [x] 5.4 Add helper or field hook `resolveDisplayImage` exported for API layer (ownImage > providerImageUrl > null)
- [x] 5.5 Verify US-16 CA1–CA2: enrichment tab separate from ERP; empty slug auto-fills; meta >160 chars blocked

## 6. Ecommerce plugin trim

- [x] 6.1 Update `plugins/index.ts`: remove mandatory `stripeAdapter`; set `payments.paymentMethods` to empty array when Stripe env missing
- [x] 6.2 Default new products to `enableVariants: false`; hide or deprioritize variant admin UI if configurable
- [x] 6.3 Confirm `s3Storage` uses `SUPABASE_BUCKET` default `catalog-media`
- [x] 6.4 Verify: `pnpm --filter cms dev` starts without Stripe keys; admin sidebar shows Catálogo / Pedidos / Contenido groups

## 7. Orders override

- [x] 7.1 Extend `ordersCollectionOverride` with `orderNumber`, `origin` (b2c|b2b|eva), Jeyjo `status`, `customerRef`, `validatedEva`, totals fields
- [x] 7.2 Add line item field `ivaRateSnapshot` on order items array
- [x] 7.3 Hook `beforeValidate` on create: generate unique `orderNumber` if absent
- [x] 7.4 Verify: create test order in admin with origin b2c; line item stores `ivaRateSnapshot`

## 8. Backoffice hooks

- [x] 8.1 Create shared hook factory `apps/cms/src/hooks/searchEventHooks.ts` for afterChange/afterDelete on products and categories
- [x] 8.2 Create `apps/cms/src/hooks/auditLogHooks.ts` for products, categories, suppliers, orders
- [x] 8.3 Wrap hook bodies in try/catch; log errors without failing Payload save
- [x] 8.4 Verify RF-009 prep: save product → row in `search_events`; create product → row in `audit_log` (query Supabase SQL or dashboard)

## 9. Access control and admin UX

- [x] 9.1 Apply `isAdmin` / admin-only access on suppliers collection and confirm business collections require staff login
- [x] 9.2 Set Spanish labels on key collection and field labels (products, categories, suppliers, orders)
- [x] 9.3 Verify: unauthenticated REST POST to `/api/products` returns 401/403

## 10. Seed and documentation

- [x] 10.1 Update seed endpoint (`src/endpoints/seed/`) with one supplier, two categories (nested), two products (ERP + enrichment + one with provider URL)
- [x] 10.2 Update `apps/cms/README.md`: Jeyjo collections, Stripe optional, template storefront deprecated, link to this change
- [x] 10.3 Document Payload schema push / migrate flow coexistence with Supabase migrations in `docs/local-development.md`
- [x] 10.4 Verify: run seed on fresh `supabase db reset` + cms dev; admin shows sample catalog; README mentions business collections

## 11. CI and types

- [x] 11.1 Regenerate `payload-types.ts` via Payload after collection changes (`pnpm --filter cms generate:types` or dev boot)
- [x] 11.2 Ensure cms build/typecheck passes in monorepo CI with documented env gate
- [x] 11.3 Verify: `pnpm --filter cms exec tsc --noEmit` and root lint pass
