## Why

El cambio #16 (`auth-registration-area-cliente`) entregó login, guards y un **shell placeholder** en `/intranet` (menú estático, dashboard genérico, catch-all “Próximamente”). Eso cumple **RF-001** y **CA-AUTH-003**, pero **US-07 CA2** exige un portal con menú completo y secciones navegables, y el ROADMAP marca #22 como base obligatoria para histórico (#23), pedido rápido (#24), tarifas (#25), subusuarios (#26), RMA (#27), avisos (#28) y descargas (#41). Sin un **portal B2B productivo** — layout dedicado, rutas explícitas, dashboard y scaffolds por sección — cada feature posterior duplicaría navegación y rompería coherencia de **RF-011** (precios netos B2B) dentro del área privada.

## What Changes

- **Layout portal B2B dedicado:** route group `(b2b)` con shell propio (cabecera empresa, menú lateral, breadcrumbs intranet, enlace “Volver a la tienda”, logout) separado visualmente del shell público `(shop)` pero compartiendo design tokens.
- **Árbol de rutas US-07:** sustituir catch-all `[...section]` por rutas explícitas: `/intranet` (dashboard), `/intranet/mi-cuenta`, `/intranet/contabilidad/*` (submenú: facturas, albaranes, vencimientos, cifra-347, presupuestos — placeholders sin ERP), `/intranet/pedidos`, `/intranet/pedido-rapido`, `/intranet/precios`, `/intranet/rma`, `/intranet/stock`, `/intranet/descargas`, `/intranet/contacto`.
- **Dashboard B2B:** panel de bienvenida con accesos rápidos a secciones, resumen de empresa (nombre, CIF, grupo) y avisos no bloqueantes (MFA recomendado, mensajes vacíos orientados a cambios futuros).
- **Scaffolds de sección:** cada ruta muestra título, descripción funcional y estado “en construcción” alineado al cambio ROADMAP que la implementará; **sin** datos ERP ni documentos PDF.
- **Navegación activa y accesible:** estado activo en menú lateral y submenú Contabilidad; skip-link, landmarks ARIA y foco coherente (RNF-014).
- **Precios RF-011 en contexto portal:** indicador fijo “Precios sin IVA” en shell intranet; precios netos B2B en cualquier widget del portal que muestre importes (dashboard cards futuras, previews).
- **Integración cabecera tienda:** usuario B2B validado: icono “Mi cuenta” → `/intranet`; en rutas `/intranet/*` la cabecera global puede ocultarse o mostrar barra mínima de retorno a catálogo.

## Capabilities

### New Capabilities

- `storefront-b2b-portal-shell`: Layout productivo del portal B2B, dashboard, árbol de rutas US-07, subnavegación Contabilidad, breadcrumbs intranet, scaffolds de sección y accesos rápidos.

### Modified Capabilities

- `storefront-b2b-intranet-guard`: Actualizar requisitos del shell de “placeholder” a portal productivo con rutas explícitas; mantener guards B2C/pending/MFA banner.
- `storefront-shell-navigation`: Comportamiento de enlace cuenta y conmutación tienda ↔ intranet para sesión B2B validada.
- `storefront-price-resolution`: Presentación RF-011 obligatoria en contexto `/intranet/*` (modo neto B2B, sin toggle manual).

## Impact

- `apps/storefront`: refactor `app/(b2b)/intranet/**` (layouts anidados, páginas por sección, componentes `IntranetNav`, `IntranetHeader`, `PortalSectionScaffold`, `IntranetBreadcrumb`); ajustes `Header` / route groups para dual shell.
- Sin cambios CMS ni Supabase schema en este cambio (solo lectura `getCustomerContext()` existente).
- Desbloquea ROADMAP #23–#28, #41; depende de #16 (`auth-registration-area-cliente`) y #6 (`price-engine-core`, completados).
- Alineado a **US-07** (CA1, CA2, CA4, CA5), **RF-001**, **RF-011**; **CA3** (MFA obligatorio pre-acceso) sigue diferido — banner recomendación ya en #16.

## Non-Goals

- Datos ERP: histórico de pedidos (#23), pedido rápido Excel (#24), tarifas personalizadas (#25), subusuarios RF-003 (#26), RMA (#27), centro de avisos (#28), descargas catálogos (#41).
- Área documental y financiera: facturas, albaranes, vencimientos, 347, presupuestos con PDF (**#37**); submenú Contabilidad solo scaffold.
- MFA TOTP obligatorio o challenge pre-intranet (**US-07 CA3**); activación MFA B2B completa.
- Permisos granulares por subusuario (**RF-003**); todos los B2B validados ven el menú completo en v1.
- Checkout, OMS, notificaciones email, EVA widget en portal.
- Nuevo diseño visual fuera de tokens `globals.css` / patrones jeyjo-next.
