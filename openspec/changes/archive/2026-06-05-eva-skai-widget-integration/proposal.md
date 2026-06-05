## Why

La tienda y el portal B2B ya exponen mensajes de marketing sobre EVA, pero **no existe integración real con SKAI**: el dashboard muestra un panel EVA en modo preview (#30) y la bandeja OMS ya acepta pedidos `origin=eva` (#20), sin canal de entrada desde el asistente. **RI-005**, **US-22** y **US-20** exigen el widget flotante en storefront e intranet, inyección segura de contexto de cliente autenticado y recepción de pedidos autónomos para validación humana. Es el cambio **#32** del ROADMAP; dependencias #9 (shell), #16 (auth) y #20 (OMS) están completadas.

## What Changes

- **Widget EVA en storefront:** botón flotante persistente en todas las páginas públicas e intranet B2B, cargando el script/widget SKAI con contexto de página (producto, categoría) y fallback de indisponibilidad — **US-22** CA1–CA4, **RI-005**.
- **API de contexto segura:** endpoints servidor en storefront/CMS que exponen a SKAI solo datos permitidos según sesión: anónimo → catálogo público; autenticado → perfil, historial de compras y precios resueltos del cliente — **RI-005** seguridad, **US-20** CA3.
- **Adaptador SKAI con modo stub:** registro `SKAI_ADAPTER=stub|live` (patrón ERP) para desarrollo sin sandbox y conexión REST cuando existan credenciales — **RI-005**.
- **Webhook de pedidos EVA:** endpoint autenticado que crea pedidos Payload con `origin=eva`, `validatedEva=false`, líneas y cliente; alimenta la cola existente — **RI-005**, **CA-BACKEND-003**.
- **Configuración SKAI en backoffice:** vista staff "Configuración SKAI" con credenciales, horarios/mensajes de desvío, subida de PDFs de conocimiento (si la API lo permite), panel de prueba y métricas básicas — **US-20** CA1–CA4.
- **Dashboard EVA en vivo:** sustituir contador stub y etiqueta preview por métricas SKAI (conversaciones activas, consultas no resueltas) cuando `SKAI_ADAPTER=live` — **US-19** CA2.
- **Variables de entorno, tests y documentación** para integración y checklist manual US-22 / US-20.

## Capabilities

### New Capabilities

- `storefront-eva-widget`: Widget flotante SKAI en tienda pública e intranet, inyección de contexto de página y manejo de errores de disponibilidad (**US-22**, alcance §1.12 widget).
- `skai-eva-integration`: Adaptador bidireccional SKAI (stub/live), endpoints de contexto, webhook de pedidos y reglas de aislamiento de datos por sesión (**RI-005**).
- `backoffice-skai-config`: Vista admin de configuración SKAI, prueba de conocimiento y métricas de conversación (**US-20**).

### Modified Capabilities

- `backoffice-kpi-dashboard`: Panel EVA consume datos live de SKAI cuando está configurado; retira modo preview por defecto.

## Impact

- `apps/storefront/src/components/eva/` — componente cliente del widget y montaje en `layout.tsx` + layout intranet.
- `apps/storefront/src/app/api/eva/` — token/contexto de sesión hacia SKAI (sin secretos en cliente).
- `apps/cms/src/eva/` o `apps/cms/src/skai/` — adaptador, webhook `POST /api/eva/orders`, cliente HTTP SKAI.
- `apps/cms/src/components/SkaiConfigView/` — UI configuración; registro en `payload.config.ts`.
- `apps/cms/src/lib/dashboard/eva-panel.ts` — lectura métricas live vs stub.
- Colección Payload `orders` (sin cambio de esquema; uso de campos EVA existentes), lecturas `erp-purchase-history-reader` / pricing para contexto autenticado.
- Nuevas env: `SKAI_ADAPTER`, `SKAI_API_URL`, `SKAI_API_KEY`, `SKAI_WIDGET_ID`, `SKAI_WEBHOOK_SECRET`, horarios/contacto fallback.
- Cumple **RI-005**, **US-20**, **US-22**; desbloquea **#40** (footer omnicanal completo) y búsqueda por voz post-EVA; alinea con cola **backoffice-eva-orders-queue** existente.
- Dependencias satisfechas: **#9** shell, **#16** auth/sesión, **#20** OMS/cola EVA, **#23** historial compras para contexto.

## Non-Goals

- **Desarrollo del modelo IA de EVA** — responsabilidad SKAI; solo integración API.
- **Búsqueda por voz** en el buscador predictivo — mejora posterior explícita en US-01.
- **Pedidos autónomos vía WhatsApp/email** fuera del widget web — canal SKAI externo; este cambio cubre webhook REST documentado.
- **Footer omnicanal completo** (#40) — horarios/teléfonos en footer; aquí solo fallback en widget y config SKAI.
- **Configuración global del sistema** (#42) — solo sección SKAI, no el panel de settings unificado.
- **Notificación a SKAI al rechazar pedido EVA** — mejora futura si SKAI expone callback; la cola y rechazo local ya existen (#20).
