## Why

Tras `catalog-sync-read-stub` (#7), el catálogo Payload ya recibe `erpStock` desde Avansuite vía stub, pero **no existen adaptadores ni sync para las otras dos fuentes de stock** (Distrisantiago FTP — RI-003, Arnoia web link — RI-004) ni la **lógica de semáforo RF-005** que agrega ERP + mayoristas en un indicador público sin cantidades exactas. Sin este cambio (#8 del ROADMAP) no se cumple **RF-005**, **RNF-004** (freshness stock crítico), **RNF-007** (degradación ante caída de fuente) ni se desbloquea la PDP (#11) ni filtros PLP "En stock para envío hoy" (#10).

## What Changes

- **Puertos de stock multi-fuente:** nuevo paquete `@jeyjo/stock-ports` con interfaces `StockSourceReader`, DTOs de snapshot por referencia y códigos de error alineados a `ErpIntegrationError`.
- **Adaptadores stub:** implementaciones de desarrollo/test para Distrisantiago (FTP simulado) y Arnoia (web link simulado), seleccionables por env (`STOCK_DISTRI_ADAPTER`, `STOCK_ARNOIA_ADAPTER`), con fixtures alineados a SKUs seed (`REF-001..004`, `ERP-GRF-001`).
- **Sync Engine de stock:** orquestador CMS que (1) lee snapshots de mayoristas, (2) persiste cantidades internas por fuente en Payload/Supabase, (3) recalcula indicador semáforo por producto, (4) registra run en `stock_sync_runs` + `audit_log`; cron protegido y trigger manual.
- **Resolución semáforo RF-005:** servicio puro que mapea datos agregados → `available` (verde), `low` (azul, umbral configurable), `limited` (rojo/amarillo sin dato), `stale` (aviso degradación RNF-007); **nunca expone cantidades** en API pública.
- **Storefront stock read:** endpoint/helper server-side `getStockIndicator(sku)` consumible por pricing/cart (#6) y futura PDP (#11); filtro comodín heredado de #7.
- **Configuración operativa:** umbral "últimas unidades" (`STOCK_LOW_THRESHOLD`, default 5), horarios esperados FTP, staleness máxima por fuente.
- **No incluye:** UI visual StockBadge/PDP/PLP (#10–11), alertas dashboard backoffice (#30), wishlist stock alerts (#35), adaptadores FTP/HTTP reales contra producción (solo stub + contrato listo para wiring), reserva de stock en checkout (#17), Google Merchant `availability` feed (#34).

## Capabilities

### New Capabilities

- `stock-source-ports`: Contratos TypeScript (`StockSourceReader`, DTOs, paginación, errores) para fuentes Distrisantiago y Arnoia independientes del ERP catalog reader.
- `stock-stub-adapters`: Adaptadores stub con dataset determinista, simulación de outage y mapeo por `mainWholesaleRef` / SKU.
- `stock-sync-engine`: Orquestación CMS de sync mayorista, persistencia por fuente, cron/manual trigger, metadatos de run y resiliencia RNF-007.
- `stock-semaphore-resolver`: Reglas RF-005 de agregación multi-fuente y umbral configurable sin exposición pública de cantidades.
- `storefront-stock-read`: Lectura server-side del indicador semáforo para SKUs publicados, con cache y degradación.

### Modified Capabilities

- `payload-catalog-collections`: Campos de stock mayorista (`distrisantiagoStock`, `arnoiaStock`, `stockIndicator`, `syncStockAt` por fuente) y guards ERP read-only ampliados.
- `erp-catalog-sync-engine`: Tras sync catálogo ERP, invocar recálculo de semáforo (o encadenar stock sync) para mantener coherencia cuando cambia `erpStock`.

## Impact

- `packages/stock-ports` (nuevo): puertos, tipos, stub adapters.
- `apps/cms`: módulo `src/stock/` (registry, sync orchestrator, semaphore service, cron route); ampliación `erpFields.ts` / guards; posible migración `stock_sync_runs` y columnas Supabase mirror.
- `apps/storefront`: `lib/stock/` con `getStockIndicator` y tests; `.env.example` para umbrales.
- `packages/database-types`: tipos generados tras migración.
- Desbloquea ROADMAP #10 (filtro stock PLP), #11 (PDP semáforo), #35 (wishlist alerts).
- Depende de #7 completado. Cumple **RF-005**, **RI-003**, **RI-004**, **RNF-004**, **RNF-007**; base para **US-03** CA4 (pedido sin stock) y **CA-ERP-001** (indicador azul tras bajada ERP).

## Non-Goals

- Componentes React StockBadge/PLP/PDP (cambios #10–11 portan jeyjo-next UI).
- Conexión FTP real a Distrisantiago ni scraping HTTP real de Arnoia en producción (stubs + interfaces; wiring real cuando haya credenciales/URLs definitivas).
- Bandeja de alertas "archivo FTP no recibido" en dashboard (#30).
- Notificaciones wishlist por stock (#35).
- Modificar cantidades en ERP o mayoristas (solo lectura).
- Sustituir `inventory` legacy de Payload ecommerce template en UI — el semáforo RF-005 es campo/cálculo separado.
