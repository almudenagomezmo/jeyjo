## Context

Las rutas PLP de categoría (`/c/[category]`, `/c/[category]/[sub]`, `/c/[category]/[sub]/[family]`) cargan candidatos vía `loadPlpPageFromCategory(categorySlugs)` → `listPublicProducts({ categorySlugs })`. El filtro actual (`matchesCategorySlugs`) comprueba si **algún** slug pasado está en `row.categorySlugs`, donde `row.categorySlugs` proviene de las relaciones directas del producto en Payload (típicamente hoja o subcategoría, p. ej. `boligrafos`, no `escritura`).

La página padre pasa solo `[category]`, por lo que productos en ramas hijas quedan excluidos. La subcategoría pasa `[category, sub]` y funciona para productos en `sub`, pero no para familias anidadas (`boligrafos-gel`). El árbol de navegación (`NavNode` desde `getNavigationTree()`) ya modela la jerarquía CMS con profundidad máxima 3.

## Goals / Non-Goals

**Goals:**

- Al abrir cualquier nodo del árbol en `/c/*`, listar todos los productos publicados cuya categoría CMS coincida con el slug del nodo **o de cualquier descendiente** en el árbol de navegación.
- Centralizar la expansión de slugs en un helper puro sobre `NavNode`, reutilizable por las tres páginas PLP.
- Mantener el resto del pipeline PLP intacto (facetas, sort, paginación, precios, stock).
- Cubrir con tests unitarios los casos padre→hijo y sub→familia.

**Non-Goals:**

- Denormalizar slugs de ancestros al mapear productos desde CMS.
- Cambiar el modelo editorial de Payload (seguir etiquetando en la categoría más específica).
- Aplicar filtro por árbol en histórico B2B, búsqueda vectorial o home.
- Modificar `matchesCategorySlugs` para inferir ancestros sin el árbol (requeriría datos de categorías en el mapper).

## Decisions

### 1. Expandir slugs en la capa de página, no en el mapper de productos

**Decisión:** Añadir `collectDescendantSlugs(node: NavNode): string[]` en `fetch-navigation-tree.ts` (o archivo colindante) y que cada página `/c/*` pase el array expandido a `loadPlpPageFromCategory`.

**Alternativas:**

| Enfoque | Pros | Contras |
|---------|------|---------|
| Expandir en página (elegido) | Usa árbol ya cargado; cambio mínimo; sin tocar cache de productos | Tres páginas deben usar el mismo patrón |
| Denormalizar en `mapDocToRow` | Filtro simple en runtime | Requiere category docs en listado; invalidación más compleja |
| Query CMS con `where categories in descendants` | Menos filtrado en memoria | Payload no expone subárbol nativo; más round-trips |

**Rationale:** El listado ya carga todo el catálogo publicable en memoria (`listCachedPublicProductRows`); el coste de pasar N slugs extra es despreciable frente a añadir joins o denormalización.

### 2. Resolver el nodo activo desde el árbol, no desde segmentos URL

**Decisión:** Tras validar la ruta con `findNavNodeBySlug`, usar ese `NavNode` como raíz de expansión:

- `/c/escritura` → nodo `escritura` → slugs de toda la rama.
- `/c/escritura/boligrafos` → nodo hijo `boligrafos` → slugs de bolígrafos + familias.
- `/c/escritura/boligrafos/boligrafos-gel` → nodo hoja → solo `[boligrafos-gel]`.

**Rationale:** Elimina la lógica ad hoc de pasar `[category, sub]` con OR parcial; unifica comportamiento en los tres niveles.

### 3. Mantener `matchesCategorySlugs` con semántica OR sobre slugs expandidos

**Decisión:** No cambiar la firma de `listPublicProducts`; el caller pasa la lista completa de slugs del subárbol. `matchesCategorySlugs` sigue siendo `slugs.some(s => row.categorySlugs.includes(s))`.

**Rationale:** Separación clara: expansión = árbol de navegación; match = slugs del producto.

### 4. Tests en storefront

**Decisión:** Test unitario de `collectDescendantSlugs` con árbol fixture (como `navigation-tree.test.ts`) y test de `matchesCategorySlugs` / integración ligera verificando que slugs expandidos incluyen productos hijo.

## Risks / Trade-offs

- **[Producto etiquetado en categoría fuera del subárbol visible]** → Comportamiento correcto: no aparece en PLP de ese nodo. Sin cambio.
- **[Profundidad truncada en `maxDepth=3`]** → Productos en categorías más profundas que el árbol no aparecerían; ya es limitación existente de navegación (#44), no introducida por este cambio.
- **[Conteo y facetas en padre incluyen toda la rama]** → Deseado para UX de categoría; el total refleja el alcance semántico del nodo.
- **[Doble fetch de árbol en página]** → Las páginas ya llaman `getNavigationTree()` para breadcrumbs; reutilizar la misma instancia en la misma request (sin fetch adicional).

## Migration Plan

1. Implementar helper + actualizar tres páginas `/c/*`.
2. Añadir tests; ejecutar suite storefront.
3. Verificación manual: `/c/escritura` muestra productos de `boligrafos`; `/c/escritura/boligrafos` muestra productos de `boligrafos-gel`.
4. Despliegue: solo storefront; sin migración de datos ni sync de categorías adicional.

**Rollback:** Revertir a pasar slugs URL sin expansión (comportamiento anterior).

## Open Questions

_(ninguna — alcance acotado y decisión técnica clara)_
