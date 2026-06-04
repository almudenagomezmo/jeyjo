## Context

- **Estado actual:** `packages/erp-ports` expone `ErpProductDto` con `p1Price`, `p2Price`, `vatRate`; Payload productos los muestran en pestaña ERP de solo lectura. `apps/storefront/src/lib/utils/price.ts` implementa presentación dual (B2C/B2B) sobre un `Product` mock con `priceNoVat` ya resuelto — no aplica reglas RF-007. Supabase tiene `customers.general_discount` pero no tablas `special_prices` ni ofertas. `payload-order-collection` define `ivaRateSnapshot` en líneas como preparación sin hook de confirmación.
- **Arquitectura (MOD-03):** Motor de precios como servicio TypeScript con Strategy Pattern; entrada `{ productId/sku, customerId?, context }`; salida quote con neto, IVA y modo de oferta.
- **Dependencias:** #4 (`erp-port-adapters-contracts`) aplicado o en rama; #16 auth B2B no es bloqueante — el motor acepta `PricingContext` explícito para tests y futuro middleware.
- **Requisitos:** RF-007, RF-011, US-02, RNF-003 (p95 &lt;200 ms), CA-PRECIOS-001..004.

## Goals / Non-Goals

**Goals:**

- Paquete `@jeyjo/pricing` puro (sin Payload/Next), testeable al ≥80 % cobertura.
- Reglas RF-007 con prioridad fija y no acumulación documentada en código + tests CA-PRECIOS-003.
- Persistencia mínima en Supabase + repositorio que combine Payload/Supabase según origen del dato.
- Extensión `erp-ports` con `ErpPricingReader` y stub para datos de prueba REF-001..004.
- Snapshot IVA inmutable al pasar pedido a estado confirmado.
- Storefront: resolver precio vía servidor y reutilizar `getDualPrice` / `PriceModeToggle` (RF-011).

**Non-Goals:**

