## Context

- **Estado actual:** `#16` entregó `(b2b)/intranet/layout.tsx` con menú estático de 9 enlaces, guards (`getCustomerContext`, `isB2bValidated`), cabecera empresa (nombre + CIF), banner MFA y catch-all `[...section]/page.tsx` con card “Próximamente”. El root layout monta siempre `TopBar`, `NavigationShell` (Header completo + Footer) y `MiniCart` — el portal B2B comparte el shell de tienda pública.
- **Pricing:** `#6` + `#16` ya resuelven P2 para B2B validado en APIs y cabecera (`sessionPriceMode`, `priceModeLocked`). Falta indicador dedicado en shell intranet y coherencia en widgets del portal.
- **Alcance:** **US-07** CA2 (menú completo navegable), CA4/CA5 (ya cubiertos por guards), **RF-011** en contexto portal. CA3 (MFA challenge) fuera de scope.
- **Dependencias ROADMAP:** `#16`, `#6` (completados). Bloquea `#23`–`#28`, `#41`.

## Goals / Non-Goals

**Goals:**

- Shell portal dedicado en `/intranet/*` sin mega-menú ni footer de tienda; barra superior mínima con logo, “Volver a la tienda”, indicador RF-011, cuenta y logout.
- Árbol de rutas explícitas App Router con layouts anidados (`contabilidad/layout.tsx` + subrutas scaffold).
- Componentes reutilizables: `IntranetNav`, `IntranetSubNav`, `IntranetBreadcrumb`, `PortalSectionScaffold`, `IntranetDashboard`.
- Config central `lib/intranet/navigation.ts` (labels US-07, hrefs, `roadmapChange` id para scaffolds).
- Navegación activa vía `usePathname` en cliente o `pathname` prop desde layout server.
- Dashboard con tarjetas de acceso rápido a cada sección y metadata empresa (`customer_group` legible).
- Eliminar catch-all `[...section]`; redirects 308 de rutas legacy si existían bookmarks incorrectos.

**Non-Goals:**

- Fetch ERP, PDFs, listados reales (#23–#28, #37, #41).
- Permisos por subusuario RF-003 (#26).
- MFA TOTP pre-intranet (US-07 CA3).
- Nuevo CMS collection o migraciones Supabase.
- Rediseño visual fuera de tokens `globals.css`.

## Decisions

### 1. Modo portal en NavigationShell vía header de middleware

**Decisión:** Extender `middleware.ts` para rutas `/intranet/:path*` y setear request header interno `x-jeyjo-portal: 1` (Next.js `request.headers` forward). `NavigationShell` lee el header y, en modo portal, renderiza `PortalTopBar` en lugar de `Header` + oculta `Footer`; `TopBar` de confianza también se oculta. `MiniCart` permanece montado (pedidos B2B salen del catálogo).

**Alternativa descartada:** Segundo `layout.tsx` root — reestructuración masiva de `(shop)`/`(account)`.

**Alternativa descartada:** CSS `display:none` sobre Header — mantiene DOM pesado y problemas de foco/a11y.

### 2. Estructura de rutas App Router

**Decisión:**

```
app/(b2b)/intranet/
  layout.tsx              # guards + grid nav/content (server)
  page.tsx                # dashboard
  mi-cuenta/page.tsx
  contabilidad/
    layout.tsx            # subnav Contabilidad
    page.tsx              # redirect → facturas
    facturas/page.tsx
    albaranes/page.tsx
    vencimientos/page.tsx
    cifra-347/page.tsx
    presupuestos/page.tsx
  pedidos/page.tsx
  pedido-rapido/page.tsx
  precios/page.tsx
  rma/page.tsx
  stock/page.tsx
  descargas/page.tsx
  contacto/page.tsx
```

Eliminar `[...section]/page.tsx`. Añadir `next.config` redirects opcionales solo si QA detecta URLs antiguas.

### 3. Config de navegación tipada

**Decisión:** `IntranetNavItem { href, label, children?, scaffold?: { title, description, roadmapRef } }` en `lib/intranet/navigation.ts`. Una sola fuente para menú lateral, dashboard quick links y metadata de scaffolds.

**Alternativa descartada:** Duplicar arrays en layout y páginas — deriva en #23+.

### 4. PortalSectionScaffold

**Decisión:** Componente server-friendly que recibe `title`, `description`, `roadmapChange` (ej. `#23 purchase-history-repeat`) y muestra empty state con icono, copy orientado al negocio y badge “Próximamente”. Sin llamadas API.

### 5. Navegación activa

**Decisión:** `IntranetNav` client component con `usePathname()`; item activo si `pathname === href` o `pathname.startsWith(href + '/')` (excepto `/intranet` exact match solo en dashboard). Subnav Contabilidad mismo patrón en `IntranetSubNav`.

### 6. Breadcrumbs intranet

**Decisión:** `IntranetBreadcrumb` construido en cada layout/página desde helper `buildIntranetBreadcrumbs(pathname, navConfig)` — trail: Portal → sección → subsección. No reutilizar breadcrumbs de catálogo `(shop)`.

### 7. PortalTopBar

**Decisión:** Barra sticky con: logo Jeyjo → `/`, enlace “Tienda”, indicador fijo “Precios sin IVA” (solo lectura, `priceModeLocked`), nombre empresa truncado, botón logout (`POST /api/auth/logout`). Sin `PriceModeToggle` interactivo.

### 8. Dashboard

**Decisión:** Grid de `Card` con enlace a cada sección principal + bloque resumen (nombre, CIF, grupo cliente mapeado a etiqueta legible “Empresa B2B / Colegios / Concursos”). Reutilizar MFA banner del layout o moverlo solo al dashboard — **mantener en layout** para visibilidad en todas las secciones.

### 9. Mi cuenta en menú vs ruta

**Decisión:** Primer ítem del menú US-07 “Mi cuenta” apunta a `/intranet/mi-cuenta` (perfil empresa scaffold, distinto de dashboard `/intranet`). Dashboard permanece landing post-login (#16 ya redirige a `/intranet`).

**Alternativa descartada:** Fusionar dashboard y mi-cuenta — rompe CA2 literal del menú.

## Risks / Trade-offs

- **[Doble shell transitorio]** Usuario ve flash de Header tienda si header middleware falla → Mitigation: matcher middleware estricto `/intranet` y test E2E.
- **[Menú completo sin permisos RF-003]** Subusuarios futuros verán enlaces bloqueados → Mitigation: spec documenta v1 full menu; #26 añadirá filtrado por `web_profiles.permissions`.
- **[Contabilidad scaffold genera expectativa]** Usuarios buscan facturas → Mitigation: copy explícito “disponible en fase documental (#37)” en scaffolds financieros.
- **[MiniCart en portal]** Puede distraer en flujos contables → Mitigation: aceptado; coherente con recompra desde tienda; ocultar en fase posterior si UX lo pide.

## Migration Plan

1. Implementar `PortalTopBar` + middleware header + condicional `NavigationShell`.
2. Añadir rutas explícitas y scaffolds; migrar contenido de catch-all.
3. Refactor `intranet/layout.tsx` a componentes; active nav.
4. Eliminar `[...section]`; verificar redirects login/post-login.
5. Actualizar tests de navegación y guards existentes.
6. Rollback: revertir commit; catch-all restaurable si necesario.

## Open Questions

- ¿Ocultar `MiniCart` en `/intranet/contabilidad/*`? **Default: no** (decisión conservadora).
- ¿Alias `/intranet/dashboard` → `/intranet`? **Opcional redirect 308** si se documenta en US-07.
