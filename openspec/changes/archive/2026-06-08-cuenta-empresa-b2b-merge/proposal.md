## Why

El portal B2B vive hoy en `/intranet` como un área separada de `/cuenta`, lo que fragmenta la experiencia del cliente: dos URLs, dos sidebars, duplicados (avisos de stock, pedidos) y un login que redirige a rutas distintas según el grupo. Los usuarios B2B deben gestionar su cuenta personal y sus herramientas profesionales en un único espacio `/cuenta`, con una segunda sección de menú "Empresa" para las capacidades B2B (US-07, RF-001).

## What Changes

- **BREAKING**: Eliminar `/intranet` como área pública; todas las rutas B2B pasan a `/cuenta/empresa/*`.
- **Sidebar unificado** en `/cuenta`: sección "Personal" (existente) + sección "Empresa" (solo B2B validado, filtrada por permisos RF-003).
- **Redirects 308** desde `/intranet` y `/intranet/*` hacia las rutas equivalentes en `/cuenta/empresa/*`.
- **Login B2B** redirige a `/cuenta` (no `/intranet`); dashboard unificado con cards B2B cuando aplique.
- **Portal shell** (cabecera simplificada, "Precios sin IVA", NotificationBell) se activa en rutas `/cuenta/empresa/*` vía portal-mode header.
- **Consolidar duplicados**: una sola ruta de avisos de stock (`/cuenta/avisos-stock`); histórico B2B en `/cuenta/empresa/pedidos`; preferencias de notificación en `/cuenta/empresa/preferencias` o integradas en sección empresa.
- **Actualizar** middleware, guards, permisos, breadcrumbs, navegación global, emails CMS y specs afectados.
- APIs internas `/api/intranet/*` se mantienen sin renombrar en v1 (menor riesgo).

## Capabilities

### New Capabilities

- `storefront-cuenta-empresa-nav`: Sidebar de dos secciones (Personal + Empresa), mapa de rutas `/cuenta/empresa/*`, portal shell en sección empresa, redirects desde `/intranet`.

### Modified Capabilities

- `storefront-customer-auth`: Login B2B y subusuario redirigen a `/cuenta`; emails y `loginRedirectPath` actualizados.
- `storefront-b2b-intranet-guard`: Guards y permisos aplicados a `/cuenta/empresa/*` en lugar de `/intranet/*`.
- `storefront-shell-navigation`: Enlace "Mi cuenta" para B2B apunta a `/cuenta`; portal-mode en `/cuenta/empresa/*`.
- `cms-customer-validation-queue`: Links de email post-validación apuntan a `/cuenta` para todos los grupos.

## Impact

- `apps/storefront`: mover `app/(b2b)/intranet/**` → `app/(account)/cuenta/empresa/**`; refactor `AccountSidebar`, `navigation.ts`, `permissions.ts`, `middleware.ts`, `redirect.ts`, `NavigationShell`, componentes intranet (breadcrumbs, nav-active).
- Sin cambios de schema Supabase ni CMS en este cambio.
- Specs delta en auth, intranet-guard, shell-navigation, customer-validation-queue.
- Compatibilidad: redirects permanentes desde `/intranet/*` para bookmarks y emails legacy.

## Non-Goals

- Renombrar rutas API `/api/intranet/*` a `/api/cuenta/empresa/*`.
- MFA obligatorio pre-acceso (sigue diferido).
- Cambios en lógica ERP, contabilidad, pedido rápido u otras features B2B (solo reubicación de rutas y navegación).
- Eliminar componentes `intranet/` del filesystem (se reutilizan; solo cambian hrefs y guards).
