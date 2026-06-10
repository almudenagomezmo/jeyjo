## 1. APIs de cuenta

- [x] 1.1 `requireCustomerApiSession` en `lib/auth/customer-api-guard.ts` (verify: 401 sin sesión, 403 cuenta desactivada)
- [x] 1.2 `GET /api/account/purchase-history` reutilizando `buildPurchaseHistoryPage` y `parsePurchaseHistoryFilters`
- [x] 1.3 `POST /api/account/purchase-history/repeat` reutilizando `repeatPurchaseHistoryItems`
- [x] 1.4 Refactor intranet routes para compartir parse/repeat helpers

## 2. UI personal

- [x] 2.1 Parametrizar `PurchaseHistoryPanel` (`title`, `subtitle`, `apiBase`)
- [x] 2.2 Sustituir tabla en `/cuenta/pedidos/page.tsx` por panel con props de cuenta personal
- [x] 2.3 Mantener enlaces de cabecera de pedido a `/cuenta/pedidos/[id]`

## 3. Verificación

- [x] 3.1 Tests `purchase-history-api.test.ts` siguen pasando tras refactor
- [x] 3.2 Actualizar specs OpenSpec y ROADMAP
