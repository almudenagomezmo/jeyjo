## Why

El cambio #1 (`foundation-monorepo-design-system`) dejó un **shell visual** con categorías demo en `lib/data/categories.ts`, mega-menú solo en desktop y enlaces de pie sin rutas reales. Tras #7 (`catalog-sync-read-stub`), el catálogo y las categorías viven en Payload, pero la navegación global **no refleja** esa taxonomía ni cumple el alcance §1.2–4 (cabecera sticky multinivel, top bar, mini-carrito integrado en el flujo de rutas). Sin este cambio (#9 del ROADMAP) no se puede desbloquear PLP facetada (#10), home segmentada (#15) ni búsqueda predictiva UI (#14), que dependen de un armazón de rutas y navegación coherente (**US-01** parcial: barra de búsqueda en cabecera; el desplegable &lt;150 ms queda en #14).

## What Changes

- **Árbol de navegación desde CMS:** servidor en storefront que lee categorías publicadas de Payload (`parent`, `sortOrder`, `slug`) y construye jerarquía Categoría → Subcategoría → Familia (tres niveles máx.); fallback controlado a taxonomía estática si CMS no responde.
- **Mega-menú y drawer móvil:** mismo árbol en panel desktop (hover/click) y menú hamburguesa en &lt;md con foco, Escape y overlay; rutas `/c/[category]/[sub]` alineadas a slugs CMS.
- **Grupos de rutas App Router:** layouts `(shop)` para catálogo/búsqueda y `(account)` para área cliente (`/cuenta`, placeholders futuros), compartiendo root shell sin duplicar Header/Footer.
- **Cabecera sticky productiva:** estados activos en enlaces, skip-link “Ir al contenido”, badge carrito e icono cuenta; toggle P1/P2 manual hasta sesión B2B (#16).
- **Top bar:** mensajes de confianza desde configuración estática versionada (JSON/env) con contrato para CMS configurable en cambio posterior; no bloquea #9.
- **Breadcrumbs:** componente reutilizable en rutas de catálogo (`/c/...`, `/p/...`, `/search`) con jerarquía derivada del árbol CMS.
- **Pie de página:** columnas enlazadas a rutas reales del storefront y categorías raíz CMS; placeholders legales/EVA sin widget flotante (#40).
- **Búsqueda en cabecera:** mantener `SearchBar` actual (cliente, datos demo) con ruta `/search`; **no** implementar Qdrant ni CA de US-01 (#13–14).

## Capabilities

### New Capabilities

- `storefront-shell-navigation`: Navegación global (árbol CMS, mega-menú, móvil, breadcrumbs, route groups, top bar estática, footer enlazado) y requisitos de accesibilidad WCAG 2.1 AA en shell.

### Modified Capabilities

- `storefront-app-shell`: Ampliar requisitos del shell desde “placeholder sin catálogo” a navegación productiva con datos CMS y layouts segmentados.

## Impact

- `apps/storefront`: `src/lib/catalog/` (fetch categorías), layouts `(shop)`/`(account)`, refactor `Header`, `MegaMenu`, nuevo `MobileNav`, `Breadcrumb` wiring, `TopBar` config, `Footer` enlaces.
- `apps/cms`: sin cambios de schema; categorías ya existen (`categories` con `parent`).
- Desbloquea ROADMAP #10 (`plp-faceted-listing`), #14 (`predictive-search-ui`), #15 (`home-segmented-banners`), #39 (`newsletter-subscription`).
- Depende de #1 y #7 (completados). Alineado a alcance §1.2–4, **RF-010** (base navegación categorías), **RNF-014** (accesibilidad shell).

## Non-Goals

- Búsqueda predictiva &lt;150 ms, Qdrant, worker `search_events` (#13–14, **US-01** completo).
- PLP facetada, filtros, comparativa (#10, #38).
- Home segmentada B2C/B2B y banners (#15).
- Top bar y mega-menú **100 % editables** desde backoffice sin deploy (#42 o extensión PIM).
- Widget EVA flotante y pie omnicanal completo (#40).
- Autenticación y detección automática B2B en cabecera (#16).
- Mini-carrito: ya existe; solo integración de rutas/checkout placeholder (#12).
