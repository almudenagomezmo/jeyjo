## Why

Los cambios #9 (`storefront-shell-navigation`) y #10 (`plp-faceted-listing`) dejaron la ruta `/` como **placeholder de fundación** (`apps/storefront/src/app/page.tsx`) sin catálogo, carruseles ni mensaje segmentado B2C/B2B. El ROADMAP marca #15 como siguiente paso natural tras PLP: el alcance §1.6 exige una home con selector de segmento, banners promocionales con ventana temporal, top ventas diferenciados, categorías destacadas y carruseles de producto — pieza clave de conversión y coherencia con **US-02** (precio dual en tarjetas). Sin esta home no se cumple la promesa visual del prototipo `jeyjo-next` ni se puede validar merchandising antes de búsqueda predictiva (#14) o carrito (#12).

## What Changes

- **Sustituir placeholder** por home segmentada portada desde `especificaciones_inicio/diseño/jeyjo-next` (hero + buscador, tarjetas B2C/B2B, rejilla de categorías, carruseles, franja de confianza).
- **Selector de segmento en home:** control visible B2C / B2B alineado al `PriceModeToggle` de cabecera (cookie/local hasta auth real #16); el contenido merchandising y los carruseles respetan el segmento activo.
- **CMS merchandising:** global Payload `home` (o equivalente) con banners promocionales (imagen, enlace, segmento, `startAt`/`endAt`), categorías destacadas (relación a `categories`), y listas curadas de productos por carrusel (top ventas B2C, top ventas B2B, eco/sostenibilidad).
- **Carruseles con catálogo real:** `ProductGrid` / tarjetas alimentadas desde CMS + `POST /api/pricing/batch` y stock batch existentes (**RF-011**, **US-02**); sin `lib/data/products.ts`.
- **Banners con vigencia:** solo se muestran si `now` ∈ [`startAt`, `endAt`] y segmento coincide; orden por `sortOrder`.
- **Categorías destacadas:** raíces publicadas desde árbol CMS (#9), con glyph/icono y enlace `/c/[slug]`.
- **Degradación controlada:** si CMS falla, home renderiza secciones estáticas mínimas (hero + segment cards) y oculta carruseles vacíos; cabecera sigue con fallback de navegación.

## Capabilities

### New Capabilities

- `storefront-home-segmented`: Página de inicio segmentada B2C/B2B, carruseles de producto, categorías destacadas y consumo de configuración merchandising.
- `cms-home-merchandising`: Modelo Payload (global `home`) para banners temporales, secciones curadas y categorías destacadas editables por área personalización.

### Modified Capabilities

- `storefront-app-shell`: Sustituir requisito de “placeholder home sin catálogo” por home segmentada con degradación si CMS no responde.
- `storefront-catalog-read`: Consultas de productos por lista de SKUs/slugs curados para carruseles de home y filtro de publicación.
- `storefront-price-resolution`: Escenario de precios batch en carruseles de home (mismo contrato que PLP, SKUs de página home).

## Impact

- `apps/storefront`: `src/app/page.tsx`, nuevos componentes `home/*`, `src/lib/home/fetch-home.ts`, reutilización `ProductGrid`, `SearchBar`, pricing/stock batch.
- `apps/cms`: global `Home` (o colección dedicada), hooks de validación de fechas, permisos área personalización; seed opcional.
- Paquetes: `@jeyjo/pricing`, lectura catálogo/stock existente.
- Depende de ROADMAP #9, #10 (completados). Alineado a alcance §1.6, **US-02**, base **RF-011**.
- Desbloquea validación UX previa a #12 (carrito), #14 (búsqueda predictiva en hero), #39 (newsletter).

## Non-Goals

- Búsqueda predictiva &lt;150 ms, Qdrant, worker `search_events` (#13–14; hero mantiene `SearchBar` actual).
- Auth B2B automática y detección de grupo por sesión (#16); segmento home = toggle manual/cookie.
- Top ventas calculadas desde ERP/OMS en tiempo real (v1: curación manual en CMS; métricas ERP en #30).
- EVA en hero, widget flotante, pie omnicanal (#32, #40).
- Newsletter, cupones, portes (#12, #17, #31).
- Imágenes dual-source PIM completas (#21); placeholders/glyph hasta enriquecimiento.
- Edición visual page-builder de bloques Payload en storefront (el CMS del equipo Jeyjo no se expone como web pública en v1).
