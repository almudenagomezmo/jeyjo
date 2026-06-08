## Why

El blog corporativo de jeyjo.es sigue en **WordPress separado**, duplicando mantenimiento editorial y rompiendo la experiencia unificada descrita en **US-24** y alcance **§1.13**. Tras **#3** (Payload bootstrap) y **#9** (shell storefront), el equipo puede publicar catálogo, legal y marketing desde un solo CMS, pero no hay módulo Blog ni rutas `/blog` — el footer (#40) ya prepara un enlace condicional que hoy llevaría a 404. Es el cambio **#33** del ROADMAP; dependencias **#3** y **#9** completadas.

## What Changes

- **Colección Payload `blog-posts`:** artículos con editor Lexical enriquecido (negrita, listas, imágenes inline, H2/H3), título, slug, categoría, etiquetas, imagen destacada (`media`), meta description, autor visible, estado publicación y **fecha de publicación programable** (**US-24 CA1–CA3**).
- **Colección Payload `blog-categories`:** taxonomía editorial (nombre, slug, descripción opcional) referenciada por posts.
- **Acceso staff:** rol `personalizacion` y `marketing` (lectura/escritura); audit log en altas/ediciones/bajas; grupo admin "Contenido" / "Blog".
- **API pública CMS:** `GET /api/blog/posts` (listado paginado, filtros categoría/etiqueta) y `GET /api/blog/posts/[slug]` (detalle) con posts visibles solo si `published: true` y `publishedAt ≤ now`.
- **Storefront `/blog`:** índice con grid de artículos (destacada, categoría, fecha, extracto), paginación y filtros por categoría; diseño alineado con shell jeyjo-next (**US-24 CA4**).
- **Storefront `/blog/[slug]`:** detalle con imagen hero, metadatos, contenido Lexical renderizado (reutilizando pipeline `SitePageContent` / `lexicalToSanitizedHtml`), breadcrumbs y SEO por artículo.
- **Seed de desarrollo:** al menos 2 categorías, 3 posts (uno programado futuro, uno publicado, uno borrador) para validar visibilidad.
- **Tests:** unit (filtro programación, DTO mapping), integración API CMS + rutas storefront, checklist manual US-24.

## Capabilities

### New Capabilities

- `payload-blog-posts-collection`: Colección Payload de artículos con campos editoriales, imagen destacada, SEO, programación y acceso staff.
- `payload-blog-categories-collection`: Taxonomía de categorías del blog referenciada por posts.
- `cms-blog-public-api`: Endpoints REST públicos de listado y detalle con reglas de visibilidad y caché.
- `storefront-blog-pages`: Rutas `/blog` y `/blog/[slug]`, fetch CMS, layout shell, SEO y render Lexical.

### Modified Capabilities

<!-- Ninguno: el enlace condicional del footer ya está especificado en footer-eva; staff activa blogEnabled tras go-live de este cambio. -->

## Impact

- `apps/cms`: colecciones `BlogPosts`, `BlogCategories`, hooks audit, registro en `payload.config.ts`, migración DB, tipos generados, seed, rutas `app/(app)/api/blog/**`.
- `apps/cms/src/access/staffRoles.ts`: entradas `blog-posts` y `blog-categories` para roles `personalizacion` y `marketing`.
- `apps/storefront`: `app/(shop)/blog/**`, `lib/blog/**`, componentes listado/detalle, reutiliza `SitePageContent` / tokens prose.
- Operación: tras deploy, staff puede activar `footerSettings.blogEnabled` (#40) para mostrar enlace en pie.
- Cumple alcance **§1.13**, **US-24**; referencia **RF-080** (módulo blog) en dominio 05.
- Dependencias satisfechas: **#3** Payload collections, **#9** storefront shell.

## Non-Goals

- **Migración automática desde WordPress** — pendiente de decisión Dirección (nota US-24); v1 solo artículos nuevos en Payload; import manual/script fuera de alcance.
- **Etiquetas como colección separada con CRUD** — v1 campo `tags` array de texto normalizado; sin taxonomía de tags administrable.
- **Comentarios, likes o suscripción por artículo** — fuera de alcance.
- **Búsqueda semántica Qdrant de posts** — no indexar blog en v1 (colección Qdrant solo products/categories).
- **RSS/Atom feed, AMP, i18n multi-idioma** — iteración futura.
- **Autor como perfil público / página `/blog/autor/[slug]`** — v1 campo texto o relación staff solo para byline; sin archivo de autor.
- **Landing pages constructor** — explícitamente out of scope en alcance §matriz.
- **Blog en portal B2B `/intranet`** — contenido público B2C en `/blog` únicamente.
- **Cupones automáticos ligados a artículos** (#31) — sin deep-link cupón desde post en v1.
- **Auditor SEO técnico** (#43) — no incluir posts en auditor en este cambio.

## Assumptions

- Editor Lexical ya configurado en Payload (mismo que `site-pages`); features mínimas: bold, italic, lists, links, upload image, headings h2/h3.
- `publishedAt` datetime con timezone Europe/Madrid; post visible cuando `published === true` AND `publishedAt <= now()` (comparación server-side UTC normalizado).
- Slug único global por post; URLs canónicas `/blog/{slug}`.
- Listado ordenado por `publishedAt` descendente; paginación 12 posts/página.
- Extracto en listado: primeros ~160 caracteres del texto plano del body o campo `excerpt` opcional staff.
- Imagen destacada obligatoria en posts publicados (validación hook).
- Idioma UI y contenido seed: español.
