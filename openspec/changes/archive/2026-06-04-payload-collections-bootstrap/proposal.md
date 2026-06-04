## Why

Tras el esquema Supabase núcleo (#2), `apps/cms` sigue con colecciones del template e-commerce (Stripe, variantes USD, `users` como clientes) que no reflejan el modelo Jeyjo (`PRODUCTO`, `CATEGORIA`, `PROVEEDOR`, `PEDIDO_WEB` en `04-arquitectura-jeyjo.md`). Sin colecciones Payload alineadas al dominio y hooks hacia `search_events` / `audit_log`, los cambios de catálogo, OMS, ERP (#4) y enriquecimiento PIM (#21) no tienen dónde persistir datos ni disparar indexación. Este cambio materializa la capa de datos enriquecida del backoffice (RF-024 base, US-16 campos editables).

## What Changes

- Definir y registrar en Payload las colecciones de negocio núcleo: **Products**, **Categories**, **Suppliers** (proveedores), con campos ERP de solo lectura y campos enriquecidos editables por el equipo Jeyjo.
- Adaptar la colección **Orders** del plugin e-commerce al modelo `PEDIDO_WEB` (origen, estado, cliente enlazado vía referencia lógica a `customers`, líneas con snapshot de IVA preparado).
- Añadir campos PIM bootstrap en producto: descripción larga, metadescripción (160), palabras clave, URL amigable con autogeneración, imagen proveedor URL e imagen propia (upload a `catalog-media`).
- Configurar **access control** base admin-only en colecciones de negocio; mantener `users` de Payload solo para staff (clientes web siguen en Supabase `web_profiles`).
- Implementar **hooks** `afterChange` / `afterDelete` que inserten filas en `search_events` (producto, categoría) y en `audit_log` para operaciones CRUD del backoffice.
- Reorganizar admin: grupos de navegación (Catálogo, Pedidos, Contenido), columnas por defecto y labels en español donde aplique.
- Seed de desarrollo mínimo: categorías, proveedor, productos de ejemplo con campos ERP simulados.
- Documentar convención de coexistencia con tablas Supabase (#2) y estrategia de migración Payload (`push` local vs migraciones en CI).
- **No incluye:** sync ERP real (#4, #7), motor de precios (#6), MFA/roles granulares (#5), generador SEO masivo ni auditor SEO (#21), worker Qdrant (#13), pagos Redsys (#18), bandeja OMS completa (#20), desactivación total del storefront template dentro de `apps/cms`.

## Capabilities

### New Capabilities

- `payload-catalog-collections`: Colecciones Products, Categories y Suppliers con modelo de campos Jeyjo (ERP read-only + enriquecimiento editable), relaciones y validaciones (slug único, contador metadescripción).
- `payload-order-collection`: Colección Orders adaptada a pedidos web (estados, origen B2C/B2B/EVA, líneas, totales); sin export Avansuite ni bandeja EVA.
- `payload-enrichment-fields`: Campos PIM/SEO e imagen dual en producto (RF-024 bootstrap, US-16 CA1–CA2); prioridad imagen propia sobre URL proveedor.
- `payload-backoffice-hooks`: Hooks hacia `search_events` y `audit_log`; integración con tipos de `packages/database-types`.
- `payload-ecommerce-trim`: Ajuste del plugin e-commerce: desacoplar Stripe como dependencia obligatoria, retirar variantes/USD del flujo Jeyjo v1, alinear storage a bucket `catalog-media`.

### Modified Capabilities

- `cms-app-bootstrap`: La app CMS deja de ser solo template reubicado; debe arrancar con colecciones Jeyjo registradas y seed documentado.

## Impact

- `apps/cms/src/collections/`, `plugins/index.ts`, `payload.config.ts`, hooks nuevos, seed endpoints.
- Nuevas tablas Postgres creadas por Payload adapter (`products`, `categories`, `suppliers`, `orders`, …) coexistiendo con `customers`, `web_profiles`, `search_events`, `audit_log`.
- `packages/database-types`: uso de `Database` types en hooks (insert service role o SQL vía `@supabase/supabase-js` server).
- Desbloquea ROADMAP #4 (`erp-port-adapters-contracts`), #5 (`backoffice-mfa-audit-roles`), #16 (`auth-registration-area-cliente`), #20 (`oms-pedidos-web`), #21 (`pim-seo-dual-images`).
- Cumple **RF-024** (estructura de enriquecimiento e imagen dual), **US-16** (campos editables y slug autogenerado); prepara **RNF-017** (TypeScript estricto en modelo Payload).

## Non-Goals

- Sincronización bidireccional con Avansuite (RF-023) — cambio #4.
- MFA obligatorio y roles por módulo (RF-002, RF-029) — cambio #5.
- Plantillas SEO masivas y auditor de catálogo (US-16 CA3–CA4) — cambio #21.
- Consumo de `search_events` por worker Qdrant — cambio #13.
- UI storefront real; el template `(app)` de `apps/cms` puede permanecer pero no es objetivo de este cambio.
