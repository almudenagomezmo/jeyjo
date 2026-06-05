## Context

- **Estado actual:** Wishlist en `apps/storefront/src/lib/store/wishlist-store.ts` — Zustand + `persist` en localStorage (`jeyjo-wishlist`); corazón en `ProductCard` y `ProductBuyBox` por SKU. `/intranet/stock` es scaffold (`IntranetScaffoldPage`). Stock sync (#8) actualiza `stockIndicator` vía `runStockSync()` cada ≤15 min; semáforo resuelto por `resolveStockIndicator` sin cantidades públicas. Notificaciones (#28): `dispatchNotification` por `customer_id` a todos los perfiles B2B; tipos `invoice_new`, `order_status`, `quote_*`; preferencias tres canales; campana en `PortalTopBar`.
- **Requisitos:** Alcance §1.21, **RF-022** (extensión wishlist), **US-07 CA2** (sección Avisos de stock), **US-21** (preferencias canal), **RF-005** (semáforo), **RI-009** (email).
- **Dependencias:** #8 stock sync, #16 auth/`web_profiles`, #28 notificaciones.

## Goals / Non-Goals

**Goals:**

- Tabla `stock_watches` en Supabase con RLS por `web_profile_id`.
- APIs storefront para sync wishlist autenticada y listado intranet.
- Detección post-sync de transición `limited → available|low` y despacho `stock_available` por perfil.
- Página `/intranet/stock` operativa; cuarta categoría en preferencias.
- Email transaccional y notificación in-app reutilizando campana existente.
- Merge localStorage → servidor al login B2B validado.

**Non-Goals:**

- Campana/notificaciones B2C en `/cuenta`; avisos anónimos por email; alertas empresa-wide; re-alertas en cada sync; cantidades numéricas; backoffice KPI watches.

## Decisions

### 1. Tabla `stock_watches`

**Decisión:**

```text
stock_watches (
  id uuid PK DEFAULT gen_random_uuid(),
  web_profile_id uuid NOT NULL FK → web_profiles(id) ON DELETE CASCADE,
  sku text NOT NULL,
  product_title text,              -- denormalized at watch time
  last_indicator text,             -- 'limited' | 'available' | 'low' — último conocido
  last_notified_at timestamptz,    -- null hasta primer aviso
  created_at timestamptz DEFAULT now(),
  UNIQUE (web_profile_id, sku)
)
```

RLS: `SELECT/INSERT/DELETE` solo `web_profile_id = auth.uid()` vía join `web_profiles.user_id = auth.uid()`. Updates de `last_indicator` / `last_notified_at` solo `service_role` (job CMS).

Índice: `(sku)` para el job de avisos.

**Alternativa descartada:** Payload collection — datos de cliente, no staff; Realtime y RLS ya en Supabase (#28).

### 2. APIs storefront wishlist

**Decisión:**

| Endpoint | Auth | Comportamiento |
|----------|------|----------------|
| `GET /api/wishlist` | Sesión cualquier `web_profile` activo | Devuelve `{ skus: string[] }` del perfil |
| `PUT /api/wishlist` | Idem | Body `{ skus: string[] }` — replace union (sync bulk tras merge login) |
| `POST /api/wishlist` | Idem | Body `{ sku, productTitle? }` — upsert watch |
| `DELETE /api/wishlist?sku=` | Idem | Quita watch |
| `GET /api/intranet/stock-watches` | B2B validado | Lista watches con `stockIndicator` actual (fetch Payload por SKU batch) |

`wishlist-store.ts` mantiene localStorage para UX offline/anónimo; hook `useWishlistSync` en layout autenticado: al hidratar, `GET` servidor + merge → `PUT` si difiere; cada `toggle` llama `POST`/`DELETE` si hay sesión.

**Alternativa descartada:** Solo servidor sin localStorage — peor UX en catálogo público antes de login.

### 3. Despacho por perfil (`dispatchProfileNotification`)

**Decisión:** Nueva función en `apps/cms/src/lib/notifications/dispatch-profile.ts` (y reexport en storefront si el job vive allí):

```ts
dispatchProfileNotification(payload, {
  webProfileId: string,
  customerId: string,  // denormalized
  type: 'stock_available',
  title, body, payload, idempotencyKey,
})
```

- Lee preferencias del perfil único; `channelFieldForType('stock_available')` → `wishlist_channel`.
- No itera todos los perfiles de la empresa (diferencia clave vs pedidos/facturas).
- `dispatchNotification` existente sin cambios de firma para eventos empresa.

Migración `notification_preferences`: columna `wishlist_channel text DEFAULT 'email'`.

**Alternativa descartada:** Reutilizar `dispatchNotification` con filtro — mezcla semántica empresa vs personal.

### 4. Job post-sync (`processWishlistStockAlerts`)

**Decisión:** Módulo `apps/cms/src/lib/notifications/wishlist-stock-alerts.ts` invocado al final de `runStockSync()` cuando `status` es `success` o `partial` y `productsUpdated > 0`:

1. Cargar productos actualizados en la corrida (IDs ya conocidos en orchestrator — pasar `updatedSkus: { sku, previousIndicator, newIndicator, title, slug }[]`).
2. Filtrar transiciones alertables: `previousIndicator === 'limited'` y `newIndicator` ∈ `{ available, low }`.
3. Para cada SKU, `SELECT web_profile_id FROM stock_watches WHERE sku = $1`.
4. Por perfil: si `last_notified_at` null o watch recreado tras delete, despachar; `idempotency_key = stock:{sku}:{profileId}:{syncRunId}`.
5. Actualizar `last_indicator`, `last_notified_at` en watches afectados.

Orchestrator guarda `previousIndicator` leyendo valor antes de `recalculateStockIndicatorsForAllProducts` solo para productos tocados (map en memoria durante sync).

**Alternativa descartada:** Cron separado cada 5 min — duplica lectura Payload; acoplado al sync es más preciso.

### 5. UI `/intranet/stock`

**Decisión:** Server component + client table `StockWatchesTable`:

- Columnas: referencia (SKU), título, semáforo actual (`StockBadge`), fecha seguimiento, acciones (quitar, ver producto).
- Empty state: enlace al catálogo con texto "Marca productos con el corazón cuando no haya stock".
- Tokens `globals.css`; sin hex hardcodeado.
- Quitar seguimiento: `DELETE /api/wishlist?sku=` + optimistic UI.

Navegación: quitar `scaffold` de entrada `stock` en `navigation.ts`.

**Alternativa descartada:** Reutilizar solo campana sin página — US-07 CA2 exige sección dedicada en menú.

### 6. UX PDP/PLP

**Decisión:**

- Corazón activo: sync server si autenticado (cualquier grupo); anónimo solo localStorage.
- PDP con `stockIndicator.level === 'limited'` y toggle on: toast "Te avisaremos cuando haya stock" solo si sesión B2B validada; B2C logueado guarda watch sin promesa de email portal (v1 sin campana B2C).
- PLP: mismo comportamiento sin toast (espacio limitado).

**Alternativa descartada:** Bloquear wishlist sin stock hasta login — fricción innecesaria; localStorage permite intención previa al registro.

### 7. Email `stock_available`

**Decisión:** Plantilla React Email en `apps/cms/src/lib/notifications/emails/stock-available.tsx`:

- Asunto: `Ya hay stock de {sku} en Jeyjo`
- Cuerpo: título producto, etiqueta semáforo ("Disponible" / "Últimas unidades"), CTA al PDP (`payload.href`).
- Registro en `sendProactiveEmail` switch por tipo.

## Risks / Trade-offs

- **[Riesgo] Sync parcial sin SKU actualizado** → Solo evaluar productos en `updatedSkus`; watches de SKUs no tocados no re-evalúan hasta próximo cambio de stock.
- **[Riesgo] Producto discontinuado** → Watch permanece; UI muestra "Disponibilidad limitada"; usuario puede quitar manualmente. Sin job de limpieza en v1.
- **[Riesgo] Doble fuente wishlist local/servidor** → Merge al login con servidor como source of truth post-merge; documentar en hook.
- **[Riesgo] Carga N×M watches × SKUs** → Batch query watches por lista de SKUs alertables; límite 500 despachos por sync run con log warning.
- **[Trade-off] Solo B2B portal para avisos in-app** → B2C con watch persistido queda preparado para futuro #28 B2C sin implementarlo ahora.

## Migration Plan

1. Migración Supabase: `stock_watches` + `wishlist_channel` column (default `email`).
2. Deploy CMS con job hook (feature flag `WISHLIST_STOCK_ALERTS_ENABLED=true`, alineado con `NOTIFICATIONS_ENABLED`).
3. Deploy storefront con APIs y UI; wishlist local sigue funcionando.
4. Rollback: desactivar flag; tabla watches inofensiva; scaffold restaurable quitando página.

## Open Questions

1. **¿B2C registrado recibe email de stock en v1?** Propuesta: no (solo B2B validado con `wishlist_channel`); confirmar con Dirección si se quiere email B2C sin portal.
2. **¿Re-seguir tras compra?** v1 no elimina watch automáticamente al comprar; el usuario quita manualmente.
