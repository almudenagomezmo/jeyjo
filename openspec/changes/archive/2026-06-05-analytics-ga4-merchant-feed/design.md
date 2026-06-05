## Context

- **Estado actual:** Storefront monta `AnalyticsBeacon` (#30) que persiste sesiones anónimas y carritos en Supabase; el dashboard CMS calcula visitantes y conversión interna. No hay `gtag.js`, ni helpers de eventos e-commerce, ni feed GMC. PDP/PLP resuelven precio P1 y stock semáforo (#6, #8); imágenes dual vía `@jeyjo/catalog-images` (#21). Checkout confirma pedidos en Payload (#17–18, #20) con página `/checkout/confirmacion?order=…&paid=1`. Crons CMS existentes (`erp-catalog-sync`, `stock-sync`, `search-indexer`, etc.) usan `GET /api/cron/*` + `CRON_SECRET` en `vercel.json`.
- **Arquitectura objetivo (04-arquitectura-jeyjo):** Next.js storefront → eventos GA4 (gtag); Payload CMS → generador feed GMC servido en URL pública. Patrón establecido: feature flags env, endpoints cron protegidos, globals Payload para config staff, paquetes compartidos para lógica pura.
- **Referencias:** **RF-028**, **RI-007**, **RI-008**, **RD-004**, `storefront-analytics-sessions`, `catalog-image-resolution`, `storefront-stock-read`.

## Goals / Non-Goals

**Goals:**

- Cargar GA4 solo cuando `NEXT_PUBLIC_GA4_MEASUREMENT_ID` y flag activos; respetar desactivación en dev/CI.
- Emitir eventos estándar GA4 e-commerce en puntos del embudo: navegación (`page_view`), PDP (`view_item`), carrito (`add_to_cart`), checkout (`begin_checkout`), conversión (`purchase`).
- Enviar `purchase` con `transaction_id`, `value`, `currency`, `tax`, `shipping` e `items[]` tras pedido pagado; duplicar vía Measurement Protocol opcional server-side.
- Generar feed GMC RSS 2.0 (`xmlns:g`) con productos publicados no-wildcard, precio P1 con IVA, `image_link` resuelto, `availability` desde semáforo stock.
- Regenerar feed ≥1/día (cron nocturno 03:00 UTC) y servir snapshot cacheable con `ETag`/`Last-Modified`.
- Global Payload `analyticsSettings` con measurement ID (referencia), URL feed documentada y toggles operativos.

**Non-Goals:**

- GTM, Enhanced Conversions, remarketing, multi-país/multi-moneda.
- Consent Mode / CMP (documentar requisito legal; implementación posterior).
- Precios B2B/tarifas especiales en feed.
- Sustituir beacons Supabase del dashboard.
- Auditor SEO (#43), panel settings unificado (#42).

## Decisions

### 1. GA4 vía `next/script` + módulo `lib/analytics/ga4.ts`

**Decisión:** No añadir `@next/third-parties` en v1. Componente `Ga4Script` carga `https://www.googletagmanager.com/gtag/js?id=G-XXX` con `strategy="afterInteractive"` e inicializa `dataLayer`. Módulo exporta:

```ts
type Ga4Item = { item_id: string; item_name: string; price?: number; quantity?: number }

function ga4Enabled(): boolean
function trackPageView(path: string): void
function trackViewItem(item: Ga4Item): void
function trackAddToCart(item: Ga4Item & { quantity: number }): void
function trackBeginCheckout(items: Ga4Item[], value: number): void
function trackPurchase(params: { transactionId: string; value: number; tax?: number; shipping?: number; items: Ga4Item[] }): void
```

Cada función no-op si GA4 deshabilitado o `window.gtag` ausente.

**Rationale:** Dependencia cero extra; control total de payloads e-commerce; tests mockean módulo.

**Alternativa descartada:** `@next/third-parties/google` — menos control sobre item payloads y purchase deduplication.

### 2. `page_view` con listener App Router

**Decisión:** Cliente `Ga4PageView` en layout usa `usePathname()` + `useSearchParams()`; en cada cambio de ruta llama `trackPageView` si GA4 activo. No confiar solo en carga inicial del script.

**Rationale:** App Router no dispara automáticamente page_view en navegaciones cliente.

### 3. Hooks de embudo en componentes existentes

**Decisión:**

| Evento | Punto de integración |
|--------|---------------------|
| `view_item` | Cliente `PdpBuyBox` / wrapper PDP tras hidratar producto |
| `add_to_cart` | `useCartStore` action `addLine` (centralizado) o callback post-add en PDP/minicart |
| `begin_checkout` | `CheckoutFlow` mount cuando `lines.length > 0` (una vez por sesión checkout vía ref) |
| `purchase` | Refactor parcial `/checkout/confirmacion`: server fetch order by number → props a cliente `PurchaseTracker` |

**Rationale:** Un solo punto para `add_to_cart` evita olvidos en quick order / repeat purchase.

### 4. Purchase: cliente + Measurement Protocol opcional

**Decisión:** Página confirmación recibe snapshot del pedido (server component wrapper). Cliente emite `gtag('event','purchase',…)` con `transaction_id = orderNumber`. Si `GA4_API_SECRET` configurado, storefront `POST /api/analytics/ga4-purchase` reenvía evento MP server-side (dedupe `event_id` UUID). Solo cuando `paid=1` o método B2B transferencia confirmada localmente.

**Rationale:** RI-007 pide server-side para datos sensibles; MP es fallback ante adblockers sin GTM server container.

**Alternativa descartada:** MP únicamente — pierde funnels intermedios en cliente.

### 5. Feed GMC: builder puro + snapshot Supabase Storage

**Decisión:** Paquete `apps/cms/src/lib/feeds/merchant-center/`:

```ts
type MerchantFeedRow = {
  id: string          // SKU ERP
  title: string
  description: string
  link: string        // absolute PDP URL
  imageLink: string | null
  price: string       // "12.34 EUR"
  availability: 'in_stock' | 'out_of_stock' | 'preorder'
  brand?: string
  gtin?: string
}

function buildMerchantFeedXml(rows: MerchantFeedRow[]): string
async function fetchPublicCatalogRows(payload): Promise<MerchantFeedRow[]>
```

Cron `GET /api/cron/merchant-feed`:
1. Query Payload products `status=published`, excluir wildcard.
2. Resolver precio P1+IVA, stock semáforo (`storefront-stock-read` logic duplicated server-side in CMS lib), imagen `resolveCatalogImage`.
3. Omitir filas sin `imageLink` o sin precio (log count skipped).
4. Upload XML a Supabase Storage `merchant-feeds/latest.xml` + metadata `generatedAt`.

Ruta pública `GET /api/feeds/merchant-center.xml`:
- Si snapshot existe y `< 25 h` antigüedad → stream con `Cache-Control: public, max-age=3600`, `ETag`.
- Si no existe o `?refresh=1` con cron secret → regenerar síncrono (dev).

**Rationale:** Google fetch periódico; snapshot evita timeout en request público con 30k SKUs (paginar query Payload 500/lote).

**Alternativa descartada:** Regeneración síncrona en cada GET — riesgo timeout Vercel con catálogo grande.

### 6. Config Payload global `analyticsSettings`

**Decisión:** Global Payload (grupo `mantenimiento`):

| Campo | Uso |
|-------|-----|
| `ga4MeasurementId` | Referencia/documentación; runtime usa env `NEXT_PUBLIC_GA4_MEASUREMENT_ID` |
| `merchantFeedEnabled` | Kill switch feed |
| `merchantFeedPublicUrl` | Read-only computed helper en admin (CMS base + path) |
| `lastFeedGeneratedAt` | Actualizado por cron |

**Rationale:** RF-028 pide visibilidad backoffice sin esperar #42; env sigue siendo source of truth en Vercel.

### 7. Coexistencia con beacons Supabase

**Decisión:** Sin cambios en `AnalyticsBeacon`. README dashboard aclara: métricas visitantes internas ≠ GA4. Conversión dashboard puede divergir de GA4 (cookies, adblockers).

**Rationale:** US-19 ya satisfecho; GA4 es canal externo adicional.

## Risks / Trade-offs

- **[Adblockers ocultan GA4 cliente]** → MP opcional en purchase; beacons internos siguen para dashboard.
- **[Feed sin imagen]** → Omitir SKU y contabilizar en admin health; PIM health (#21) ya alerta sin foto.
- **[Precio feed ≠ precio promocional temporal]** → Feed usa P1 base; cupones/ofertas no reflejados (aceptado v1).
- **[Consentimiento RGPD]** → GA4 desactivado por defecto en `.env.example`; producción requiere banner (fuera scope).
- **[Catálogo grande / timeout cron]** → Paginación Payload; alerta dashboard si cron falla 2 días seguidos (reuse `backoffice-system-alerts` pattern).
- **[Duplicado purchase client+server]** → Mismo `transaction_id` + `event_id` en MP; gtag deduplica por transaction_id.

## Migration Plan

1. Añadir env vars en staging (GA4 measurement ID de propiedad test, feed disabled).
2. Desplegar CMS con cron + ruta feed; verificar XML en Content API for Shopping validator.
3. Desplegar storefront con GA4 disabled; smoke test no regressions en beacons.
4. Activar `NEXT_PUBLIC_GA4_ENABLED=true` en staging; validar DebugView (view_item, add_to_cart, purchase test).
5. Registrar URL feed en Google Merchant Center sandbox.
6. Producción: activar flags tras consentimiento legal; monitor cron `lastFeedGeneratedAt`.

**Rollback:** `NEXT_PUBLIC_GA4_ENABLED=false`, `MERCHANT_FEED_ENABLED=false`; beacons y checkout sin cambios funcionales.

## Open Questions

- ¿Propiedad GA4 única o separada B2B intranet? **Asunción v1:** una propiedad; intranet excluida de GA4 (solo tienda pública).
- ¿Incluir productos `out_of_stock` en feed? **Asunción v1:** sí con `availability=out_of_stock` (Google permite; oculta en Shopping según política cuenta).
- ¿Bucket Supabase `merchant-feeds` público read o signed URL? **Preferencia:** objeto público read-only vía RLS policy; URL estable para GMC.
