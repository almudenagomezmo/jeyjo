# Manual verify — purchase-history-order-groups

## Preconditions

- Cliente B2B validado (`empresa@test.com` o equivalente)
- Pedidos web confirmados con líneas en Payload + histórico ERP stub si aplica

## Checklist

- [ ] `/cuenta/empresa/pedidos` muestra pedidos agrupados (no tabla plana por SKU)
- [ ] Cabecera: número de pedido, estado, fecha con hora (web), recuento de artículos
- [ ] Expandir/colapsar artículos por pedido
- [ ] **Añadir pedido al carrito** añade todas las líneas repetibles del pedido
- [ ] Checkbox de cabecera selecciona todas las líneas repetibles
- [ ] Selección individual + barra sticky **Añadir al carrito** sigue funcionando
- [ ] Filtro por estado de pedido reduce resultados
- [ ] Paginación muestra "X pedidos" (no líneas)
- [ ] Precio **Precio actual** en líneas; histórico tachado si difiere
