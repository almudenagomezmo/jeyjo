## Why

La PLP facetada (#10) ya ofrece tarjetas con precio dual, stock semáforo y add-to-cart, pero el visitante anónimo sigue sin poder contrastar modelos en paralelo sin abrir varias pestañas — requisito explícito de **US-06** (ÉPICA-01, prioridad baja, estimación M). Es el cambio **#38** del ROADMAP; depende solo de #10 (`plp-faceted-listing`, completado). Cierra un gap funcional del catálogo público antes de pulir piezas de contenido (#33 blog) u omnicanal (#40).

## What Changes

- **Control "Comparar" en tarjetas PLP:** checkbox o botón en cada `ProductCard` de rutas `/c/*` y `/search` (**US-06 CA1**).
- **Selección acotada (2–3 SKUs):** estado cliente persistente (`localStorage`) con barra fija inferior; al intentar un cuarto producto, mensaje *"Solo puedes comparar hasta 3 productos a la vez"* (**US-06 CA2**).
- **Página `/comparar`:** tabla en columnas con precio dual resuelto, marca, proveedor, color/material, unidad de envase (proxy de dimensiones hasta datos PIM), disponibilidad semáforo y descripción corta (**US-06 CA3**); URL compartible `?skus=…`.
- **Add-to-cart desde comparación:** botón por columna con `packUnit` y apertura minicart (**US-06 CA4**).
- **API servidor:** carga batch de filas de comparación desde CMS + `POST /api/pricing/batch` + stock batch reutilizando utilidades PLP existentes.
- **Accesibilidad:** estados `aria-pressed` / `aria-checked`, navegación teclado en barra y tabla.

## Capabilities

### New Capabilities

- `storefront-product-comparison`: Selección PLP (máx. 3), barra de acción, página `/comparar`, carga batch de atributos, add-to-cart y mensajes de límite (**US-06**).

### Modified Capabilities

- `storefront-plp-faceted`: Requisito de control de comparación en tarjetas de listado facetado (categoría, subcategoría, familia y búsqueda).

## Impact

- `apps/storefront`: `ProductCard`, `ProductGrid`/`ProductCatalog`, nuevo `compare-store`, componentes `CompareBar` y `CompareTable`, ruta `(shop)/comparar`, loader `lib/compare/**`, posible `GET /api/compare` o server loader directo.
- Reutiliza: `PlpProductRow`, `fetchPublicProductsFromCms` / lectura por SKU, `POST /api/pricing/batch`, `getStockIndicator` batch, `useCartStore`, tokens UI existentes.
- Sin cambios CMS obligatorios: atributos provienen de campos ya expuestos (marca, supplier, facetColor, facetMaterial, packUnit, shortDescription, stockIndicator).
- Cumple **US-06** CA1–CA4; alineado a alcance §1.7 (listado). Nota: la user story cita "RF-015 (atributos de producto)" — en el catálogo actual los atributos comparables provienen de campos comerciales/enrichment ya modelados en producto (equivalente funcional a RF-012 en PDP).
- Dependencia satisfecha: **#10** PLP facetada.

## Non-Goals

- Comparar desde home carruseles (#15), PDP relacionados o wishlist; solo listados facetados PLP/search.
- Comparativa de más de 3 productos, export PDF/Excel o impresión dedicada.
- Atributos técnicos dinámicos arbitrarios (tabla JSON ERP); v1 usa conjunto fijo acordado en spec (precio, marca, proveedor, color, material, envase, stock, descripción corta).
- Dimensiones físicas (alto/ancho/profundidad) hasta modelo PIM extendido (#21); `packUnit` + facetas cubren CA3 "dimensiones" en v1.
- Persistencia server-side de comparaciones (solo sesión/navegador).
- Comparativa B2B con precios por tarifa personalizada distinta del toggle cabecera (#25 ya resuelve quotes por sesión; no duplicar lógica).
- Analytics GA4 eventos de comparación (#34); opcional post-v1.
- Tests E2E Playwright completos; unit + checklist manual US-06.
