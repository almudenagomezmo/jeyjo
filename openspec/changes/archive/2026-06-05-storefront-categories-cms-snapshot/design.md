## Context

- **Estado actual:** `getNavigationTree()` llama `GET /api/categories` con `unstable_cache` (300 s) y cae a `lib/data/categories.ts` si la respuesta es vacía o falla. Los glyphs vienen de `SLUG_GLYPH_MAP` / `SLUG_GLYPH_FALLBACK`, no de `homeGlyph` en Payload. El árbol soporta 3 niveles en `buildNavigationTree(maxDepth=3)`, pero `MegaMenu`/`MobileNav` enlazan familias como `#slug` sobre la PLP de subcategoría; no existe ruta `/c/[category]/[sub]/[family]`.
- **Problema observado:** logs `[navigation] CMS returned no categories; using static fallback` cuando el CMS arranca después del storefront o el cache congela `[]`.
- **Decisión explore:** Opción C — CMS live + snapshot versionado; glyphs desde CMS; familias con PLP propia.

## Goals / Non-Goals

**Goals:**

- Una sola fuente de verdad en runtime: Payload `categories` (live o snapshot).
- Script monorepo `pnpm --filter storefront sync:categories` → JSON versionado.
- Resolución runtime: CMS live (timeout 3 s) → snapshot → árbol vacío + warn.
- `homeGlyph` en nodos raíz del árbol y featured home; eliminar mapas slug→glyph.
- Rutas `/c/{root}/{sub}/{family}` con PLP, breadcrumbs y enlaces de navegación alineados.
- Seed CMS con familias demo (ej. bolígrafos → gel, tinta).
- No cachear respuestas CMS vacías en `unstable_cache`.

**Non-Goals:**

- Webhook Payload post-save (fase 2).
- Cuarto nivel en navegación.
- Reescribir carruseles home con slugs dinámicos (`page.tsx` hardcoded).
- Cambios de schema Payload (`homeGlyph` ya existe).

## Decisions

### 1. Formato y ubicación del snapshot

**Decisión:** `apps/storefront/data/category-tree.snapshot.json`:

```json
{
  "syncedAt": "ISO-8601",
  "source": "https://cms.example/api/categories",
  "docs": [ { "id", "title", "slug", "parent", "sortOrder", "homeGlyph" } ]
}
```

Lista plana idéntica al contrato `CmsCategoryDoc` ampliado con `homeGlyph`. El árbol se construye siempre con `buildNavigationTree(docs)`.

**Alternativa descartada:** Árbol pre-serializado — duplica lógica de parent linking.

**Alternativa descartada:** Snapshot en Supabase — segunda fuente operativa.

### 2. Script de sincronización

**Decisión:** `apps/storefront/scripts/sync-category-snapshot.mjs` (o `.ts` vía `tsx`):

- Lee `CMS_URL` / `CMS_INTERNAL_URL`.
- `GET /api/categories?depth=0&limit=500&sort=sortOrder`.
- Escribe JSON con `syncedAt` y exit code ≠ 0 si CMS vacío (fallar CI).
- Expuesto como `"sync:categories": "node scripts/sync-category-snapshot.mjs"` en `apps/storefront/package.json` y alias root `"sync:categories": "pnpm --filter storefront sync:categories"`.

**CI:** paso opcional post-seed en docs; commit del snapshot tras cambios de taxonomía en staging.

### 3. Resolución runtime (`fetchCategoryDocs`)

**Decisión:** Nueva función interna unificada:

```
fetchCategoryDocs():
  1. try fetchCmsLive() — sin unstable_cache si body vacío
  2. if docs.length > 0 → return docs
  3. readSnapshotSync() from data/category-tree.snapshot.json
  4. if snapshot.docs.length > 0 → return snapshot.docs
  5. return [] + console.warn
```

**Cache:** `unstable_cache` solo cuando `docs.length > 0`. Tag `cms-navigation-categories`; revalidate 300 s.

**Alternativa descartada:** Mantener `CATEGORIES` estático — triplicación y desalineación con PIM.

### 4. Glyphs

**Decisión:** En `buildSubtree`, `glyph: doc.homeGlyph ?? undefined` (tipado `GlyphKind`). Solo raíces suelen tener valor; hijos/familias sin glyph.

Eliminar `SLUG_GLYPH_MAP` y `SLUG_GLYPH_FALLBACK` (FeaturedCategories usa `cat.glyph` del payload home/nav).

### 5. Tercer nivel — rutas PLP

**Decisión:** Nueva página `apps/storefront/src/app/(shop)/c/[category]/[sub]/[family]/page.tsx` espejo de `[sub]/page.tsx`:

- Valida `family` como hijo de `sub` en el árbol.
- `loadPlpPageFromCategory([category, sub, family], sp)` — `matchesCategorySlugs` ya usa `.includes()`.
- `basePath`: `/c/${category}/${sub}/${family}`.

**MegaMenu / MobileNav:** sustituir `href={...#${family.slug}}` por `/c/${cat.slug}/${sub.slug}/${family.slug}`.

**Alternativa descartada:** Mantener anclas — no indexables, breadcrumbs rotos, EVA/GA4 sin slug de familia.

**Catch-all `[...segments]`:** descartado por simplicidad; profundidad fija 3 acordada con spec.

### 6. Limpieza de taxonomía estática

**Decisión:**

- Eliminar export runtime de `CATEGORIES` y `staticCategoriesToNavNodes`.
- Mover datos mínimos a `apps/storefront/tests/fixtures/categories.ts` si tests lo requieren.
- Eliminar `searchCategories()` y `getCategory()` sin consumidores.

### 7. Seed CMS familias demo

**Decisión:** Extender `storefront-navigation.ts`:

```ts
{ slug: 'boligrafos', children: [
  { slug: 'gel', title: 'Bolígrafos gel', sortOrder: 1 },
  { slug: 'tinta', title: 'Bolígrafos tinta', sortOrder: 2 },
]}
```

Crear familias solo si no existen (mismo patrón idempotente que raíces).

## Risks / Trade-offs

| Riesgo | Mitigación |
|--------|------------|
| Snapshot desactualizado en prod | Documentar `sync:categories` en release checklist; CI falla si CMS vacío al sync |
| Snapshot committed con datos de dev | `source` en JSON + review en PR; prod sync desde URL de staging |
| Árbol vacío si CMS KO y snapshot corrupto | Log claro; home sigue sin 500 (spec app-shell); mega-menú vacío visible para ops |
| Productos sin slug de familia | PLP familia vacía con empty state existente; PIM asigna categoría leaf |
| Breaking dev sin seed | README: seed CMS + sync antes de `dev:storefront` |

## Migration Plan

1. Implementar snapshot + resolver runtime; generar JSON inicial con CMS seedeado.
2. Cambiar glyphs y eliminar mapas estáticos.
3. Añadir ruta familia + actualizar MegaMenu/MobileNav.
4. Extender seed CMS; re-seed entornos locales.
5. Actualizar tests (`navigation-tree.test.ts`, breadcrumbs 3 segmentos).
6. Archivar cambio y sync specs.

**Rollback:** revert commit; restaurar fallback estático (no deseado a largo plazo).

## Open Questions

- ¿Commit obligatorio del snapshot en cada PR que toque taxonomía CMS? → **Recomendado sí** en este cambio.
- ¿Timeout CMS live 3 s suficiente en Vercel → CMS interno? → Ajustable vía env `CMS_FETCH_TIMEOUT_MS`.
