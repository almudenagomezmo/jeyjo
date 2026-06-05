# Roadmap incremental Jeyjo (OpenSpec)

Orden de cambios acordado en sesión explore (2026-06-04). Cada fila = un cambio OpenSpec (`/openspec-propose` → `/openspec-apply-change` → sync → archive).

**Decisiones:** monorepo `storefront` + `cms`; diseño desde `especificaciones_inicio/diseño/jeyjo-next`; ERP vía adaptadores (stub/Excel hasta API Avansuite); área documental en cambio **37** (fase final).

**Estado:** `Completado` = archivado en `openspec/changes/archive/YYYY-MM-DD-<nombre>/`. **Fecha** = día de archivo (implementación aplicada y specs sincronizadas).

**Progreso:** **28 / 43** cambios completados (~65 %). Hito alcanzado: portal B2B con histórico, pedido rápido, tarifas, subusuarios, RMA y centro de notificaciones operativos.

| # | Cambio | Depende de | US / RF principales | Estado | Fecha |
|---|--------|------------|---------------------|--------|-------|
| 1 | `foundation-monorepo-design-system` | — | RNF-017, RNF-014 | Completado | 2026-06-04 |
| 2 | `data-schema-core-supabase` | 1 | RD-001, RNF-009 | Completado | 2026-06-04 |
| 3 | `payload-collections-bootstrap` | 2 | RF-024, US-16 | Completado | 2026-06-04 |
| 4 | `erp-port-adapters-contracts` | 3 | RF-023, RI-001, US-15 | Completado | 2026-06-04 |
| 5 | `backoffice-mfa-audit-roles` | 3 | RF-002, RF-029, RF-030 | Completado | 2026-06-04 |
| 6 | `price-engine-core` | 4 | RF-007, RF-011, US-02 | Completado | 2026-06-04 |
| 7 | `catalog-sync-read-stub` | 4, 6 | RF-005, RF-006, RF-023 | Completado | 2026-06-04 |
| 8 | `stock-multisource-adapters` | 7 | RF-005, RI-003, RI-004 | Completado | 2026-06-04 |
| 9 | `storefront-shell-navigation` | 1, 7 | Alcance §1.2–4, US-01 | Completado | 2026-06-04 |
| 10 | `plp-faceted-listing` | 6, 7, 9 | RF-010, RF-011, US-01, US-02 | Completado | 2026-06-04 |
| 11 | `pdp-product-detail` | 6, 8, 10 | RF-012, RF-008, US-03 | Completado | 2026-06-04 |
| 12 | `cart-minicart-client` | 6, 11 | US-03, alcance carrito | Completado | 2026-06-04 |
| 13 | `search-events-qdrant-worker` | 2, 7 | RF-009 | Completado | 2026-06-04 |
| 14 | `predictive-search-ui` | 9, 13 | RF-009, US-01 | Completado | 2026-06-04 |
| 15 | `home-segmented-banners` | 9, 10 | Alcance §1.6, US-02 | Completado | 2026-06-04 |
| 16 | `auth-registration-area-cliente` | 2, 3 | RF-001, RF-004, US-04, US-07 | Completado | 2026-06-04 |
| 17 | `checkout-shipping-b2c-b2b` | 12, 16 | RF-013, RF-014, US-04 | Completado | 2026-06-04 |
| 18 | `payments-redsys-wallets` | 17 | RF-014, US-04, RI-006 | Completado | 2026-06-04 |
| 19 | `quotes-presupuesto-flow` | 17, 20 | RF-015, US-05 | Completado | 2026-06-04 |
| 20 | `oms-pedidos-web` | 3, 17 | RF-025, US-17 | Completado | 2026-06-04 |
| 21 | `pim-seo-dual-images` | 3, 5 | RF-024, US-16 | Completado | 2026-06-04 |
| 22 | `portal-b2b-shell` | 16, 6 | RF-001, RF-011, US-07 | Completado | 2026-06-04 |
| 23 | `purchase-history-repeat` | 6, 12, 22 | RF-018, US-10 | Completado | 2026-06-04 |
| 24 | `quick-order-excel` | 12, 22 | RF-019, US-11 | Completado | 2026-06-04 |
| 25 | `custom-tariffs-view` | 6, 22, 4 | RF-020, US-14 | Completado | 2026-06-04 |
| 26 | `b2b-subusers-permissions` | 16, 22 | RF-003, US-12 | Completado | 2026-06-04 |
| 27 | `rma-incidents` | 20, 22 | RF-021, US-13 | Completado | 2026-06-04 |
| 28 | `notifications-center-email` | 20, 22 | RF-022, US-21 | Completado | 2026-06-04 |
| 29 | `excel-importer-exporter` | 4, 5 | RF-023, US-15 | Pendiente | — |
| 30 | `dashboard-kpis-alerts` | 5, 7, 20 | RF-026, US-19 | Pendiente | — |
| 31 | `marketing-coupons-abandoned-cart` | 17, 20 | RF-027, US-18, US-23 | Pendiente | — |
| 32 | `eva-skai-widget-integration` | 9, 16, 20 | RI-005, US-20, US-22 | Pendiente | — |
| 33 | `blog-payload-frontend` | 3, 9 | US-24 | Pendiente | — |
| 34 | `analytics-ga4-merchant-feed` | 10, 11, 20 | RF-028 | Pendiente | — |
| 35 | `wishlist-stock-alerts` | 8, 16, 28 | Alcance wishlist | Pendiente | — |
| 36 | `erp-api-write-implementation` | 4, 29 | RF-023, RI-001 | Pendiente | — |
| 37 | `area-documental-financiera` | 4, 22, 28 | RF-016, RF-017, US-08, US-09 | Pendiente | — |
| 38 | `product-comparison-plp` | 10 | US-06 | Pendiente | — |
| 39 | `newsletter-subscription` | 9, 3 | Alcance §1.14 | Pendiente | — |
| 40 | `footer-eva-omnichannel-complete` | 9, 32 | Alcance §1.12 | Pendiente | — |
| 41 | `downloads-catalogs-portal` | 22, 3 | Alcance §1.24 | Pendiente | — |
| 42 | `system-config-backoffice` | 5, 30 | Alcance §1.36 | Pendiente | — |
| 43 | `seo-technical-auditor` | 21, 34 | Alcance auditor SEO | Pendiente | — |

**Siguiente cambio recomendado:** #29 `excel-importer-exporter` (RF-023, US-15) o #35 `wishlist-stock-alerts` (reutiliza notificaciones #28).

**Portal B2B — estado actual:** operativo histórico (#23), pedido rápido (#24), precios (#25), subusuarios (#26), RMA (#27) y notificaciones (#28); pendientes avisos stock PDP (#35), descargas (#41) y contabilidad documental (#37).

Gaps conscientes: búsqueda por voz (RF-009, post-EVA); MFA B2B opcional en cambio 16; pentest operativo pre-go-live.
