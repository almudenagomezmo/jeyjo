## 1. Order export package

- [x] 1.1 Create `packages/order-export` with `OrderExportInput` types, `buildAvansuiteOrderRows`, `validateAvansuiteRows`, `serializeAvansuiteXlsx` (verify: `pnpm --filter @jeyjo/order-export test` passes row mapping and validation errors)
- [x] 1.2 Add `docs/avansuite-order-import.md` documenting stub column schema and open question for Jeyjo template confirmation (verify: doc lists required columns matching tests)
- [x] 1.3 Wire workspace dependency in `apps/cms` (verify: `pnpm install` resolves `@jeyjo/order-export`)

## 2. Orders collection and hooks

- [x] 2.1 Add fields `stockValidationPending`, `exportedToErpAt`, `evaRejectionReason` to `Orders` override and regenerate types (verify: Payload admin shows new sidebar/fields on order doc)
- [x] 2.2 Implement `beforeChange` guard for allowed `jeyjoStatus` transitions (staff only; storefront API key exempt for create only) (verify: PATCH invalid transition returns 400)
- [x] 2.3 Extend `defaultColumns` / list metadata for OMS (order number, origin, jeyjoStatus, total) (verify: native orders list unchanged for administracion)

## 3. OMS API endpoints

- [x] 3.1 Implement `GET /api/orders/inbox-summary` with filters, customer label enrichment (Supabase `customers`), stock flag computation (verify: response includes `customerLabel` for seeded B2B order)
- [x] 3.2 Implement `POST /api/orders/export-avansuite` (max 50 ids, eligibility rules, sets `exportedToErpAt`) (verify: download `.xlsx` for confirmed order; 403 for catalogo role)
- [x] 3.3 Implement `POST /api/orders/eva/validate` and `POST /api/orders/eva/reject` (verify: EVA seed order moves out of pending queue on validate; cancelled on reject with audit log)
- [x] 3.4 Implement `POST /api/orders/recheck-stock` or stock logic inside inbox-summary (verify: order with qty > stub stock sets `stockValidationPending` true)
- [x] 3.5 Implement `PATCH /api/orders/:id/status` for staff status transitions (verify: `pending_confirmation` → `confirmed` succeeds)

## 4. Admin UI views

- [x] 4.1 Add `OmsInboxView` + SCSS (filters, table, status actions, export selected, stock badge) (verify: `/admin/oms` lists orders for administracion user)
- [x] 4.2 Add `EvaOrdersQueueView` with Revisar y Validar / Rechazar flows (verify: `/admin/oms/eva` shows only `origin=eva` && `validatedEva=false`)
- [x] 4.3 Register views and nav links under Pedidos group in `payload.config.ts`; restrict component access to administracion/superadmin (verify: catalogo user gets 403 on `/admin/oms` — CA-BACKEND-006)
- [x] 4.4 Add per-order "Exportar para Avansuite" action on order detail or inbox row (verify: CA-BACKEND-004 manual — file downloads for PED fixture)

## 5. Seed and tests

- [x] 5.1 Extend seed with EVA sample order (`origin=eva`, `validatedEva=false`, 3 lines) (verify: appears in EVA queue after seed)
- [x] 5.2 CMS int tests: export endpoint, EVA validate/reject, catalog role 403 on OMS routes (verify: `pnpm --filter cms test` passes new specs)
- [x] 5.3 Manual checklist staging: CA-BACKEND-003 (EVA validate flow), CA-BACKEND-004 (Excel reimport Avansuite test env if available)
- [x] 5.4 Run `pnpm --filter cms typecheck` and `openspec status --change oms-pedidos-web` shows all artifacts done
