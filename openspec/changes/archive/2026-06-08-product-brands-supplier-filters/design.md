## Context

- **Estado actual:** `products.supplier` (relación a `suppliers`) alimenta el campo `brand` en storefront (`mapDocToRow` → `supplierName`). El seed `JEYJO_SUPPLIERS` mezcla marcas comerciales (BIC, HP) con mayoristas (Distrisantiago). El PLP solo filtra por `?brand=` sobre ese alias incorrecto. Stock multisource (Distrisantiago/Arnoia) ya está modelado aparte en campos `distrisantiagoStock` / `arnoiaStock`.
- **Dominio confirmado:** un producto tiene **0 o 1 marca** y **0 o 1 proveedor**; el cliente debe poder filtrar por ambos en PLP. ERP fuera de alcance.
- **Dependencias:** catálogo Payload (#3), PLP facetado (#10), PDP (#11), Merchant feed (#34) ya implementados.

## Goals / Non-Goals

**Goals:**

- Colección `brands` en Payload con `name` (requerido) y `slug` (opcional, único si presente).
- Campo `products.brand` → relación opcional `relationTo: 'brands'`, sidebar junto a `supplier`.
- Storefront: `PlpProductRow.brand` y `PlpProductRow.supplier` como `string | null`; mismos campos en `PdpProductView`.
- PLP: dimensión de filtro `suppliers` paralela a `brands`; URL `?supplier=`; facetas acumulativas RF-010.
- PDP: cabecera y tarjetas muestran marca (si existe); tabla de specs incluye filas "Marca" y "Proveedor".
- Merchant feed: `g:brand` desde `brands.name`; omitir si producto sin marca.
- Migrar seed: marcas → `brands`; proveedores logísticos → `suppliers`; productos con ambas relaciones donde aplique.

**Non-Goals:**

- ERP sync / Excel mapping de marca o proveedor.
- Landing pages por marca, logos, o búsqueda Qdrant por marca como entidad indexada (fase posterior).
- Renombrar slug de colección `suppliers` en BD.
- Mostrar proveedor en cabecera de tarjeta PLP (solo marca + ref).

## Decisions

### 1. Colección `brands` separada (no campo texto en producto)

**Decisión:** Nueva colección `brands` con relación opcional en producto.

**Alternativa descartada:** `brandName` texto libre en producto — duplicados ("Bic"/"BIC"), facetas inconsistentes, peor UX admin.

**Campos mínimos v1:** `name` (text, required), `slug` (text, unique, optional). Sin logo ni descripción en v1.

### 2. Cardinalidad 0..1 en producto

**Decisión:** `brand` y `supplier` son relaciones simples (no `hasMany`), ambas opcionales.

**Comportamiento storefront:** `null` → no aparece en facetas; PLP card sin prefijo de marca; PDP specs muestran "—".

### 3. Mapeo storefront

**Decisión:** En `mapDocToRow` / `mapPdpDocToView`:

```ts
brand: brandName(doc.brand)      // brands.name o null
supplier: supplierName(doc.supplier)  // suppliers.name o null (sin fallback "Sin marca")
```

Eliminar derivación `brand ← supplier.name`.

**Fetch depth:** mantener `depth: 1` en listados; poblar `brand` y `supplier` en `defaultPopulate` del producto.

### 4. Filtros PLP

**Decisión:** Extender `PlpActiveFilters` con `suppliers: string[]`. Query param `supplier` (repetido o CSV, mismo patrón que `brand`). `FacetSidebar` grupo "Proveedor" separado de "Marca / fabricante".

**Agregación:** `buildFacetAggregates` añade dimensión `suppliers` con `omit: 'suppliers'` en `productMatchesFilters`.

**Combinación:** `brand=BIC` AND `supplier=Distrisantiago` = intersección (RF-010).

### 5. Visibilidad en UI

**Decisión:**

| Superficie | Marca | Proveedor |
|---|---|---|
| PLP card / quick view | Sí (`Marca · REF`) | No |
| PLP sidebar filtros | Sí | Sí |
| PDP cabecera | Sí | No |
| PDP specs | Sí | Sí |
| Merchant feed | `g:brand` | No |

### 6. CMS admin

**Decisión:** `brands` en grupo **Catálogo**, junto a products/categories/suppliers. `defaultColumns` en products: `title`, `skuErp`, `brand`, `supplier`, `_status`. Audit hooks en `brands` igual que suppliers. Staff role `catalogo` con mismo acceso CRUD que suppliers.

### 7. Migración de seed

**Decisión:** Script de seed actualizado:

1. Crear `brands` desde entradas `type: 'manufacturer'` del seed actual.
2. Mantener en `suppliers` solo `distributor` / `wholesaler` (p. ej. Distrisantiago).
3. Por producto: `brand` → marca correspondiente; `supplier` → Distrisantiago u otro proveedor logístico asignado en fixtures (p. ej. productos BIC → brand BIC, supplier Distrisantiago).

**Datos existentes en entornos dev:** re-ejecutar `pnpm seed:catalog` o migración one-off que lea `supplier` manufacturer y cree `brand` equivalente.

### 8. Payload migration

**Decisión:** Generar migración Payload (`pnpm payload migrate:create`) para tabla `brands` y FK `products.brand_id`. No eliminar columna `products.supplier_id`.

## Risks / Trade-offs

- **[Risk] Productos sin marca tras migración** → Mitigation: seed asigna marcas; admin muestra columna `brand`; documentar en tasks re-seed.
- **[Risk] Filtro `?brand=` antiguo deja de coincidir** → Mitigation: breaking change aceptado; valores de marca siguen siendo nombres legibles (BIC), no slugs.
- **[Risk] Facetas vacías si staff no asigna marca/proveedor** → Mitigation: ocultar grupo de faceta si cardinalidad 0 (comportamiento actual).
- **[Trade-off] Sin ERP, staff debe mantener dos relaciones manualmente** → Aceptado; sync ERP en cambio futuro.

## Migration Plan

1. Desplegar CMS con colección `brands` + migración BD.
2. Ejecutar seed/migración de datos demo.
3. Desplegar storefront con nuevo mapeo y filtros.
4. **Rollback:** revertir deploy storefront (filtro supplier ignorado); CMS mantiene columnas nuevas sin uso — sin pérdida de datos.

## Open Questions

- Ninguna bloqueante para v1. Sync ERP de `marca` vs `CodigoProveedor` queda para cambio #36 congelado o import Excel futuro.
