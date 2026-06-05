## Why

El portal B2B (#22) expone `/intranet/pedido-rapido` como scaffold; sin **RF-019** y **US-11**, los compradores profesionales no pueden añadir artículos al carrito por referencia (Jeyjo, OEM o EAN) ni importar un Excel de líneas — el flujo habitual en distribución que evita navegar el catálogo. El carrito (#12) ya soporta `addItems` en batch y el histórico (#23) cubre recompra; este cambio (#24 del ROADMAP) cierra el hueco de pedido rápido y desbloquea observaciones de artículos no catalogados antes del checkout (#17).

## What Changes

- **Sección operativa** en `/intranet/pedido-rapido`: formulario referencia + cantidad, vista previa en tiempo real (nombre, foto, precio actual B2B) y botón **Añadir al carrito** (**US-11 CA1–CA2**).
- **Resolución multi-campo:** lookup server-side por `skuErp`, `oemRef` o `ean` en productos CMS publicados no wildcard (índice RF-013 vía campos ERP ya sincronizados).
- **Importación Excel:** subida `.xlsx`/`.xls` con columnas **Referencia** y **Cantidad**; validación y resumen de filas (válidas, no encontradas, wildcard); acción **Añadir todas al carrito** en una operación (**RF-019** criterio de verificación: 10 referencias válidas → 10 líneas).
- **Referencias no catalogadas:** si el lookup falla, UI ofrece caja de texto libre + cantidad para registrar solicitud **referencia no catalogada** (no añade SKU al carrito; se adjunta al siguiente checkout como observaciones estructuradas — **US-11 CA4**).
- **APIs storefront:** `POST /api/intranet/quick-order/lookup`, `POST /api/intranet/quick-order/parse-excel` (multipart), `POST /api/intranet/quick-order/add` (batch validado con precios) bajo guard B2B existente.
- **UI intranet:** reemplazar `IntranetScaffoldPage` por `QuickOrderPanel`; tabla de resultados Excel; toast + apertura minicarrito tras añadir (patrón #23).
- **Plantilla Excel:** enlace de descarga a `.xlsx` de ejemplo con cabeceras correctas.
- **Tests:** unit (parser Excel, normalización cabeceras, merge referencias), API (auth, lookup OEM/EAN, batch add), test de regresión **RF-019** (10 filas → 10 additions).

## Capabilities

### New Capabilities

- `storefront-b2b-quick-order`: UI y APIs de pedido rápido en intranet — lookup, Excel, solicitudes no catalogadas y batch add al carrito (**RF-019**, **US-11**).

### Modified Capabilities

- `storefront-b2b-portal-shell`: Sustituir scaffold en `/intranet/pedido-rapido` por vista de producción; escenario pedido rápido alineado con #23 (histórico).
- `storefront-cart-minicart`: Reutilizar/extender batch add desde pedido rápido (misma semántica `addItems` que histórico).
- `storefront-catalog-read`: Lookup público por referencia alternativa (OEM/EAN), no solo SKU/slug.

## Impact

- `apps/storefront`: `app/(b2b)/intranet/pedido-rapido/**`, `components/intranet/QuickOrder*`, `lib/intranet/quick-order/**`, rutas `app/api/intranet/quick-order/**`.
- Dependencia nueva: parser Excel (p. ej. `xlsx` / SheetJS) en `apps/storefront`.
- `apps/cms`: consultas Payload `where` por `skuErp`, `oemRef`, `ean` (sin cambios de schema).
- `packages/pricing` / stock: consumo existente en lookup y batch add.
- Tests en `apps/storefront/tests/`.
- Cumple **RF-019**, **US-11**; depende de ROADMAP #12, #22 (completados); complementa #23 (observaciones post-repetir).
- Desbloquea uso real del portal B2B antes de #25 (tarifas) y #26 (subusuarios).

## Non-Goals

- Importador/exportador masivo de catálogo en backoffice (**#29** `excel-importer-exporter`) — distinto formato y audiencia (staff PIM).
- Permisos RF-003 por subusuario en pedido rápido (#26): todos los B2B validados usan la sección v1.
- Pedido rápido en área B2C `/cuenta` (solo intranet B2B en alcance §1.17).
- Creación automática de presupuesto Payload por referencia no catalogada (el usuario puede usar flujo presupuesto #19 por separado).
- Validación de stock bloqueante antes de añadir (misma semántica que PDP: aviso, pedido permitido según `allowOrderWithoutStock`).
- Plantillas Excel de exportación de pedidos Avansuite (OMS **#20** ya cubre export pedido web).
- Búsqueda predictiva / voz (RF-009) como sustituto del lookup por referencia.

## Assumptions

- Campos `skuErp`, `oemRef`, `ean` en colección Products están poblados por sync ERP (#7) para SKUs de prueba (REF-001, etc.).
- Cabeceras Excel aceptan variantes sin acento (`Referencia` / `referencia`) y cantidad entera > 0.
- Límite v1: 500 filas por fichero Excel para acotar tiempo de parseo en serverless.
- Solicitudes no catalogadas se persisten en `sessionStorage` hasta checkout prepare, no en Payload.
