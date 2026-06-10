## Context

- Cambio base #23 (`purchase-history-repeat`) entregó listado plano agregado por SKU en `/intranet/pedidos`.
- #52 (`cuenta-empresa-b2b-merge`) movió la ruta a `/cuenta/empresa/pedidos`; APIs `/api/intranet/*` sin renombrar.
- Fuentes: líneas web desde snapshots de pedidos Payload (`includeLineSnapshots`); líneas ERP desde stub sin `orderId`.

## Goals

1. Agrupar líneas crudas en pedidos ordenados por fecha descendente.
2. Mantener filtros existentes (fecha, referencia, departamento) y añadir filtro por `jeyjoStatus`.
3. Preservar repetir al carrito con precio actual; soportar pedido completo e ítems individuales.
4. Paginar por pedidos (pageSize 25).

## Decisions

### 1. Clave de agrupación

- **Web:** `web-{orderId}` — todas las líneas del mismo pedido comparten cabecera.
- **ERP:** `erp-{purchasedAt}-{department}` — pseudo-pedido por día y sede cuando no hay `orderId`.

### 2. API response shape

```json
{
  "orders": [{
    "orderKey": "web-42",
    "orderId": 42,
    "orderNumber": "JW-0042",
    "orderStatus": "confirmed",
    "purchasedAt": "2026-06-10T14:30:00.000Z",
    "department": null,
    "lines": [{ "sku", "qty", "historicalUnitPrice", "name", "canRepeat", "currentQuote", ... }]
  }],
  "total": 12,
  "page": 1,
  "pageSize": 25,
  "departments": ["Sede central"]
}
```

**BREAKING** para consumidores que esperaban `lines` a nivel raíz; solo afecta al panel B2B interno.

### 3. Cantidad por línea

Dentro de un pedido, `qty` es la cantidad de esa compra (no “cantidad habitual” agregada cross-pedido).

### 4. Filtros de fecha con datetime

Comparación `from`/`to` usa solo la parte de fecha (`slice(0, 10)`) aunque `purchasedAt` almacene ISO completo en pedidos web.

### 5. UI

- Tarjeta por pedido: cabecera siempre visible; tabla/cards de líneas al expandir (colapsado por defecto).
- Checkbox en cabecera selecciona todas las líneas repetibles del pedido.
- Botón **Añadir pedido al carrito** en cabecera.
- Selección global con clave `{orderKey}::{sku}` para evitar colisiones entre pedidos.

### 6. Formato de fecha

`formatOrderDateTime`: fecha+hora `es-ES` si ISO incluye `T`; solo fecha para ERP.

## Risks

- **ERP sin hora:** cabeceras ERP muestran solo fecha — aceptado.
- **Mismo SKU en varios pedidos:** repetir usa qty del pedido origen, no media histórica.

## Rollback

Revertir `group-orders.ts` y restaurar merge por SKU en `service.ts`; panel vuelve a tabla plana.
