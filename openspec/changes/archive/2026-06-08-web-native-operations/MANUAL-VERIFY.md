# Manual verify — web-native-operations

## Preconditions

- `WEB_NATIVE_MODE=true` (o `systemSettings.webNativeMode` activo en CMS)
- CMS y storefront en marcha con Supabase configurado

## Checklist

- [ ] Editar `p1Price` y `skuErp` en un producto desde Payload → valores persisten
- [ ] Editar **Stock disponible** → semáforo se actualiza al guardar
- [ ] Subir factura en **Documentos cliente** con PDF → aparece en `/intranet/contabilidad/facturas`
- [ ] Crear **Precio especial** para cliente B2B → visible en `/intranet/precios`
- [ ] Excel import: aplicar fila con precio nuevo → producto actualizado sin sync ERP
- [ ] `GET /api/cron/stock-sync` con CRON_SECRET → HTTP 410
- [ ] Export Avansuite en OMS → oculto / HTTP 410
