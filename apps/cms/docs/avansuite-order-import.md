# Importación de pedidos web en Avansuite (stub RI-002)

Exportación generada por OMS (`@jeyjo/order-export`) hasta confirmar la plantilla oficial con el equipo de Jeyjo / Avansuite.

## Columnas del Excel (hoja por pedido)

| Columna | Campo interno | Obligatorio | Descripción |
|---------|---------------|-------------|-------------|
| NumPedidoWeb | `webOrderNumber` | Sí | Número de pedido Jeyjo (`orderNumber`) |
| FechaPedido | `orderDate` | Sí | Fecha ISO `YYYY-MM-DD` |
| CodigoClienteERP | `customerErpCode` | Sí* | Código cliente en Avansuite (`customers.erp_code`) |
| CIFCliente | `customerTaxId` | Sí* | CIF/NIF (`customers.tax_id`) |
| ReferenciaERP | `skuErp` | Sí | Referencia artículo ERP |
| Cantidad | `quantity` | Sí | Entero > 0 |
| PrecioUnitario | `unitPrice` | Sí | Precio unitario en el pedido |
| DescuentoLinea | `lineDiscount` | No | Por defecto `0` |

\* Al menos uno de `CodigoClienteERP` o `CIFCliente` debe estar presente.

## Origen de datos

- Líneas: `orderLineSnapshots` del pedido Payload (checkout); si vacío, no exportable.
- Cliente: lookup Supabase `customers` por `customerRef`, o email invitado sin export si falta CIF/código ERP.

## Open questions (Jeyjo)

1. Nombre exacto del fichero/plantilla Avansuite para crear albaranes desde pedido web.
2. ¿Columnas adicionales (serie, almacén, forma de pago ERP)?
3. ¿Un pedido = un fichero o libro multi-hoja (implementado: una hoja por pedido, máx. 50 en exportación masiva)?

## Verificación manual (staging)

- **CA-BACKEND-004**: Exportar pedido confirmado → importar en Avansuite test → albarán sin errores de formato.
- **CA-BACKEND-003**: Validar pedido EVA en `/admin/oms/eva` antes de exportar.
