## 1. Backend grouping

- [x] 1.1 Add `group-orders.ts` with `groupRawLinesIntoOrders`, `filterOrderGroups`, date-only filter for ISO datetimes
- [x] 1.2 Update `buildPurchaseHistoryPage` to return `orders[]` with enriched lines
- [x] 1.3 Pass full `createdAt` ISO for web orders in `fetch-customer-orders.ts`
- [x] 1.4 Tests: `purchase-history-group-orders.test.ts`, update `purchase-history-api.test.ts`

## 2. Storefront UI

- [x] 2.1 Refactor `PurchaseHistoryPanel` to order cards with collapsible headers
- [x] 2.2 Add order-level checkbox, **Añadir pedido al carrito**, and per-line selection
- [x] 2.3 Add order status filter and `formatOrderDateTime` for web orders
- [x] 2.4 Paginate by orders; update sticky multi-select bar

## 3. OpenSpec

- [x] 3.1 Sync delta spec to `openspec/specs/storefront-b2b-purchase-history/spec.md`
- [x] 3.2 Update `openspec/ROADMAP.md` entry
