## Context

- **Estado actual:** Tras login MFA (#5), Payload muestra `BeforeDashboard` (template ecommerce: seed, Stripe, docs Payload). Existen vistas operativas aisladas (`OmsInboxView`, `PendingCustomersView`, `PimHealthView`, cola EVA) pero no hay landing con KPIs. Pedidos web persisten en Payload `orders` con `jeyjoStatus`, totales y `origin`. Sync catálogo escribe `erp_sync_runs` y `audit_log` en fallos (#7). Carrito storefront vive en Zustand + `localStorage` sin telemetría servidor. No hay GA4 (#34).
- **Arquitectura:** Patrón establecido `PimHealthView` + `GET /api/pim-health` (client fetch, credentials staff). Agregación en CMS con service role Supabase + REST Payload. EVA real llega en #32; pedidos `origin=eva` ya existen (#20).
- **Referencias:** **RF-026**, **US-19**, **CA-BACKEND-006** (roles), `erp_sync_runs` migration, `backoffice-eva-orders-queue`.

## Goals / Non-Goals

**Goals:**

- Landing `/admin` con KPIs de ventas, conversión, visitantes y carritos activos filtrables por periodo.
- Bandeja de alertas con tres fuentes: sync ERP fallido/reciente, Top Ventas con stock bajo, clientes `validated_at` NULL.
- Widget EVA stub: contador conversaciones activas (placeholder) + lista corta de pedidos EVA no validados / consultas sin resolver.
- Beacons storefront mínimos para métricas en tiempo casi real sin bloquear render.
- API única `GET /api/dashboard/summary` con respuesta tipada y tests del agregador.
- Acceso por rol: superadmin/administración (completo), mantenimiento (alertas técnicas), catálogo/personalización (sin cifras de ventas).

**Non-Goals:**

- GA4, Merchant feed, export informes, configuración UI de umbrales (#42), webhooks SKAI (#32), jobs Excel (#29), notificaciones email de alertas.

## Decisions

### 1. Reemplazar `BeforeDashboard` en lugar de nueva ruta

**Decisión:** Mantener `admin.components.beforeDashboard` apuntando a `DashboardKpisView`; no registrar otra `views.*` salvo que el sidebar necesite enlace "Dashboard" explícito (redundante con home admin).

**Rationale:** US-19 pide visibilidad "nada más entrar"; `beforeDashboard` es el hook nativo de Payload para contenido sobre el dashboard por defecto.

**Alternativa descartada:** Solo custom view `/admin/kpis` — el staff seguiría viendo template hasta navegar manualmente.

### 2. API agregada `GET /api/dashboard/summary`

**Decisión:** Un endpoint staff-autenticado con query `period` ∈ `today|yesterday|week|month|custom` y `from`/`to` ISO cuando `custom`. Respuesta JSON:

```ts
type DashboardSummary = {
  period: { from: string; to: string; label: string }
  sales: { orderCount: number; revenueCents: number; avgTicketCents: number }
  conversion: { uniqueVisitors: number; completedOrders: number; rate: number | null }
  realtime: { activeVisitors: number; activeCarts: number }
  recentOrders: Array<{ id; orderNumber; total; createdAt; origin; jeyjoStatus; customerLabel }>
  eva: { activeConversations: number; unresolvedQueries: EvaQueryStub[] }
  alerts: SystemAlert[]
  roleScope: 'full' | 'technical' | 'minimal'
}
```

Pedidos contabilizados: `jeyjoStatus` ∉ `cancelled` y `paymentStatus` ≠ `failed` (alineado OMS). Revenue desde campo total persistido en order.

**Rationale:** Una sola carga para el panel; cacheable 30–60 s en cliente; facilita tests unitarios del agregador puro.

**Alternativa descartada:** Múltiples endpoints por widget — más round-trips y duplicación de auth.

### 3. Beacons analíticos en Supabase (`storefront-analytics-sessions`)

**Decisión:** Migración con:

- `storefront_sessions` (`session_id` uuid cookie, `last_seen_at`, `first_seen_at`, `user_agent_hash` opcional)
- `storefront_cart_activity` (`session_id`, `line_count`, `total_qty`, `updated_at`)

Storefront: componente `AnalyticsBeacon` en root layout (client) que cada 45 s (visible tab) `POST /api/analytics/heartbeat` con `session_id` cookie HttpOnly 24 h y snapshot carrito desde `useCartStore`. Visitante único en periodo = `COUNT(DISTINCT session_id)` con `first_seen_at` en rango. Activo ahora = `last_seen_at > now() - 5 min`. Carrito activo = fila en `cart_activity` con `line_count > 0` y `updated_at > now() - 30 min`.

**Rationale:** Sin GA4 aún, US-19 exige visitantes y carritos; enfoque ligero y bajo PII (sin email en sesión anónima).

**Alternativa descartada:** Inferir visitantes solo desde `search_events` — no cubre navegación sin búsqueda.

### 4. Top Ventas con stock bajo

**Decisión:** Agregador consulta líneas de pedidos Payload últimos `TOP_SALES_WINDOW_DAYS` (default 30) agrupando por `skuErp`, ordena por unidades vendidas, toma top 10. Para cada SKU, lee stock disponible vía `StockSemaphoreResolver` / adaptador lectura (#8). Alerta si `available < LOW_STOCK_THRESHOLD` (default 5, env `DASHBOARD_LOW_STOCK_THRESHOLD`).

**Rationale:** RF-026 y criterio de verificación RF-026; reutiliza motor stock sin nuevo job.

**Alternativa descartada:** Flag manual "Top Venta" en producto — no existe en PIM v1.

### 5. Alertas de sincronización ERP

**Decisión:** Incluir alerta `severity: error` si último `erp_sync_runs.status` ∈ `failed|partial` en 24 h o si `audit_log` tiene `action = error_erp` en 24 h. Enlace a `/admin/pim-health` o log de sync documentado. Cuando #29 añada jobs Excel, extender fuente sin cambiar contrato `SystemAlert`.

**Rationale:** Datos ya persistidos (#7); Excel importer aún pendiente.

### 6. Clientes pendientes

**Decisión:** Reutilizar query de `PendingCustomersView`: `customers` donde `validated_at IS NULL`. Alerta `severity: warning` con count y enlace `/admin/pending-customers`.

**Rationale:** `cms-customer-validation-queue` ya implementado; evita duplicar lógica.

### 7. Widget EVA stub

**Decisión:** `activeConversations`: lectura tabla `eva_monitor_stub` (seed 0 en prod) o constante 0 hasta #32. `unresolvedQueries`: top 5 pedidos `origin=eva` AND `validatedEva=false` mostrados como "consulta pendiente validación" + placeholder array vacío para chat SKAI. UI etiqueta "Monitorización EVA (preview)".

**Rationale:** US-19 CA2 sin bloquear en API SKAI; la cola pedidos EVA ya aporta valor operativo.

**Alternativa descartada:** Ocultar widget hasta #32 — incumple US-19 CA2.

### 8. Control de acceso

**Decisión:** `hasStaffRole(['superadmin','administracion'])` → `roleScope: full`. `mantenimiento` → solo `alerts` filtradas técnicas (sync, sin ventas ni clientes). `catalogo|personalizacion` → `minimal`: mensaje bienvenida + alertas PIM/stock si aplica, sin revenue.

**Rationale:** RF-030 mínimo privilegio; US-19 actor es superadmin pero administración necesita mismos KPIs operativos.

### 9. UI y estilos

**Decisión:** SCSS en `DashboardKpisView` siguiendo patrón `PimHealthView`; tokens CSS variables del admin Payload (no importar `globals.css` storefront en CMS). Tarjetas KPI, tabla pedidos compacta, lista alertas con badge severidad. Selector periodo preset + date inputs para custom.

**Rationale:** Consistencia con vistas admin existentes; regla monorepo de tokens aplica a storefront, CMS admin usa tema Payload.

## Risks / Trade-offs

- **[Métricas de visitantes sin GA4]** → Beacons subestiman usuarios con cookies bloqueadas; documentar en UI "estimación interna" y reemplazar/ complementar en #34.
- **[Carga agregación Top Ventas]** → Limitar ventana 30 días y top 10 SKUs; cache respuesta 60 s; evitar N+1 stock con batch read.
- **[EVA stub confuso]** → Copy explícito "preview" y enlace a cola `/admin/oms/eva`.
- **[Carritos solo storefront con beacon]** → Carritos sin JS no cuentan; aceptable v1.
- **[Periodo custom timezone]** → Usar `Europe/Madrid` en agregador documentado en env `TZ`.

## Migration Plan

1. Aplicar migración Supabase `storefront_sessions` + `storefront_cart_activity` (RLS: insert/update anon vía API route con rate limit; read service_role only).
2. Desplegar storefront con `AnalyticsBeacon` (feature flag `ANALYTICS_BEACONS_ENABLED`, default true en prod).
3. Desplegar CMS con nuevo endpoint y componente; verificar roles en staging.
4. Rollback: flag off beacons; revert `beforeDashboard` al componente anterior vía config.

## Open Questions

1. ¿Umbral stock bajo uniforme (5) o por familia? → Default 5 en env; #42 añadirá UI.
2. ¿Incluir pedidos `pending_payment` en revenue del día? → Sí si `jeyjoStatus` no cancelled (negocio cuenta intención de compra); documentar en spec.
