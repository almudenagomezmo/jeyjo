## 1. System mode flag

- [x] 1.1 Add `webNativeMode` boolean to `systemSettings` global with default `true` and env fallback `WEB_NATIVE_MODE`
- [x] 1.2 Expose `webNativeMode` in `GET /api/system/config` JSON for storefront/CMS consumers
- [x] 1.3 Add helper `isWebNativeMode()` shared in CMS (reads global with env fallback)
- [x] 1.4 Suppress ERP staleness dashboard/public banners when `isWebNativeMode()` is true
- [x] 1.5 Int test: config API returns `webNativeMode`; staleness banner logic off in web-native mode

## 2. Web-native catalog (commercial fields)

- [x] 2.1 Add conditional field access: commercial fields editable when `webNativeMode`, read-only when false (reuse `erpReadOnlyFieldAccess` pattern inverted)
- [x] 2.2 Update `erpProductBeforeChange` / supplier hooks to skip strip when `webNativeMode`
- [x] 2.3 Rename admin tab to **Datos comerciales** and `skuErp` label to **Referencia / SKU** when web-native
- [x] 2.4 Int test: staff can save `p1Price`/`skuErp` with `webNativeMode` true; blocked when false
- [x] 2.5 Update `catalog-import apply` to write Payload directly without `erpSync` when web-native
- [x] 2.6 Int test: Excel import apply updates prices without invoking `ErpCatalogSyncOrchestrator`

## 3. Manual stock

- [x] 3.1 Make `erpStock` editable (label **Stock disponible**) when `webNativeMode`; hide/disable multisource stock fields in admin
- [x] 3.2 Update `guardStockProductFields` to allow manual `erpStock` edits when web-native
- [x] 3.3 Add `afterChange` hook to recalculate `stockIndicator` from manual `erpStock` + `stockLowThreshold`
- [x] 3.4 Return HTTP 410 from cron/manual stock sync routes when web-native
- [x] 3.5 Int test: manual stock save updates indicator; cron stock sync returns 410 in web-native mode
- [x] 3.6 Update storefront `getStockIndicator` to not mark `isStale` from ERP sync age when web-native

## 4. Disable ERP sync and Avansuite export

- [x] 4.1 Return HTTP 410 from catalog ERP sync endpoints/cron when web-native
- [x] 4.2 Hide/disable manual ERP sync buttons in CMS admin when web-native
- [x] 4.3 Return HTTP 410 from `POST /export-avansuite`; hide export UI in OMS when web-native
- [x] 4.4 Skip `ErpPricingSyncService` triggers when web-native
- [x] 4.5 Int test: sync and export endpoints return 410 with web-native flag

## 5. Customer documents collection

- [x] 5.1 Create Payload `customerDocuments` collection (types, access RF-030, admin group)
- [x] 5.2 Implement PDF upload to `private-documents/{customerId}/` on create/update (Supabase Storage)
- [x] 5.3 Add validation: unique `documentNumber` per `customerId`; required fields per `documentType`
- [x] 5.4 Hook `invoice_new` notification on new invoice documents (#28 flow)
- [x] 5.5 Int test: create invoice document stores PDF path; duplicate number rejected

## 6. B2B pricing admin collections

- [x] 6.1 Create Payload `specialPrices` collection with Supabase mirror hooks to `special_prices`
- [x] 6.2 Create Payload `groupOffers` collection with mirror hooks to `group_offers`
- [x] 6.3 Validate `productSku` exists in catalog on save (superadmin override optional)
- [x] 6.4 Configure staff roles: `administracion`/`superadmin` write; `catalogo` denied
- [x] 6.5 Int test: CRUD special price mirrors Supabase; cart `resolvePrice` uses mirrored row

## 7. Storefront intranet data sources

- [x] 7.1 Refactor `documents-service.ts` to list/download from `customerDocuments` + Storage when web-native
- [x] 7.2 Refactor `custom-tariffs/service.ts` to read Supabase `special_prices`/`group_offers` instead of stub ERP reader
- [x] 7.3 Keep cross-customer isolation tests (CA-B2B-002) passing with CMS document ids
- [x] 7.4 Int test: intranet invoices API returns staff-uploaded document; tariffs API returns CMS-mirrored price

## 8. Seed, docs, and verification

- [x] 8.1 Optional: seed sample `customerDocuments` and pricing rows for `empresa@test.com` when web-native
- [x] 8.2 Update `apps/cms/.env.example` and README with `WEB_NATIVE_MODE` and disabled sync crons note
- [x] 8.3 Add MANUAL-VERIFY checklist: edit product price, set stock, upload invoice PDF, create special price, Excel import row
- [x] 8.4 Update `openspec/ROADMAP.md` entry for `web-native-operations` and note #36 frozen until ERP phase