- Jobs de sync (#7), UI PLP/PDP (#10–11), cupones (#31), portal tarifas (#25), pack-unit (#11).
- Caché distribuida Redis; en #6 basta índice en memoria por request o lectura directa con índices SQL.
- GraphQL público de precios masivo (batch en #10).

## Decisions

### 1. Paquete `packages/pricing` sin dependencias de framework

**Decisión:** Lógica en `packages/pricing` exportando `resolvePrice(input: PricingInput): PriceQuote` y estrategias internas.

**Alternativa descartada:** Motor solo en `apps/cms` — el storefront necesita el mismo cálculo sin round-trip Payload en cada tile (RNF-003).

**Rationale:** Alineado a MOD-03 y patrón Strategy en arquitectura §7.

### 2. Strategy chain con prioridad explícita

**Decisión:** Pipeline ordenado (primera coincidencia gana):

| Orden | Estrategia | Condición | Base neto |
|-------|------------|-----------|-----------|
| 1 | `SpecialPriceStrategy` | `special_prices` vigente para (customer, product) | `precio_especial` |
| 2 | `GroupOfferStrategy` | oferta activa en `group_offers` para SKU/grupo | precio oferta |
| 3 | `B2BDiscountStrategy` | cliente B2B (`customer_group` 2–4) sin oferta previa | `p2 * (1 - general_discount)` |
| 4 | `P1RetailStrategy` | anónimo / B2C (`customer_group` 1) | `p1` |

**No acumulación:** Si estrategia 1 o 2 aplica, estrategia 3 no se evalúa. Tests CA-PRECIOS-003 fijan REF-003 → 8,00 € no 7,20 €.

**Alternativa:** Descuentos compuestos — rechazado por RF-007.

### 3. Tipos monetarios y redondeo

**Decisión:** `decimal.js` o enteros en céntimos internos; redondeo HALF_UP a 2 decimales en salida UI; almacenamiento Supabase `numeric(12,6)` coherente con Avansuite (RNF en 05).

**Salida `PriceQuote`:** `{ netUnit, grossUnit, vatRate, appliedRule, listUnit?, discountPercent?, label? }` donde `grossUnit = netUnit * (1 + vatRate/100)`.

### 4. Tablas Supabase `special_prices` y `group_offers`

**Decisión:**

```sql
special_prices (customer_id, product_sku, net_price, valid_from, valid_to, status)
group_offers (sku_erp, offer_net_price, customer_group?, valid_from, valid_to, active)
```

Índices: `(customer_id, product_sku)` + filtro vigencia; `(sku_erp)` donde `active`. RLS: lectura service role / políticas por `customer_id` vía JWT en fases posteriores; en #6 política `authenticated` read-own preparada pero tests usan service role.

**Seed:** Filas para CA-PRECIOS-001..004 (REF-001..004) en migración o script `supabase/seed/pricing-fixtures.sql`.

**Alternativa:** Solo Payload — insuficiente para consultas rápidas storefront sin cargar CMS API.

### 5. `PricingRepository` compuesto

**Decisión:** Interfaz en `@jeyjo/pricing`:

- `getProductBase(sku)` → lee P1/P2/vat desde Payload REST interna o caché denormalizada (en #6: fetch CMS con API key server-side o lectura Supabase mirror futuro #7).
- `getCustomerContext(customerId)` → Supabase `customers`.
- `getSpecialPrice`, `getGroupOffer` → Supabase.

**Fase #6 pragmática:** Storefront/CMS llaman repositorio implementado en cada app que inyecta clientes Supabase + Payload Local API.

### 6. Extensión `erp-ports`: `ErpPricingReader`

**Decisión:** Nuevo puerto `listSpecialPrices(customerErpCode)`, `listGroupOffers()` retornando DTOs normalizados; stub devuelve dataset REF-001..004. Sync #7 persistirá vía mismo DTO → tablas Supabase.

**No implementar** escritura de precios especiales (RF-023 escritura queda #36).

### 7. IVA snapshot en confirmación de pedido

**Decisión:** Hook `beforeChange` en `orders` cuando `status` transita a `confirmed` (o equivalente enum): para cada línea, si `ivaRateSnapshot` vacío, copiar `vatRate` del producto vinculado en ese instante; rechazar confirmación si producto sin IVA.

**Alternativa:** Calcular en checkout #17 — demasiado tarde para RF-007; el campo debe existir desde #6 para tests de contrato.

### 8. Storefront price resolution API

**Decisión:** Route Handler `POST /api/pricing/resolve` (o Server Action) acepta `{ sku, quantity? }`, lee sesión Supabase opcional → `customerId`, invoca `@jeyjo/pricing`, devuelve `PriceQuote` + `PriceView` para UI.

**RNF-003:** Una sola query compuesta (customer + special + offer + product cache); objetivo p95 &lt;200 ms en staging con índices; sin N+1 por línea en este endpoint (batch endpoint en #10).

### 9. Integración UI RF-011

**Decisión:** `getPriceView` recibe `PriceQuote` en lugar de `Product.priceNoVat` fijo. `PriceModeToggle` deriva modo de `customer_group` (B2C → emphasize con IVA; B2B → sin IVA). Cabecera muestra "Precios sin IVA" / "Precios con IVA" según CA-PRECIOS-001.

**Tokens:** Sin cambios en `globals.css` en #6; solo cableado de datos.

### 10. Tests

**Decisión:** Vitest en `packages/pricing` con fixtures REF-001..004; tests integración ligera CMS (hook snapshot); test handler storefront mockeando repositorio.

## Risks / Trade-offs

| Riesgo | Mitigación |
|--------|------------|
| Doble fuente de verdad P1/P2 (Payload vs Supabase mirror) | En #6 Payload es fuente; documentar que #7 puede denormalizar; repositorio abstracto |
| Latencia leyendo Payload por SKU | Cache per-request Map; índice por `skuErp` en colección; batch API en #10 |
| Ofertas ERP aún sin contrato API | Tablas locales + stub; Open Question abajo |
| Anónimo ve P2 por bug | Test CA-PRECIOS-001 + guard en `P1RetailStrategy` si no hay sesión B2B |

## Migration Plan

1. Aplicar migración Supabase `special_prices` / `group_offers` + seed fixtures.
2. Publicar `@jeyjo/pricing` en workspace; actualizar `pnpm-lock`.
3. Desplegar CMS con hook snapshot (compatible con pedidos draft existentes — snapshot solo al confirmar).
4. Desplegar storefront con nuevo endpoint; feature flag `PRICING_ENGINE_ENABLED=true` en staging.
5. Rollback: flag off → storefront vuelve a stub local (mantener rama de fallback una release).

## Open Questions

1. **Nombre exacto del estado “confirmado”** en colección `orders` del plugin ecommerce — validar enum en implementación.
2. **Modelo oferta de grupo en Avansuite** — ¿precio neto fijo o % sobre P2? Stub asume neto fijo (CA-PRECIOS-003); confirmar con Soporte Avansuite antes de #36.
3. **¿Denormalizar P1/P2 a Supabase en #6 o solo en #7?** Propuesta: leer Payload en #6; revisar si p95 falla en carga.
