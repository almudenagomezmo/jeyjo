## Why

El cambio **#55** (`purchase-history-order-groups`) entregó el histórico B2B en `/cuenta/empresa/pedidos` con filtros, pedidos colapsables y repetición al carrito, pero **`/cuenta/pedidos`** (sección personal) seguía mostrando una tabla estática sin filtros ni acción de repetir. Los clientes B2C y B2B que usan el área personal no podían reordenar artículos desde sus pedidos web, a pesar de que el panel y la lógica de backend ya existían.

## What Changes

- **`/cuenta/pedidos`** reutiliza `PurchaseHistoryPanel` con título **Mis pedidos**, mismos filtros, selección y repetición al carrito que el histórico B2B.
- **APIs de cuenta:** `GET /api/account/purchase-history` y `POST /api/account/purchase-history/repeat` con sesión de cliente activa (`requireCustomerApiSession`), sin guard B2B ni permisos de subusuario.
- **Panel parametrizable:** `PurchaseHistoryPanel` acepta `title`, `subtitle` y `apiBase` para compartir UI entre personal e intranet.
- **Detalle de pedido:** `/cuenta/pedidos/[id]` se mantiene como vista de detalle enlazada desde las cabeceras de pedido.

## Capabilities

### New Capabilities

_(ninguna)_

### Modified Capabilities

- `storefront-customer-account`: Mis pedidos deja de ser placeholder/tabla simple; expone histórico operativo con filtros y repetición al carrito.
- `storefront-b2b-purchase-history`: Documentar APIs de cuenta paralelas y reutilización del panel en área personal.

## Impact

- `apps/storefront/src/app/(account)/cuenta/pedidos/page.tsx`
- `apps/storefront/src/components/intranet/PurchaseHistoryPanel.tsx`
- `apps/storefront/src/app/api/account/purchase-history/**`
- `apps/storefront/src/lib/auth/customer-api-guard.ts`
- `apps/storefront/src/lib/intranet/purchase-history/{parse-filters,repeat-items}.ts`
- Tests existentes de purchase-history API siguen pasando.

## Non-Goals

- Duplicar lógica de agrupación o pricing; se reutiliza `buildPurchaseHistoryPage`.
- Restringir `/cuenta/pedidos` solo a pedidos web (B2B con ERP sigue viendo merge ERP+web, coherente con histórico).
- Cambiar permisos B2B del histórico en `/cuenta/empresa/pedidos`.
