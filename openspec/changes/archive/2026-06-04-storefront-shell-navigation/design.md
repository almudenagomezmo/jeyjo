## Context

- **Estado actual:** `apps/storefront` tiene `TopBar`, `Header` (sticky), `MegaMenu`, `Footer`, `MiniCart` y `SearchBar` con datos demo (`CATEGORIES`, `searchProducts`). Rutas `/c/[category]/[sub]`, `/p/[id]`, `/search`, `/cuenta`, `/cart` existen pero comparten un único `layout.tsx` sin grupos. Tras #7, productos y precios leen Payload; categorías Payload (`categories` con `parent`, `sortOrder`, `slug`, `read: () => true`) no alimentan aún la UI.
- **Alcance:** §1.2 cabecera + mega-menú, §1.3 mini-carrito (ya presente), §1.4 top bar, §1.12 pie (estructura, no EVA).
- **Dependencias ROADMAP:** #1 (tokens/shell), #7 (CMS catálogo). Bloquea #10, #14, #15.

## Goals / Non-Goals

**Goals:**

- Servidor: `getNavigationTree()` desde Payload REST (`CMS_URL`, sin secret en cliente) con `unstable_cache` (TTL 300s).
- Jerarquía de 3 niveles: raíz (`parent` null) → hijo → nieto; URLs `/c/{rootSlug}`, `/c/{rootSlug}/{childSlug}`; nivel 3 como enlaces en panel mega-menú hacia sub-rutas o anclas PLP futuras.
- Componentes cliente `MegaMenu` / `MobileNav` reciben árbol serializado desde layout server wrapper.
- Route groups `(shop)` y `(account)` sin romper URLs actuales.
- Breadcrumbs en páginas de catálogo derivados del árbol + slug de ruta.
- Top bar desde `src/config/top-bar-messages.ts` (tipado, i18n-ready).
- Accesibilidad: skip link, `aria-expanded`, foco atrapado en drawer móvil, Escape cierra overlays.

**Non-Goals:**

- Qdrant, US-01 predictivo (#14), indexación (#13).
- Gestión de menú 100 % CMS/backoffice UI (#42).
- Auth B2B auto en toggle precios (#16).
- PLP facetada (#10).

## Decisions

### 1. Lectura de categorías: Payload REST público + cache

**Decisión:** `fetchCategoriesFromCms()` en `apps/storefront/src/lib/catalog/fetch-navigation-tree.ts` usa `GET ${CMS_URL}/api/categories?depth=1&limit=500&sort=sortOrder` (sin auth; colección ya permite read público). Normaliza a `NavNode { id, title, slug, children, glyph? }`.

**Alternativa descartada:** Duplicar taxonomía en Supabase — segunda fuente de verdad.

**Fallback:** Si fetch falla o lista vacía, usar `CATEGORIES` estático actual y registrar `console.warn` en servidor (degradación RNF-007).

### 2. Construcción del árbol en servidor

**Decisión:** Algoritmo O(n): indexar por id, enlazar `parent`, ordenar hijos por `sortOrder`, limitar profundidad a 3. Exponer solo nodos con slug válido.

**Glyph:** Mapeo opcional `slug → ProductGlyph kind` en config local hasta campo CMS dedicado (#21 PIM).

### 3. Inyección en shell sin client fetch

**Decisión:** Nuevo `NavigationProvider` server component en root layout que pasa `tree` como prop a `Header` (client). Evita waterfall y mantiene secretos fuera del bundle.

**Alternativa:** SWR en cliente — expone endpoint y peor LCP.

### 4. Route groups App Router

**Decisión:**

```
src/app/
  layout.tsx          # shell global (TopBar, Header, Footer, MiniCart)
  (shop)/layout.tsx   # opcional: max-width container para catálogo
  (shop)/c/...
  (shop)/search/...
  (account)/layout.tsx # título "Mi cuenta", nav lateral placeholder
  (account)/cuenta/...
```

Mover rutas existentes bajo grupos **sin** cambiar paths públicos (los grupos `(name)` no aparecen en URL).

### 5. Mega-menú desktop vs MobileNav

**Decisión:** Desktop mantiene panel absoluto bajo header (click en "Categorías"); tablet/móvil usa botón hamburguesa + drawer `fixed` derecha con misma lista. Un solo estado `navOpen` en `ui-store` o estado local Header.

**Hover:** Opcional en `lg+` abrir mega-menú al hover del botón Categorías (mejora UX §1.2); click sigue funcionando en touch.

### 6. Breadcrumbs

**Decisión:** `Breadcrumb` server-friendly: página pasa `segments: { label, href }[]` construidos con helper `buildBreadcrumbsFromPath(tree, pathname)`. Home siempre primer crumb.

### 7. Top bar configurable (fase estática)

**Decisión:** Array tipado en `top-bar-messages.ts`; componente `TopBar` sin cambios de API visual. Contrato documentado para futura colección `site-settings` en Payload.

### 8. Footer

**Decisión:** Columna "Catálogo" = raíces del árbol CMS; columnas ayuda/comprar = enlaces a rutas existentes (`/cuenta`, `/search`, `#` solo donde no hay página). Sin widget EVA.

## Risks / Trade-offs

- **[Risk] CMS caído deja menú vacío** → Mitigation: fallback estático + home/carrito operativos.
- **[Risk] Categorías ERP no sincronizadas aún** → Mitigation: staff crea jerarquía manual en Payload; seed opcional en apply task.
- **[Risk] Profundidad >3 en CMS** → Mitigation: truncar en build con warning en dev.
- **[Trade-off] Top bar no editable sin deploy** → Aceptado en #9; #42 añadirá CMS.

## Migration Plan

1. Implementar fetch + fallback; tests unitarios del builder de árbol.
2. Refactor layouts/route groups (mover archivos, verificar links internos).
3. Actualizar `MegaMenu`, añadir `MobileNav`, wire breadcrumbs en `/c/*` y `/p/*`.
4. Verificar `pnpm --filter storefront build` y pruebas manuales responsive.
5. Rollback: revertir a `CATEGORIES` estático eliminando fetch (fallback ya lo cubre).

## Open Questions

- ¿Seed de categorías Payload alineado a demo `CATEGORIES` en apply? **Recomendación:** sí, script o migración de datos en tarea 1.x para QA coherente.
- ¿Nivel 3 (familia) como tercer segmento URL `/c/a/b/f` o solo en mega-menú? **Decisión provisional:** solo en mega-menú hasta #10 PLP; rutas actuales `/c/[category]/[sub]` se mantienen.
