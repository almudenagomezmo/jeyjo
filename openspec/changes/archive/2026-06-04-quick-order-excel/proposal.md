## Why

El portal B2B (#22) y el histórico de compras (#23) ya permiten navegar y repetir pedidos, pero `/intranet/pedido-rapido` sigue siendo un scaffold. Los compradores profesionales (**US-11**, subusuario B2B) necesitan introducir referencias conocidas (mayorista, OEM o EAN) o cargar un Excel sin recorrer el catálogo — patrón central de **RF-019** y alcance §1.17. El carrito (#12) y el motor de precios (#6) ya resuelven líneas y tarifas B2B; este cambio (#24 del ROADMAP) sustituye el placeholder por la sección operativa y desbloquea el flujo de recompra diaria junto al histórico.

## What Changes

- **Sección “Pedido rápido”** en `/intranet/pedido-rapido`: formulario referencia + cantidad, vista previa en tiempo real (nombre, imagen, precio B2B actual) y acción **Añadir al carrito** con validación server-side (**US-11 CA1–CA2**).
- **Resolución de referencias (RF-013):** lookup unificado por `skuErp`, `oemRef` o `ean` en catálogo CMS publicado; rechazo de wildcards y borradores; debounce en cliente contra API `GET /api/intranet/quick-order/lookup`.
- **Carga Excel:** subida `.xlsx`/`.xls` con columnas **Referencia** y **Cantidad** (cabeceras flexibles en español/inglés); parseo en servidor; resumen fila a fila (OK / no encontrada / cantidad inválida); **Añadir válidas al carrito** en una operación (**US-11 CA3**, criterio RF-019: 10 referencias válidas → 10 líneas).
- **Referencias no catalogadas (**US-11 CA4**):** si el lookup falla, UI ofrece textarea para solicitar artículo como “referencia no catalogada”; las solicitudes se acumulan en sesión y se fusionan en el campo de observaciones del checkout (máx. 500 caracteres existente) al tramitar — sin línea de carrito ficticia ni SKU comodín en web pública.
- **APIs storefront:** `GET .../lookup?ref=`, `POST .../validate-batch` (preview Excel/manual), `POST .../add-to-cart` (misma semántica que repeat del histórico: slugs + qty + quotes validados).
- **UI intranet:** reemplazar `IntranetScaffoldPage`; tabla de resultados de importación; plantilla Excel descargable; estados vacío/error; toast + apertura minicarrito tras añadir (coherente con #23).
- **Tests:** unit (parser Excel, normalización cabeceras, resolver ref), integración API (auth B2B, wildcard, OEM/EAN), Playwright flujo referencia única y carga Excel en staging.

## Capabilities

### New Capabilities

- `storefront-b2b-quick-order`: UI pedido rápido, lookup por referencia, importación Excel, solicitudes no catalogadas y APIs intranet (**RF-019**, **US-11**).

### Modified Capabilities

- `storefront-b2b-portal-shell`: Sustituir escenario scaffold en `/intranet/pedido-rapido` por formulario y flujo Excel operativo.
- `storefront-cart-minicart`: Reutilizar `addItems` tras POST add-to-cart; documentar que solicitudes no catalogadas no crean líneas de carrito.
- `storefront-checkout-shipping`: Al colocar pedido, fusionar solicitudes no catalogadas pendientes de pedido rápido en `observations` si el usuario no las borró (extensión mínima del campo existente).

## Impact

- `apps/storefront`: `app/(b2b)/intranet/pedido-rapido/**`, `components/intranet/quick-order/**`, `lib/intranet/quick-order/**`, rutas `app/api/intranet/quick-order/**`.
- `apps/storefront/package.json`: dependencia de parseo Excel (p. ej. `xlsx` o reutilización controlada de `exceljs` — ver design.md).
- `lib/catalog/`: helper `resolveProductByReference` (sku / OEM / EAN) compartido con PDP/search.
- Tests en `apps/storefront/tests/` (parser, lookup, APIs, E2E intranet).
- Cumple **RF-019**, **US-11**; depende de ROADMAP #12 (`cart-minicart-client`) y #22 (`portal-b2b-shell`) — completados; complementa #23 (`purchase-history-repeat`).
- Desbloquea uso real del portal B2B para pedidos por lista de referencias antes de #25 (tarifas) y #26 (permisos subusuario).

## Non-Goals

- Importador/exportador masivo de catálogo en backoffice (**#29** `excel-importer-exporter`) — formatos Avansuite distintos.
- Permisos RF-003 por subusuario en pedido rápido (**#26**): v1 todos los B2B validados de la empresa.
- Crear líneas de carrito con SKU comodín ERP (`9000000001`) en web pública.
- Pedido rápido en área B2C `/cuenta` (fuera de US-11).
- Validación de stock en tiempo real bloqueante (semáforo informativo opcional; no impedir añadir si RF-005 permite pedido sin stock — alineado a PDP/carrito).
- Envase cerrado automático distinto del `packUnit` ya aplicado por `QtyStepper` al añadir (reutilizar lógica carrito #12).
- Sincronización de pedidos al ERP vía API (**#36**); las referencias no catalogadas no generan artículo ERP automático.
- Plantillas Excel de exportación de pedidos OMS (**#20** / `order-export`) — solo plantilla de entrada cliente con dos columnas.

## Assumptions

- Payload `products` indexa `skuErp`, `oemRef` y `ean` consultables vía REST `where[or]` (o tres consultas secuenciales si el CMS no soporta OR — ver design.md).
- Cantidad por defecto = 1 si Excel deja celda vacía; cantidades ≤ 0 se marcan error de fila.
- Límite v1: 200 filas por archivo Excel; 5 MB tamaño máximo.
- Idioma UI: español (etiquetas US-07 / portal existente).
