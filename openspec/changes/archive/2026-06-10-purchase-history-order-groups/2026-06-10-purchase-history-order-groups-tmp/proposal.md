## Why

El histórico B2B (#23) mostraba líneas agregadas por SKU, sin contexto de pedido. Los administradores de empresa necesitan ver cada compra como un pedido/albarán con cabecera, expandir sus artículos, repetir el pedido completo o líneas sueltas, y distinguir el estado del pedido web — alineado con US-10 y la ruta unificada `/cuenta/empresa/pedidos` (#52).

## What Changes

- **Vista agrupada por pedido:** cada entrada del histórico es un pedido (web por `orderId`, ERP por fecha+departamento) con cabecera colapsable.
- **Cabecera de pedido:** número/enlace, estado, fecha (con hora en pedidos web), departamento, recuento de artículos.
- **Expandir/colapsar artículos** por pedido; selección y precios por línea dentro del pedido.
- **Repetir pedido completo** (`Añadir pedido al carrito`) además de selección multi-línea existente.
- **Filtro por estado de pedido** web en panel de filtros.
- **API:** `GET /api/intranet/purchase-history` devuelve `{ orders: [...] }` paginado por pedidos (no `lines` agregadas por SKU).
- **Fecha con hora** en pedidos web (`createdAt` ISO); ERP sigue solo fecha.

## Capabilities

### New Capabilities

_(ninguna — extensión del capability existente)_

### Modified Capabilities

- `storefront-b2b-purchase-history`: agrupación por pedido, UI colapsable, repetir pedido completo, filtro estado, paginación por pedidos, ruta `/cuenta/empresa/pedidos`, respuesta API `orders[]`.

## Impact

- `apps/storefront/src/lib/intranet/purchase-history/group-orders.ts` (nuevo)
- `apps/storefront/src/lib/intranet/purchase-history/service.ts`
- `apps/storefront/src/lib/orders/fetch-customer-orders.ts`
- `apps/storefront/src/components/intranet/PurchaseHistoryPanel.tsx`
- `apps/storefront/src/lib/utils/format.ts` (`formatOrderDateTime`)
- Tests: `purchase-history-group-orders.test.ts`, `purchase-history-api.test.ts`

## Non-Goals

- Cabeceras de albarán con PDF (#37)
- Filtro por categoría CMS en UI (API ya soporta `categoryId`; UI pendiente)
- Renombrar API `/api/intranet/*`
- Cambiar lógica de precios al repetir (sigue precio actual CA-B2B-004)
