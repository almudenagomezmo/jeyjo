## Context

El portal B2B se construyó en el cambio `portal-b2b-shell` bajo `app/(b2b)/intranet/**` con shell dedicado (`PortalTopBar`, `IntranetNav`, portal-mode header). El área `/cuenta` sirve B2C y clientes pendientes con `AccountSidebar` plano. Tras #49 existe duplicación de avisos de stock. El usuario quiere unificar todo en `/cuenta` con sección "Empresa" bajo prefijo `/cuenta/empresa/*` (opción A).

## Goals / Non-Goals

**Goals:**
- Una sola URL raíz de área cliente: `/cuenta`
- Sidebar con dos bloques: Personal (todos) y Empresa (B2B validado, filtrado por permisos)
- Rutas B2B en `/cuenta/empresa/*` con portal shell (cabecera simplificada, RF-011)
- Redirects 308 desde `/intranet/*`
- Login B2B → `/cuenta`

**Non-Goals:**
- Renombrar APIs `/api/intranet/*`
- Cambiar lógica de negocio ERP/contabilidad/RMA
- Renombrar carpeta `components/intranet/` (reutilización interna)

## Decisions

### 1. Mapa de rutas

| Legacy `/intranet` | Nueva ruta |
|--------------------|------------|
| `/intranet` | `/cuenta` (dashboard unificado) |
| `/intranet/mi-cuenta` | `/cuenta/empresa/preferencias` |
| `/intranet/contabilidad/*` | `/cuenta/empresa/contabilidad/*` |
| `/intranet/pedidos` | `/cuenta/empresa/pedidos` |
| `/intranet/pedido-rapido` | `/cuenta/empresa/pedido-rapido` |
| `/intranet/precios` | `/cuenta/empresa/precios` |
| `/intranet/rma` | `/cuenta/empresa/rma` |
| `/intranet/stock` | `/cuenta/avisos-stock` |
| `/intranet/descargas` | `/cuenta/empresa/descargas` |
| `/intranet/contacto` | `/cuenta/empresa/contacto` |

### 2. Layout anidado

- `cuenta/layout.tsx`: grid con sidebar unificado (`AccountSidebar` ampliado).
- `cuenta/empresa/layout.tsx`: hereda sidebar; añade breadcrumb empresa, subnav contabilidad, MFA banner, `EvaWidgetShell`.
- Portal-mode (`x-jeyjo-portal` header) se activa en middleware para `/cuenta/empresa/*`.

### 3. Redirects

Middleware responde 308 para cualquier `/intranet` y `/intranet/*` antes de auth checks de intranet legacy.

### 4. Navegación global

`accountHref` siempre `/cuenta` para sesiones autenticadas (B2B y B2C).

### 5. Permisos

`permissions.ts` actualiza prefijos de `/intranet` a `/cuenta/empresa`. `guardIntranetPage` renombrado conceptualmente a `guardEmpresaPage` (misma lógica).

## Risks / Trade-offs

- **[Risk] Bookmarks y emails con `/intranet`** → Mitigation: redirects 308 permanentes en middleware.
- **[Risk] Tests/e2e con rutas antiguas** → Mitigation: buscar y actualizar referencias en tests.
- **[Risk] Layout doble (cuenta + empresa)** → Mitigation: empresa layout solo añade chrome B2B, no segundo sidebar.

## Migration Plan

1. Actualizar constantes de navegación y permisos.
2. Mover páginas a `cuenta/empresa/`.
3. Unificar sidebar y layouts.
4. Actualizar middleware, redirects, shell navigation.
5. Eliminar layout intranet legacy; mantener route group `(b2b)` vacío o eliminar.
6. Verificar build storefront.

## Open Questions

Ninguna bloqueante — decisiones cerradas en opción A.
