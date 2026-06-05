## Context

- **Estado actual:** Storefront referencia EVA en `TrustStrip`, `top-bar-messages` y copy de marketing, pero no monta widget SKAI. Dashboard (#30) expone `buildEvaPanel` con `activeConversations: 0` fijo y lista de pedidos EVA pendientes de validación. OMS y cola `Pedidos IA` (#20) ya persisten `origin=eva`, `validatedEva`, `evaRejectionReason`. Auth Supabase (#16) y portal B2B (#22) proveen sesión de cliente; historial de compras (#23) y motor de precios (#6) resuelven contexto B2B. No hay módulo `MOD-10` implementado.
- **Arquitectura objetivo (MOD-10):** Widget en frontend Next.js; SKAI consume contexto vía API Jeyjo; pedidos autónomos entran por webhook al CMS/Payload. Patrón establecido: adaptadores con `stub|live` (ERP #4, stock #8), endpoints staff en CMS, proxies storefront con secretos solo en servidor.
- **Referencias:** **RI-005**, **US-20**, **US-22**, **US-19** CA2, `backoffice-eva-orders-queue`, `erp/registry.ts`.

## Goals / Non-Goals

**Goals:**

- Widget flotante SKAI en layout raíz storefront e intranet con contexto de página (SKU, nombre producto, URL).
- Token de contexto de corta duración emitido por servidor; SKAI nunca recibe `SUPABASE_SERVICE_ROLE_KEY` ni datos de otro cliente.
- Adaptador `SkaiEvaAdapter` con implementaciones `stub` (fixtures locales) y `live` (REST SKAI).
- Webhook firmado `POST /api/eva/orders` en CMS que crea pedidos en cola EVA.
- Vista admin "Configuración SKAI" (superadmin) y panel EVA del dashboard con métricas live cuando adapter ≠ stub.
- Degradación elegante: mensaje RI-005 + contacto omnicanal configurable si SKAI no responde.

**Non-Goals:**

- Búsqueda por voz, WhatsApp/email channels, entrenamiento del modelo, footer completo (#40), notificación SKAI al rechazar pedido, GA4 (#34).

## Decisions

### 1. Paquete adaptador en CMS (`apps/cms/src/eva/`)

**Decisión:** Módulo `eva/registry.ts` análogo a `erp/registry.ts`:

```ts
type SkaiAdapterKind = 'stub' | 'live'

type SkaiEvaAdapter = {
  kind: SkaiAdapterKind
  getWidgetConfig(): SkaiWidgetConfig | null
  getConversationMetrics(): SkaiMetrics
  uploadKnowledgeDocument(file: Buffer, meta): Promise<void>  // no-op en stub
  validateConnection(): Promise<SkaiHealth>
}
```

`SKAI_ADAPTER` default `stub` en development; `live` exige `SKAI_API_URL`, `SKAI_API_KEY`, `SKAI_WIDGET_ID`.

**Rationale:** Desarrollo y CI sin dependencia del sandbox SKAI; contrato estable para UI y tests.

**Alternativa descartada:** Lógica SKAI solo en storefront — el webhook de pedidos y config admin pertenecen al CMS (MOD-02).

### 2. Widget: script SKAI + launcher propio

**Decisión:** Componente cliente `EvaWidgetLauncher` en `apps/storefront/src/components/eva/`:

1. `GET /api/eva/bootstrap` (storefront route) devuelve `{ enabled, widgetId, contextToken, fallbackContact }`.
2. Si `enabled`, carga script externo SKAI (URL desde env `SKAI_WIDGET_SCRIPT_URL` o derivada de API docs) con `data-widget-id` y `data-context-token`.
3. Botón flotante fijo (esquina inferior derecha) usa tokens `--color-primary` / sombras de `globals.css`; z-index por encima del minicart.
4. Montaje en `app/layout.tsx` y `app/intranet/layout.tsx` (o wrapper intranet existente).

Contexto de página en bootstrap: `pathname`, `productSku`/`productName` si PDP (server lee params o header `x-pathname`).

**Rationale:** US-22 CA1 exige visibilidad global; launcher propio controla fallback y estilos Jeyjo.

**Alternativa descartada:** iframe embebido sin script — menos integración con contexto dinámico SKAI.

### 3. Token de contexto firmado (JWT corto)

**Decisión:** Storefront `POST /api/eva/context-token` (o incluido en bootstrap) genera JWT HS256 15 min con claims:

```ts
type EvaContextClaims = {
  sub: string | 'anonymous'
  channel: 'storefront' | 'intranet'
  page: { path: string; productSku?: string }
  // Sin PII en claim para anónimos
}
```

SKAI llama `GET /api/eva/context` en CMS (o storefront proxy) con `Authorization: Bearer <contextToken>`. El handler valida JWT, resuelve sesión Supabase si `sub !== anonymous`, y devuelve payload acotado:

| Sesión | Datos expuestos |
|--------|-----------------|
| Anónimo | Producto consultado (público), stock semáforo general, condiciones envío genéricas, FAQs |
| B2C/B2B autenticado | Perfil comercial, últimos N pedidos (#23), precios resueltos del cliente (#6), sin datos de otros clientes |

**Rationale:** RI-005 y US-20 CA3 — el contexto se inyecta solo con sesión verificada en servidor.

**Alternativa descartada:** Pasar `customerId` en query al widget — expuesto en cliente.

### 4. Webhook de pedidos EVA en CMS

**Decisión:** `POST /api/eva/orders` en Payload app:

- Auth: header `X-Skai-Signature` HMAC-SHA256 del body con `SKAI_WEBHOOK_SECRET`.
- Body normalizado `SkaiOrderPayload` (orderNumber externo, customerRef, lines[], notes).
- Crea documento `orders` con `origin: 'eva'`, `validatedEva: false`, `jeyjoStatus: 'pending_confirmation'`, líneas con snapshot IVA (#17), `orderNumber` prefijo `EVA-`.
- Idempotencia: clave `skaiExternalId` en campo meta o `orderNumber` único — rechaza duplicado 200 OK.
- Respuesta 201 con `id` admin URL.

**Rationale:** RI-005 datos recibidos; reutiliza cola y CA-BACKEND-003 sin nuevo esquema.

**Alternativa descartada:** SKAI escribe directo en Payload API — requiere credenciales staff en tercero.

### 5. Configuración SKAI en backoffice

**Decisión:** Global Payload `skaiSettings` (similar `paymentSettings`) o colección singleton `eva-config`:

- Campos: `enabled`, horarios atención (JSON), mensaje fuera de horario, teléfono/WhatsApp/email fallback, última sync métricas.
- PDFs: upload a Supabase Storage + registro en adapter `uploadKnowledgeDocument` cuando live.
- Vista custom `SkaiConfigView` en `/admin/skai-config` (solo `superadmin`).
- Panel "Probar EVA": iframe o embed del widget con token staff de prueba (sin datos de cliente real).

Métricas US-20 CA4: adapter `getConversationMetrics()` → conversaciones último mes + top preguntas no resueltas (stub devuelve fixtures).

**Rationale:** US-20 centraliza operación; evita hardcodear contacto en componente widget.

**Alternativa descartada:** Solo variables `.env` — no cumple CA1 (horarios/PDF desde UI).

### 6. Dashboard EVA live

**Decisión:** Extender `buildEvaPanel`:

- Si `SKAI_ADAPTER=live` y health OK → `activeConversations` y `unresolvedQueries` desde `getConversationMetrics()` (SKAI API).
- Siempre fusionar pedidos EVA pendientes locales (comportamiento actual).
- Quitar etiqueta "preview" cuando live configurado; mantenerla en stub.

**Rationale:** US-19 CA2; cambio mínimo en agregador existente.

### 7. Manejo de errores y disponibilidad

**Decisión:**

- Timeout SKAI 5 s en llamadas servidor; widget muestra banner con texto RI-005 y `fallbackContact` de settings.
- `EVA_WIDGET_ENABLED=false` deshabilita montaje (feature flag).
- Rate limit en `context-token` y webhook (patrón `analytics/heartbeat`).

**Rationale:** RI-005 gestión de errores explícita.

## Risks / Trade-offs

- **[API SKAI no finalizada]** → Adaptador con interfaces propias + stub; documentar mapping en `docs/skai-integration.md`; campos env placeholder hasta contrato SKAI.
- **[Latencia contexto > 3 s US-22 CA2]** → Cache 60 s de catálogo público en token bootstrap; SKAI responsable del tiempo de respuesta IA.
- **[Fuga datos entre clientes]** → Tests de integración: dos sesiones distintas no ven historial cruzado; code review obligatorio en `resolveEvaContext`.
- **[Webhook spoofing]** → HMAC secret + idempotencia; rechazo 401 sin firma válida.
- **[PDF knowledge solo en SKAI]** → Upload vía API si existe; si no, UI guarda en Storage y alerta "pendiente sync manual" en stub.

## Migration Plan

1. Desplegar CMS con webhook y adapter stub (sin impacto en producción si `EVA_WIDGET_ENABLED=false`).
2. Añadir env SKAI en staging; validar widget + webhook con pedido fixture SKAI.
3. Activar `EVA_WIDGET_ENABLED=true` en storefront tras smoke test US-22.
4. Configurar `SKAI_ADAPTER=live` y credenciales en producción.
5. **Rollback:** `EVA_WIDGET_ENABLED=false` oculta widget; `SKAI_ADAPTER=stub` restaura dashboard preview; pedidos EVA ya creados permanecen en OMS.

## Open Questions

1. ¿URL exacta del script widget y endpoints REST de SKAI? (pendiente documentación sandbox — usar placeholders en adapter live).
2. ¿SKAI soporta subida PDF vía API o solo portal SKAI? (decidir en implementación según respuesta del proveedor).
3. ¿Callback SKAI al rechazar pedido EVA es requisito contractual? (fuera de scope v1; registrar en backlog).
