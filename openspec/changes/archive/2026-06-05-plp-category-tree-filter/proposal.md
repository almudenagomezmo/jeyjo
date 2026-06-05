## Why

En las rutas PLP de categoría (`/c/*`), el filtrado usa coincidencia exacta de slug: un producto etiquetado solo en una subcategoría o familia no aparece al navegar por su categoría padre. Esto contradice la taxonomía del mega-menú (Categoría > Subcategoría > Familia) y deja páginas padre vacías aunque haya productos en ramas hijas. Tras #44 (categorías 100 % CMS), el árbol de navegación ya está disponible; falta usarlo al resolver candidatos del listado.

## What Changes

- Expandir el conjunto de slugs de filtro PLP al **subárbol completo** del nodo de navegación activo (nodo + todos los descendientes), en lugar de solo el slug del segmento URL.
- Unificar las tres rutas `/c/[category]`, `/c/[category]/[sub]` y `/c/[category]/[sub]/[family]` para que todas resuelvan candidatos desde el `NavNode` correspondiente.
- Añadir helper reutilizable `collectDescendantSlugs(node)` en el módulo de navegación del storefront.
- Añadir tests unitarios que verifiquen inclusión jerárquica (padre incluye hijo; subcategoría incluye familia).
- Actualizar el requisito de spec PLP para dejar explícito que “pertenece a la categoría” significa pertenencia al **árbol**, no solo slug exacto.

## Capabilities

### New Capabilities

_(ninguna — corrección de comportamiento sobre capacidad PLP existente)_

### Modified Capabilities

- `storefront-plp-faceted`: el requisito de listado por categoría SHALL incluir productos de cualquier categoría descendiente del nodo activo en el árbol CMS.

## Impact

- **Storefront**: `apps/storefront/src/lib/catalog/fetch-navigation-tree.ts` (helper), páginas `apps/storefront/src/app/(shop)/c/**/page.tsx`, posible ajuste mínimo en `load-plp-page.ts` / `fetch-product-list.ts` (sin cambio de contrato público).
- **CMS / Payload**: sin cambios; los productos siguen etiquetándose en la categoría más específica.
- **Specs**: delta en `storefront-plp-faceted`.
- **Non-goals**: filtro por árbol en histórico B2B (#23), denormalizar ancestros en `categorySlugs` al mapear productos, cambios en Qdrant/búsqueda vectorial, cambios editoriales en Payload para forzar etiquetado multi-nivel.
