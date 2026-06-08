## Why

La ficha de producto y el listado ya muestran estrellas y contador de valoraciones, pero los datos son placeholders (`rating: 4.5` fijo en PLP, `null` en PDP). No existe forma de que clientes autenticados dejen reseñas ni de que el equipo Jeyjo las modere desde el CMS. Las valoraciones verificadas aumentan confianza en la compra (US-03, RF-012) y habilitan ordenación real por rating en PLP (RF-010).

## What Changes

- **Nueva colección Payload `product-reviews`:** reseñas con estrellas (1–5), comentario, autor (nombre personal), producto, cliente, y ciclo de vida `pending` → `approved` / `rejected`.
- **Moderación obligatoria:** ninguna reseña es pública hasta que staff la apruebe en CMS.
- **Solo clientes logueados** pueden crear o editar su reseña desde el storefront.
- **Compra verificada:** solo quien ha comprado el SKU (pedidos web confirmados + historial ERP, misma ventana que `purchase-history`) puede valorar.
- **Una reseña por usuario y producto;** edición permitida pero vuelve a `pending` y deja de ser pública hasta re-aprobación.
- **Agregados denormalizados en `products`:** `reviewCount` y `ratingAverage` recalculados al aprobar/rechazar/editar.
- **Storefront PDP:** pestaña "Valoraciones" con listado público y formulario de envío/edición.
- **Storefront PLP/PDP:** sustituir placeholders por agregados reales; ocultar estrellas si `reviewCount === 0`.
- **Bandeja CMS** para moderar reseñas pendientes (filtros por estado, aprobar/rechazar).

## Capabilities

### New Capabilities

- `payload-product-reviews-collection`: Colección Payload, access control (storefront API key para create/update autor; staff sin create manual), hooks de agregados en productos, migración y auditoría.
- `storefront-product-reviews`: API routes, verificación de compra, formulario PDP, listado de reseñas aprobadas, estados para el autor (pending/rejected).
- `backoffice-product-reviews-moderation`: Vista o bandeja CMS para staff con listado, filtros y acciones de moderación.

### Modified Capabilities

- `storefront-pdp-product-detail`: Pestaña valoraciones, formulario logueado, estrellas desde agregados reales.
- `storefront-catalog-read`: `rating` y `reviews` desde campos denormalizados del producto; eliminar hardcode PLP.

## Impact

- `apps/cms`: colección `product-reviews`, campos `reviewCount`/`ratingAverage` en `products`, migración Payload, `payload.config`, staff roles visibility, audit hooks.
- `apps/storefront`: API `/api/products/[slug]/reviews`, componentes PDP, `fetch-product-list.ts`, `fetch-product-pdp.ts`, tipos PLP/PDP, tests.
- Depende de: auth de clientes (#16), pedidos web (#20), historial de compras (#23), PDP (#11), PLP (#10).
- Sin cambios ERP write, sin reseñas anónimas, sin respuesta oficial de Jeyjo en v1.

## Non-Goals

- Reseñas anónimas o sin sesión Supabase.
- Creación manual de reseñas por staff (importación, seed de valoraciones ficticias).
- Respuesta oficial de Jeyjo a reseñas, reportar abuso, notificaciones email al aprobar.
- Rich snippets `aggregateRating` en JSON-LD (evaluable en cambio SEO posterior).
- Páginas dedicadas de reseñas o moderación automática sin staff.
- Reseñas en productos wildcard o no publicados.
