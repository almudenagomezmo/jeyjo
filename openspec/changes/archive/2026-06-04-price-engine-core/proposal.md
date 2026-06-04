## Why

Tras `erp-port-adapters-contracts` (#4), el catálogo expone P1/P2 y `vatRate` desde ERP, pero la tienda aún no aplica las **reglas de negocio de precio** (P1 vs P2, descuento B2B, ofertas de grupo, precios especiales pactados, no acumulación) ni el **IVA snapshot** en líneas de pedido. Un error aquí impacta directamente ingresos y disputas comerciales (**RF-007**, **RNF-003**). Este cambio (#6 del ROADMAP) entrega el motor de precios como servicio compartido y utilidades de presentación dual (**RF-011**, **US-02**) antes de PLP/PDP (#10–11) y sync de catálogo con precios calculados (#7).

## What Changes

- Paquete workspace `@jeyjo/pricing` con motor puro: entrada producto + contexto cliente → resultado `PriceQuote` (base, descuentos, neto, IVA, etiquetas de regla aplicada).
- Estrategias en orden de prioridad alineadas a **RF-007**: (1) precio especial pactado vigente, (2) oferta de grupo activa, (3) P2 − descuento general B2B, (4) P1 para B2C/anónimo; regla explícita de **no acumulación** oferta + descuento cliente.
- Tablas Supabase mínimas para datos que el motor necesita y el stub aún no sincroniza: `special_prices`, `group_offers` (o equivalente documentado en diseño).
- Puertos/DTOs en `@jeyjo/erp-ports` para precios especiales y ofertas (lectura stub determinista) sin implementar sync programada (#7).
- Función `captureIvaSnapshot` / hook en confirmación de pedido Payload que fija `ivaRateSnapshot` en líneas (**RF-007** — preparación ya iniciada en `payload-order-collection`).
- Sustituir stubs de `apps/storefront/src/lib/utils/price.ts` por consumo del quote del motor + `getDualPrice` / `PriceModeToggle` según **RF-011**.
- API server-side (Route Handler o Server Action) `resolveProductPrice` para storefront con latencia objetivo **RNF-003** (&lt;200 ms p95).
- Tests unitarios ≥80 % del paquete pricing cubriendo **CA-PRECIOS-001..004**; sin E2E PLP en este cambio.

## Capabilities

### New Capabilities

- `pricing-engine`: Cálculo determinista de precio neto por producto/cliente/contexto; reglas RF-007 y no acumulación; tipos y tests.
- `pricing-data-schema`: Tablas `special_prices` y ofertas de grupo en Supabase + RLS; seed mínimo para staging.
- `erp-pricing-read-ports`: DTOs y métodos de lectura stub para precios especiales y ofertas (extensión de `erp-ports`, sin jobs).
- `storefront-price-resolution`: Endpoint/servidor que resuelve precios para sesión anónima/B2C/B2B y alimenta utilidades UI.
- `order-iva-snapshot`: Hook/servicio al confirmar pedido que copia `vatRate` vigente a `ivaRateSnapshot` inmutable por línea.

### Modified Capabilities

- `storefront-ui-primitives`: Los helpers `price.ts` dejan de ser stubs y delegan al motor; se mantiene compatibilidad de firmas con jeyjo-next.
- `payload-order-collection`: Comportamiento de confirmación exige `ivaRateSnapshot` poblado en cada línea (requisito pasaba de “preparación” a obligatorio en flujo de confirmación).

## Impact

- Nuevo paquete `packages/pricing` (workspace pnpm).
- `supabase/migrations`: tablas de precios especiales y ofertas.
- `packages/erp-ports`: DTOs/puerto lectura pricing; stub ampliado.
- `apps/cms`: hook confirmación pedido, posible endpoint interno para storefront.
- `apps/storefront`: `lib/utils/price.ts`, integración con `PriceTag` / `PriceModeToggle`.
- Desbloquea ROADMAP #7 (`catalog-sync-read-stub`), #10 (`plp-faceted-listing`), #11 (`pdp-product-detail`), #22–25 (portal B2B y tarifas).
- Depende de #4 (`erp-port-adapters-contracts`); no requiere auth B2B completa (#16) — usa `customerId`/`webProfile` cuando exista.

## Non-Goals

- UI completa de PLP/PDP, filtros por rango de precio o facetas (#10).
- Sincronización programada ERP → Supabase de tarifas/ofertas (#7); solo contrato + stub + tablas locales.
- Cupones, reglas de marketing por categoría (#31).
- Vista “tarifas personalizadas” en portal B2B (#25).
- Pack-unit / envase cerrado en selector (#11, **RF-008** — **CA-PRECIOS-005** fuera de alcance).
- Histórico de compras con “precio actual” (#23).
- Adaptador API Avansuite real para precios especiales (#36).
