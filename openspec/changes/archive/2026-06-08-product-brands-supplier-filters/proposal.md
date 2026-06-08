## Why

En el dominio de Jeyjo, **marca** (identidad comercial del artículo, p. ej. BIC) y **proveedor** (actor de abastecimiento/logística, p. ej. Distrisantiago) son conceptos distintos. El código actual colapsa ambos: el storefront deriva `brand` de `supplier.name`, el seed mezcla marcas y mayoristas en la colección `suppliers`, y el filtro PLP `?brand=` opera sobre el nombre del proveedor. Eso impide filtrar correctamente por marca y proveedor a la vez y puede mostrar mayoristas como marca al cliente (**RF-010**, alcance §1.7).

## What Changes

- **Nueva colección CMS `brands`:** catálogo de marcas con `name` y `slug` opcional; staff CRUD en grupo Catálogo.
- **Relación opcional en productos:** cada producto tiene **0 o 1** marca (`brand`) y **0 o 1** proveedor (`supplier`); dejan de ser el mismo dato.
- **Storefront — lectura de catálogo:** `PlpProductRow` y `PdpProductView` exponen `brand` y `supplier` como campos separados (`string | null`).
- **Storefront — PLP facetado:** filtros acumulables independientes por marca (`?brand=`) y proveedor (`?supplier=`), con recuentos RF-010 en sidebar.
- **PDP y Merchant feed:** marca desde `brands`; proveedor opcional en tabla de especificaciones PDP (no en cabecera de tarjeta).
- **Seed y datos demo:** migrar marcas (BIC, HP, …) de `suppliers` a `brands`; `suppliers` queda para proveedores logísticos (Distrisantiago, Arnoia, …).
- **BREAKING:** productos que hoy usan `supplier` como marca dejarán de mostrar marca hasta que staff asigne `brand`; el filtro `?brand=` deja de coincidir con `supplier.name`.

## Capabilities

### New Capabilities

- `payload-brands-collection`: Colección Payload `brands`, relación opcional 0..1 en `products`, acceso staff y auditoría.

### Modified Capabilities

- `payload-catalog-collections`: Separar entidad marca de proveedor; producto referencia ambas de forma opcional.
- `storefront-catalog-read`: Filas PLP y snapshot PDP con `brand` y `supplier` independientes.
- `storefront-plp-faceted`: Filtro acumulativo por proveedor además de marca; URL `?supplier=`.
- `storefront-pdp-product-detail`: Marca desde `brands`; fila "Proveedor" en especificaciones.
- `cms-merchant-center-feed`: Campo `g:brand` desde relación `brands`, no `suppliers`.

## Impact

- `apps/cms`: nueva colección `Brands`, campo `brand` en `products`, registro en `payload.config`, migración Payload, seed `jeyjo-es-catalog-data`, `defaultPopulate`, audit hooks, staff collection visibility.
- `apps/storefront`: `fetch-product-list.ts`, `fetch-product-pdp.ts`, tipos PLP/PDP, `apply-filters`, `facet-aggregates`, `plp-search-params`, `filters-utils`, `FacetSidebar`, cards/quick view, tests.
- Specs de dominio alineadas a **RF-010** (marca/fabricante) y alcance §1.7; sin cambios ERP/sync en este cambio.
- Depende de catálogo CMS y PLP facetado ya implementados (#3, #10). Desbloquea comparativa (#38) y cupones por fabricante con modelo correcto.

## Non-Goals

- Sincronización ERP / Excel de marcas o proveedores (columna `Marca` Avansuite, `CodigoProveedor`).
- Páginas de marca dedicadas (`/marca/bic`).
- Logo de marca, SEO de marca, o facetas dinámicas adicionales.
- Cambiar el modelo de stock multisource (Distrisantiago/Arnoia siguen como campos de stock, no como `supplier` obligatorio).
- Renombrar la colección `suppliers` en base de datos (solo corregir semántica y seed).
