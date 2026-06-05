## Why

La tienda ya permite marcar productos en wishlist (corazón en PLP/PDP) pero la lista vive solo en **localStorage** (`jeyjo-wishlist`); no hay persistencia server-side ni avisos cuando el stock pasa a disponible. El portal B2B expone la sección **Avisos de stock** en `/intranet/stock` como scaffold y el alcance §1.21 exige que el cliente reciba notificación al entrar en stock un artículo seguido. **RF-022** (especificaciones §10) incluye explícitamente productos en wishlist con stock disponible. Es el cambio **#35** del ROADMAP; dependencias **#8** (stock multisource + sync), **#16** (auth / `web_profiles`) y **#28** (centro de notificaciones + email) completadas. Sin este cambio, la wishlist no retiene intención de compra cuando el producto está agotado y el menú intranet de **US-07 CA2** sigue incompleto.

## What Changes

- **Persistencia wishlist server-side:** tabla Supabase `stock_watches` por `web_profile_id` + `sku` (referencia ERP), con `last_notified_at`, `created_at` y estado activo; RLS por perfil.
- **Sync catálogo ↔ servidor:** al togglear wishlist en PLP/PDP, usuarios autenticados persisten vía `POST/DELETE /api/wishlist`; merge de localStorage al login (union de SKUs sin duplicar).
- **Job de avisos tras sync stock:** al finalizar `runStockSync()` (o cron dedicado inmediatamente después), detectar productos cuyo `stockIndicator` pasó de no-disponible (`limited`) a disponible (`available` o `low`) y despachar notificación a perfiles que siguen ese SKU.
- **Tipo de notificación `stock_available`:** reutilizar `dispatchNotification` ampliado para despacho **por perfil** (no por `customer_id` empresa); payload con `sku`, `productTitle`, `href` al PDP.
- **Preferencias US-21:** cuarta categoría **Avisos de stock** en `/intranet/mi-cuenta` (`wishlist_channel`: email | portal | off).
- **Página `/intranet/stock`:** sustituir scaffold por listado de referencias seguidas, indicador de stock actual, fecha de alta, acción quitar seguimiento y enlace al PDP.
- **Email RI-009:** plantilla transaccional "Ya hay stock de [referencia]" con enlace al producto.
- **PDP sin stock:** al añadir a wishlist en producto `limited`, mensaje de confirmación de que se avisará cuando haya stock (solo usuarios autenticados B2B validados).
- **APIs intranet:** `GET /api/intranet/stock-watches` para la página portal.
- **Tests:** unit (transición de stock, idempotencia por SKU+perfil+sync-run), integración (watch → sync → notificación), checklist manual US-07 CA2.

## Capabilities

### New Capabilities

- `wishlist-stock-watches`: Persistencia Supabase, RLS, APIs storefront para alta/baja/listado y merge localStorage al login.
- `wishlist-stock-alert-dispatch`: Detección post-sync de transiciones a disponible, despacho idempotente `stock_available` por perfil.
- `storefront-wishlist-stock-ui`: Página `/intranet/stock`, integración corazón PLP/PDP con sync server, feedback UX en PDP sin stock.

### Modified Capabilities

- `b2b-notification-service`: Nuevo tipo `stock_available`; campo `wishlist_channel` en `notification_preferences`; despacho por `web_profile_id` además del modo por `customer_id`.
- `storefront-b2b-notification-preferences`: Cuarta categoría Avisos de stock en mi cuenta y API.
- `b2b-proactive-notification-emails`: Plantilla email para `stock_available` (**RI-009**).
- `stock-sync-engine`: Invocar evaluación de avisos wishlist al completar sync exitoso o parcial con productos actualizados.

## Impact

- `supabase/migrations`: tabla `stock_watches`, columna `wishlist_channel` en `notification_preferences`.
- `apps/storefront`: `lib/wishlist/**`, APIs `/api/wishlist` y `/api/intranet/stock-watches`, página `/intranet/stock`, ajustes `ProductCard`/`ProductBuyBox`, formulario preferencias.
- `apps/cms`: `lib/notifications/wishlist-stock-alerts.ts` invocado desde stock orchestrator; ampliación `dispatch.ts` y `channels.ts`; plantilla email.
- Reutiliza: `stock-semaphore-resolver`, `runStockSync()`, campana existente (#28), Resend/Mailpit.
- Cumple alcance §1.21, **RF-022** (extensión wishlist), **US-07 CA2** (sección Avisos de stock operativa), **US-21** (canal configurable).
- Dependencias satisfechas: **#8** stock sync, **#16** auth, **#28** notificaciones.

## Non-Goals

- **Notificaciones B2C en `/cuenta`** o campana en cabecera B2C; v1 avisos portal solo intranet B2B validado (email opcional si perfil B2B).
- **Wishlist anónima con avisos por email** sin cuenta; invitados mantienen localStorage sin alertas hasta login B2B.
- **Alertas de stock para toda la empresa** (todos los perfiles de un `customer_id`); cada perfil recibe solo sus propios watches.
- **Re-alertar** el mismo SKU en cada sync mientras siga disponible; una transición `limited → available` genera como máximo un aviso hasta que el usuario vuelva a marcar tras quitar el watch.
- **Cantidades numéricas** en UI o emails; solo semáforo/etiqueta pública (**RF-005**).
- **Reserva de stock** o pedido automático al recibir aviso.
- **Backoffice KPI** de watches (#30); sin panel staff en este cambio.
- **Push / SMS**; solo portal + email.
- **Sincronización wishlist entre dispositivos** para anónimos (solo localStorage).

## Assumptions

- SKU ERP (`products.sku` / `skuErp`) es la clave estable del watch; coincide con el id usado hoy en `ProductBuyBox` y `ProductCard` (PLP usa `row.sku`).
- Transición alertable: `stockIndicator` anterior `limited` y nuevo `available` o `low` (según `resolveStockIndicator`).
- Idempotencia: `idempotency_key` = `stock:{sku}:{profileId}:{stockSyncRunId}` o ventana por `last_notified_at` + mismo SKU.
- Job corre en el mismo proceso post-`runStockSync()` (no cron separado) para cumplir SLA &lt; 15 min del batch stock (**RNF-004**).
- Idioma: español; asunto email **"Ya hay stock de [referencia] en Jeyjo"**.
- Usuarios B2B no validados pueden marcar wishlist en catálogo pero no reciben avisos hasta validación (misma regla que intranet).
