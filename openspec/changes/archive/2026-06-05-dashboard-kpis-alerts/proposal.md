## Why

Tras completar el OMS web (#20), la validación de clientes (#16) y la sincronización de catálogo (#7), el backoffice Payload sigue mostrando el **BeforeDashboard** del template ecommerce (seed, Stripe, enlaces genéricos) en lugar de visibilidad operativa del negocio. **RF-026** y **US-19** exigen que el superadministrador vea al entrar ventas, conversión, visitantes, pedidos recientes, carritos activos, monitorización EVA y alertas de sistema sin generar informes manuales. Es el cambio **#30** del ROADMAP; dependencias #5, #7 y #20 están completadas.

## What Changes

- **Dashboard principal del admin:** sustituir el bloque `BeforeDashboard` por un panel con KPIs de ventas (importe y número de pedidos, ticket medio, tasa de conversión), visitantes activos, últimos 5 pedidos y carritos activos, filtrables por rango de fechas (hoy, ayer, esta semana, este mes, personalizado) — **US-19 CA1, CA4**.
- **Monitorización EVA (stub):** recuadro con conversaciones activas y consultas no resueltas pendientes de atención humana, alimentado por datos locales hasta la integración SKAI (#32) — **US-19 CA2**.
- **Bandeja de alertas de sistema:** notificaciones visibles para errores de sincronización ERP/Excel, productos Top Ventas con stock bajo y registros de cliente pendientes de validar, con enlaces a acciones (cola clientes, salud PIM, último sync) — **US-19 CA3**, **RF-026**.
- **Beacons analíticos ligeros en storefront:** tabla Supabase y endpoint de heartbeat para contar visitantes únicos y carritos con actividad reciente (sin sustituir GA4 del cambio #34).
- **API agregada staff** `GET /api/dashboard/summary` con control de acceso por `staffRoles` (superadmin y administración: KPIs completos; mantenimiento: alertas técnicas; catálogo/personalización: vista reducida sin datos financieros).
- **Tests y documentación:** unitarios del agregador, integración con fixtures de pedidos/sync, checklist manual US-19.

## Capabilities

### New Capabilities

- `backoffice-kpi-dashboard`: Panel landing en `/admin` con tarjetas KPI, filtro de fechas, últimos pedidos y widget EVA stub (**RF-026**, **US-19** CA1/CA2/CA4).
- `backoffice-system-alerts`: Bandeja de alertas operativas (sync ERP, top ventas stock bajo, clientes pendientes) con severidad y deep links (**RF-026**, **US-19** CA3).
- `storefront-analytics-sessions`: Heartbeats de sesión y carrito en Supabase para visitantes activos, carritos activos y denominador de conversión (**RF-026**, preparación **#34**).

### Modified Capabilities

- `cms-app-bootstrap`: Documentar el dashboard KPI como landing del admin y retirar instrucciones del template Stripe/seed del componente por defecto.

## Impact

- `apps/cms/src/components/BeforeDashboard/` → reemplazo por `DashboardKpisView` (o equivalente) y estilos SCSS.
- `apps/cms/src/app/(app)/api/dashboard/summary/route.ts` (nuevo) y módulo `lib/dashboard/**` para agregación.
- `apps/storefront/src/lib/analytics/**` + componente cliente de heartbeat; migración Supabase `storefront_sessions` / `storefront_cart_activity`.
- Lecturas existentes: colección Payload `orders`, Supabase `customers` (pendientes), `erp_sync_runs`, stock vía adaptadores (#8), cola EVA (`origin=eva`, `validatedEva=false`).
- Cumple **RF-026**, **US-19**; desbloquea **#42** (`system-config-backoffice`, umbrales configurables); alinea con **#32** (EVA real) y **#34** (GA4).
- Dependencias satisfechas: **#5** roles/MFA, **#7** `erp_sync_runs`, **#20** OMS/pedidos.

## Non-Goals

- **Google Analytics 4** y eventos ecommerce en frontend (**#34**); los beacons son métricas internas mínimas para el dashboard.
- **Integración SKAI/EVA en vivo** (webhooks, conversaciones reales) — **#32**; el widget usa stub + cola pedidos EVA existente.
- **Importador/exportador Excel ERP** completo y alertas de jobs Excel (**#29**); alertas de sync cubren `erp_sync_runs` y `audit_log` `error_erp` ya disponibles.
- **Configuración UI de umbrales** (stock bajo, ventana Top Ventas) — **#42**; valores por defecto documentados en env.
- **Informes exportables PDF/Excel** desde el dashboard.
- **KPIs financieros en portal B2B** o área cliente; solo backoffice staff.
