## Why

Tras completar roles/MFA (#5) y el dashboard KPI (#30), el backoffice Payload ya tiene módulos de configuración dispersos (`paymentSettings`, `marketingSettings`, `skaiSettings`, `analyticsSettings`) y varios parámetros operativos críticos siguen **hardcodeados en código o variables de entorno** (portes B2C/B2B, umbral stock bajo, ventana Top Ventas, staleness ERP). **Alcance §1.36** y **RF-013** exigen que el sistema sea operable sin tocar código; **RF-005** y **RF-026** requieren umbrales configurables desde el backend. Es el cambio **#42** del ROADMAP; dependencias **#5** y **#30** están completadas.

## What Changes

- **Global unificado `systemSettings` en Payload** con secciones tabuladas: pedidos/portes, productos/stock, clientes, contacto omnicanal, buscador, operaciones (dashboard/ERP) y enlaces a módulos existentes (pagos, marketing, SKAI, analytics, auditoría).
- **API pública de configuración operativa** `GET /api/system/config` (cacheable, sin secretos) consumida por storefront y workers para portes, umbral stock y flags de degradación.
- **Portes configurables (RF-013):** umbrales y costes B2C/B2B editables por superadmin/administración; checkout, carrito y EVA context leen la API en lugar de `SHIPPING_RULES` constantes.
- **Umbrales operativos centralizados:** stock bajo (semáforo RF-005), ventana Top Ventas y umbral alertas dashboard (#30), staleness catálogo/ERP (RNF-007) — con fallback a env documentado.
- **Contacto y tiendas:** teléfonos, emails y datos de tienda física reutilizables en footer, EVA fallback y plantillas; consolidar duplicados con `skaiSettings` donde aplique.
- **Hub de configuración en admin:** vista `/admin/system-config` accesible a `superadmin` y `mantenimiento` (lectura parcial para `administracion` en secciones de negocio); globals ocultos (`skaiSettings`, `analyticsSettings`) visibles desde el hub.
- **Auditoría:** cambios en `systemSettings` generan entradas `audit_log` vía hooks Payload existentes (#5).
- **Tests y documentación** para precedencia env vs CMS, API pública y checklist manual alcance §1.36.

## Capabilities

### New Capabilities

- `backoffice-system-settings`: Global Payload `systemSettings`, hub admin unificado, API pública de config operativa y hooks de auditoría (**Alcance §1.36**, **RF-013**, **RF-005**, **RF-026**).

### Modified Capabilities

- `storefront-checkout-shipping`: Portes y umbrales leídos desde `GET /api/system/config` con fallback a defaults v1 (39€/5€ B2C, 10€/2,50€ B2B).
- `storefront-cart-minicart`: Banner de envío gratis usa la misma fuente de reglas de portes.
- `stock-semaphore-resolver`: Umbral stock bajo desde `systemSettings` (precedencia sobre `STOCK_LOW_THRESHOLD` env).
- `backoffice-system-alerts`: Ventana Top Ventas y umbral stock bajo desde `systemSettings` en lugar de env exclusivo.
- `cms-app-bootstrap`: Documentar global `systemSettings`, hub `/admin/system-config` y precedencia env vs CMS.

## Impact

- `apps/cms/src/globals/SystemSettings.ts` (nuevo) y `apps/cms/src/components/SystemConfigHub/` (vista admin con tabs y deep links).
- `apps/cms/src/app/(app)/api/system/config/route.ts` — respuesta tipada cacheable (60 s).
- `apps/storefront/src/lib/system-config/` — fetch server-side con cache `unstable_cache` / revalidate.
- Sustitución de `SHIPPING_RULES` en `apps/storefront/src/lib/cart/shipping.ts` por resolución async/sync desde config.
- `apps/cms/src/lib/dashboard/top-sales.ts`, `apps/cms/src/stock/recalculateIndicators.ts`, `apps/storefront/src/lib/stock/get-stock-indicator.ts` — leer umbrales desde global.
- `apps/cms/src/eva/resolve-context.ts` — shipping policy desde config.
- Globals existentes: quitar `hidden: true` de SKAI/analytics o enlazarlos desde hub; evitar duplicar campos EVA contacto.
- Cumple **RF-013**, **RF-005**, **RF-026**, **Alcance §1.36**; cierra deuda explícita de **#30** (umbrales UI) y **#17** (portes configurables).
- Dependencias satisfechas: **#5** roles/audit, **#30** dashboard que consume umbrales.

## Non-Goals

- **Rotación de claves, WAF y TLS** — infraestructura Vercel/Supabase; solo documentación operativa en la sección seguridad del hub.
- **Editor visual de plantillas email** — fuera de alcance; se documentan variables y enlaces a templates existentes (#28).
- **Umbral stock por familia de producto** — v1 global único; per-familia queda como mejora posterior (nota RF-005).
- **Reconfiguración de Qdrant URL/API key** — siguen en env de despliegue; la UI expone toggles operativos (sugerencias activas, límite resultados) no credenciales.
- **Migrar lógica de cupones/marketing/pagos/SKAI/analytics** a `systemSettings` — permanecen en sus globals; el hub enlaza.
- **Configuración B2B subusuarios o aprobación de pedidos** — ya cubierta en cambios #16/#26.
- **Panel cliente o portal B2B** — solo backoffice staff.
