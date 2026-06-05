## 1. Helper de árbol

- [x] 1.1 Añadir `collectDescendantSlugs(node: NavNode): string[]` en `apps/storefront/src/lib/catalog/` (export desde módulo de navegación o archivo dedicado)
- [x] 1.2 Test unitario: árbol de 3 niveles devuelve slug del nodo + todos los descendientes; nodo hoja devuelve solo su slug

## 2. Páginas PLP `/c/*`

- [x] 2.1 Actualizar `apps/storefront/src/app/(shop)/c/[category]/page.tsx` para pasar `collectDescendantSlugs(node)` a `loadPlpPageFromCategory`
- [x] 2.2 Actualizar `apps/storefront/src/app/(shop)/c/[category]/[sub]/page.tsx` para expandir desde el nodo hijo (`child`), no desde `[category, sub]`
- [x] 2.3 Actualizar `apps/storefront/src/app/(shop)/c/[category]/[sub]/[family]/page.tsx` para expandir desde el nodo familia (`familyNode`)

## 3. Verificación

- [x] 3.1 Test de filtrado: producto con `categorySlugs: ['boligrafos']` coincide cuando candidatos incluyen slug expandido de padre `escritura`
- [x] 3.2 Test de filtrado: producto con `categorySlugs: ['boligrafos-gel']` coincide en subcategoría `boligrafos` pero no en familia hermana
- [x] 3.3 Ejecutar `pnpm --filter storefront test` y verificar que pasa
- [x] 3.4 Verificación manual: `/c/escritura` muestra productos de subcategorías; `/c/escritura/boligrafos` incluye familias gel/tinta

## 4. Cierre OpenSpec

- [x] 4.1 Tras implementación: sync delta spec a `openspec/specs/storefront-plp-faceted/spec.md` y archivar cambio
