## Why

El checkout (#17) y el OMS (#20) ya permiten tramitar pedidos B2C/B2B, pero el cupón en `/cart` y `/checkout` sigue siendo un **stub hardcodeado** (`DEMO_COUPONS` / `validateDemoCoupon`) que no cumple **RF-027** ni los criterios **CA-CHECKOUT-004/005**. El equipo Jeyjo no puede crear campañas (p. ej. `BLOG5`) ni recuperar carritos abandonados sin tocar código (**US-18**, **US-23**). Es el cambio **#31** del ROADMAP; dependencias #17 (checkout) y #20 (OMS) completadas. Sin persistencia server-side del carrito y un módulo marketing en Payload, no hay base para emails de recuperación (**RI-009**) ni para el KPI "carritos activos" del dashboard (#30).

## What Changes

- **Colección Payload `coupons`:** CRUD staff para cupones con código, tipo (`percent` | `fixed`), valor, mínimo de pedido, fechas inicio/fin, usos máximos, contador de usos, estado activo/inactivo (**US-18** CA1, CA4).
- **Colección Payload `marketing-settings` (global):** configuración de recuperación de carrito — delays 2h/24h (configurables), % descuento del segundo email, activación B2B por grupo de cliente, plantilla de cupón auto-generado para recovery (**US-23** CA2, CA4).
- **Motor de cupón en storefront:** API `POST /api/cart/coupon` y `POST /api/checkout/validate-coupon` que validan contra Payload/Supabase, respetan caducidad, usos, mínimo y **no acumulación sobre líneas en oferta** (`appliedRule = group_offer`) (**CA-CHECKOUT-004/005**, **US-18** CA3).
- **Totales checkout:** sustituir `validateDemoCoupon` por validación real; descuento por línea elegible (no oferta) para porcentaje; importe fijo prorrateado o cap al subtotal elegible.
- **Persistencia carrito server-side:** tabla Supabase `abandoned_cart_snapshots` por `web_profile` B2C con líneas, `last_activity_at`, estado (`active` | `converted` | `abandoned`), flags de emails enviados; sync desde storefront al mutar carrito (usuario autenticado B2C).
- **Job recuperación:** cron que detecta carritos inactivos >2h y >24h sin pedido, envía emails React Email + Resend (**RI-009**), segundo email incluye cupón único o cupón de campaña configurado; cancela segundo email si pedido completado (**US-23** CA1–CA3).
- **Enlace directo al carrito:** token firmado en email que restaura líneas en `jeyjo-cart` al abrir `/cart?recover=<token>`.
- **CMS UI marketing:** grupo admin "Marketing" con listado cupones, formulario creación/edición y panel configuración abandoned cart.
- **Registro de uso:** incrementar `usesCount` y asociar `couponCode` en `orders` al confirmar pedido (ya existe campo).
- **Tests:** unit (validación cupón, no acumulación, caducidad), integración (CA-CHECKOUT-004/005), job abandoned cart (fixtures Mailpit).

## Capabilities

### New Capabilities

- `payload-coupons-collection`: Colección Payload, access staff, hooks de auto-desactivación por fecha fin y validación de código único (**US-18**).
- `payload-marketing-settings`: Global de configuración abandoned cart y descuento recovery (**US-23** CA2, CA4).
- `coupon-validation-engine`: Validación server-side, elegibilidad por línea, integración con `buildCheckoutTotals` (**RF-027**, **CA-CHECKOUT-004/005**).
- `storefront-coupon-apply`: UI y APIs en `/cart` y `/checkout` para aplicar/quitar cupón real (**US-04** CA4).
- `abandoned-cart-persistence`: Snapshots Supabase + sync API storefront para perfiles B2C autenticados.
- `abandoned-cart-recovery-emails`: Plantillas, cron 2h/24h, cupón en segundo email, cancelación si convertido (**US-23**, **RI-009**).
- `cms-marketing-admin-ui`: Navegación y vistas staff en Payload para cupones y settings.

### Modified Capabilities

- `storefront-cart-minicart`: Sustituir validación demo de cupón por API real; persistir código aplicado vía `sessionStorage` hacia checkout.
- `storefront-checkout-shipping`: Totales y prepare/place-order usan motor de cupón real; aviso cuando cupón no aplica sobre artículos en oferta.
- `pricing-engine`: Documentar extensión: cupón de checkout es capa adicional post-`resolvePrice`, excluye líneas con `appliedRule = group_offer` del subtotal elegible (sin cambiar cadena RF-007).
- `payload-order-collection`: Incrementar `usesCount` del cupón al crear pedido confirmado con `couponCode` válido.

## Impact

- `apps/cms`: colecciones `Coupons`, global `MarketingSettings`, grupo admin Marketing, emails abandoned cart en `lib/emails/`.
- `apps/storefront`: `lib/coupon/**`, APIs cart sync y coupon, `buildCheckoutTotals`, componentes `/cart` y checkout, cron route `GET /api/cron/abandoned-cart`.
- `supabase/migrations`: `abandoned_cart_snapshots`, opcional `coupon_redemptions` para idempotencia.
- `packages/pricing` o `apps/storefront/lib/checkout`: helper `eligibleSubtotalForCoupon(lines, quotes)`.
- Infra: Vercel cron (cada 15 min staging); Resend/Mailpit existente (#5, #28).
- Cumple **RF-027**, **US-18**, **US-23**, **CA-CHECKOUT-004/005**, **RI-009**; alimenta KPI carritos activos (#30).
- Dependencias satisfechas: **#17** checkout, **#20** OMS, **#6** price engine (no acumulación), **#16** auth B2C.

## Non-Goals

- **Reglas de precio por categoría/fabricante/atributo** del párrafo amplio de RF-027 — ya cubiertas por `pricing-engine` / ofertas de grupo (#6); este cambio solo cupones de código en checkout.
- **Cupones automáticos sin código** (auto-apply por URL/blog); v1 requiere introducir código en `/cart` o checkout.
- **Dashboard KPIs y bandeja alertas** (#30); solo se persisten snapshots para conteo posterior.
- **Notificaciones in-app B2C** de carrito abandonado; solo email (**RI-009**).
- **Carritos anónimos/guest** para recovery; v1 solo **cliente B2C registrado** con email (**US-23** CA1).
- **Recuperación B2B activa por defecto**; configurable por grupo, desactivada globalmente en v1 salvo flag explícito (**US-23** CA4).
- **Integración con Payload `carts` del plugin ecommerce** (USD demo seed); usar modelo Supabase propio alineado con `jeyjo-cart` storefront.
- **Google Analytics / GMC** (#34), **newsletter** (#39).
- **Multi-cupón** o acumulación cupón + oferta en la misma línea.

## Assumptions

- Porcentaje del segundo email de recovery: **10%** por defecto en `marketing-settings` hasta confirmación de Dirección (nota abierta en US-23); editable en CMS sin deploy.
- Delays por defecto: **2 horas** y **24 horas** desde `last_activity_at`; configurables en minutos en global settings.
- Cupón recovery: sistema genera código único `RECOVER-{shortId}` con un solo uso y validez 7 días, o reutiliza cupón de campaña fijo si staff lo configura.
- `last_activity_at` se actualiza en cada mutación de carrito (add/setQty/remove) vía debounced API para usuarios B2C logueados.
- Idioma emails: español; asunto primer email exacto **"Tienes artículos esperándote en Jeyjo"** (**US-23** CA1).
