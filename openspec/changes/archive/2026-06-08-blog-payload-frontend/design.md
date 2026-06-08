## Context

- **Estado actual:** No existen colecciones `blog-posts` ni `blog-categories` en Payload. El storefront no tiene rutas `/blog`. El footer (#40) ya incluye enlace condicional a `/blog` vía `footerSettings.blogEnabled` (default `false`). Patrones reutilizables: colección `site-pages` con Lexical + API pública `GET /api/site-pages/[slug]` + render `SitePageContent` en storefront; audit hooks; staff roles por colección.
- **Requisito de negocio:** Alcance **§1.13** y **US-24** — blog unificado en Payload con categorías, etiquetas, autor, SEO y programación; frontend integrado en jeyjo.es con mismo diseño que el resto de la web.
- **Referencias:** `site-pages`, `fetch-site-page.ts`, `lexical-to-html.ts`, `staffRoles.ts`, `FooterSettings.blogEnabled`.

## Goals / Non-Goals

**Goals:**

- Módulo Blog en Payload (posts + categorías) editable por `personalizacion` / `marketing`.
- API pública CMS para listado y detalle con reglas de visibilidad (publicado + fecha).
- Storefront `/blog` (índice paginado) y `/blog/[slug]` (detalle) dentro del shell `(shop)`.
- Seed dev y tests de filtrado/programación.

**Non-Goals:**

- Migración WordPress, Qdrant index, RSS, comentarios, blog intranet B2B, páginas de autor, auditor SEO (#43).

## Decisions

### 1. Dos colecciones Payload (`blog-categories`, `blog-posts`)

**Decisión:** Taxonomía en colección dedicada `blog-categories`; posts referencian una categoría obligatoria. Etiquetas como campo `tags` (array de texto, normalizado lowercase en hook).

**Rationale:** Categorías administrables con slug estable para filtros URL (`/blog?categoria=material-oficina`); tags sin CRUD extra cumple US-24 CA2 sin sobreingeniería.

**Alternativa descartada:** Categorías como select estático — no escalable para staff.

### 2. Editor Lexical alineado con `site-pages`

**Decisión:** Campo `content` tipo `richText` (Lexical) con features: bold, italic, underline, lists, links, upload image, headings h2/h3. Sin bloques custom en v1.

**Rationale:** Reutiliza configuración Payload existente y `lexicalToSanitizedHtml` del storefront (**US-24 CA1**).

**Alternativa descartada:** Markdown — inconsistente con legal/FAQ ya en Lexical.

### 3. Programación vía `publishedAt` + `published`

**Decisión:** Post visible públicamente solo si `published === true` AND `publishedAt <= now` (ISO datetime, evaluado server-side). Hook `beforeValidate`: si `published` true y `publishedAt` vacío, default `now`.

**Rationale:** **US-24 CA3** sin estado enum extra; staff puede dejar borrador (`published: false`) o programar futuro (`published: true`, `publishedAt` futuro).

**Alternativa descartada:** Solo checkbox `published` — no soporta programación.

### 4. API pública en CMS (no REST Payload directo desde browser)

**Decisión:** Rutas Next en CMS `app/(app)/api/blog/posts/route.ts` y `.../[slug]/route.ts`:

- Listado: query params `page`, `limit` (max 24), `category` (slug), `tag`
- Respuesta DTO plano: slug, title, excerpt, publishedAt, category { slug, name }, featuredImageUrl, tags, authorName
- Detalle: body Lexical JSON + metaDescription + SEO fields
- `Cache-Control: public, max-age=60, stale-while-revalidate=300` (mismo patrón `site-pages`)
- Sin API key en storefront fetch (endpoints públicos read-only)

**Rationale:** Control estricto de visibilidad; DTO estable; no exponer Payload REST anónimo.

**Alternativa descartada:** `fetch` directo a `/api/blog-posts` Payload — requeriría access rules públicas más amplias y filtrado inconsistente.

### 5. Storefront fetch con `unstable_cache`

**Decisión:** `lib/blog/fetch-posts.ts` y `fetch-post.ts` análogos a `fetch-site-page.ts`, base URL `CMS_INTERNAL_URL` / `CMS_URL`, revalidate 300s, tags `['blog-posts']` / `['blog-post', slug]`.

**Rationale:** ISR-friendly; coherente con legal pages.

### 6. UI blog en grupo de rutas `(shop)`

**Decisión:**

- `/blog` — `Container`, título "Blog", grid responsive (1/2/3 cols), cards con imagen 16:9, categoría badge, fecha formateada `es-ES`, excerpt, link a detalle.
- `/blog/[slug]` — hero imagen, H1, byline (autor + fecha + categoría), `SitePageContent`, breadcrumbs Home → Blog → título.
- Filtro categoría vía search param; paginación con `?page=2`.
- Tokens Tailwind existentes (`text-ink`, `text-brand`, `prose`).

**Rationale:** **US-24 CA4** — mismo shell Header/Footer que catálogo.

### 7. Campos SEO y autor

**Decisión:** `metaDescription` (textarea), `authorName` (text, required, default "Equipo Jeyjo"), `featuredImage` (upload → media, required when published). `excerpt` opcional; si vacío, derivar en DTO mapper de plain text del body (max 160 chars).

**Rationale:** Alcance §1.13 menciona autor y SEO por artículo; byline sin página de autor en v1.

### 8. Acceso staff y audit

**Decisión:** Registrar `blog-posts` y `blog-categories` en `COLLECTION_ACCESS` para `superadmin`, `personalizacion`, `marketing`. Audit hooks `createAuditHooks` en ambas. Admin group "Blog" (posts) y "Blog" sublabel categorías.

**Rationale:** RF staff areas — personalización incluye blog (#5 backoffice roles design).

### 9. Seed de desarrollo

**Decisión:** `endpoints/seed/blog-posts.ts` invocado desde seed existente:

- Categorías: "Material de oficina", "Consejos B2B"
- Posts: 1 publicado, 1 borrador, 1 programado (+7 días)
- Imágenes placeholder vía media seed o URL estática dev

**Rationale:** Validación manual US-24 y tests API.

### 10. Slug único y validación

**Decisión:** `slugField({ fieldToUse: 'title' })` en posts y categorías; hook impide slug duplicado en posts. URLs canónicas `/blog/{postSlug}`.

## Risks / Trade-offs

- **[404 footer si staff activa blog antes de deploy]** → Mitigación: `blogEnabled` default false; documentar en hub activar tras #33.
- **[Contenido Lexical XSS]** → Mitigación: reutilizar `lexicalToSanitizedHtml` con sanitización existente.
- **[Posts programados visibles en admin REST]** → Mitigación: API custom filtra; no abrir access público Payload.
- **[Sin migración WordPress]** → Contenido legacy permanece en WP hasta decisión Dirección; aceptado non-goal.
- **[Imágenes inline en Lexical URLs absolutas]** → Mitigación: mapper resuelve media URLs como PDP/site-pages.

## Migration Plan

1. Desplegar CMS con migración DB + colecciones (sin posts publicados en prod).
2. Desplegar storefront con rutas `/blog` (empty state amigable si CMS vacío).
3. Staff crea categorías y primer artículo en staging; smoke test listado + detalle + SEO meta.
4. Activar `footerSettings.blogEnabled` en producción cuando haya ≥1 post publicado.
5. **Rollback:** desactivar `blogEnabled`; revertir rutas storefront (404 blog); colección CMS inofensiva.

## Open Questions

1. ¿Dirección confirma solo artículos futuros vs. script migración WP? (Fuera de v1; no bloquea implementación.)
2. ¿Marketing necesita orden manual de posts destacados en home del blog? (v1: orden por `publishedAt` desc; campo `featured` boolean opcional si UAT lo pide.)
