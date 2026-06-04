## Context

- **Estado actual:** `/intranet/pedido-rapido` usa `IntranetScaffoldPage` (cambio #22). El carrito (#12) expone `addItems` tras repeat del histórico (#23). `fetchPublicProductPdpBySlug` resuelve slug o `skuErp` pero no OEM/EAN en una sola entrada. No hay parser Excel en storefront (solo `exceljs` en `packages/order-export` para export OMS). Checkout ya persiste `observations` (500 chars, #17).
- **Requisitos:** **RF-019**, **US-11** (CA1–CA4), **RF-013** (indexación referencias), **RF-007/RF-011** (precio B2B al añadir). Depende de #12 y #22 completados.
- **Stakeholders:** subusuarios B2B (compradores con listas de referencias), equipo Jeyjo (observaciones de pedido con referencias no catalogadas).

## Goals / Non-Goals

**Goals:**

- Lookup server-side por referencia (SKU / OEM / EAN) con preview y precio B2B.
- Excel cliente → validación batch → add-to-cart en una acción (hasta 200 filas).
- Solicitudes no catalogadas en sessionStorage → merge en checkout observations.
- APIs autenticadas B2B bajo `/api/intranet/quick-order/*`.
- Tests unit + integración + E2E staging.

**Non-Goals:**

- Importador catálogo backoffice (#29), permisos subusuario (#26), área B2C, API escritura ERP (#36).
- Líneas de carrito con SKU comodín o productos no publicados.

## Decisions

### 1. Resolver `resolveProductByReference(ref)`

**Decisión:** Nuevo helper en `apps/storefront/src/lib/catalog/resolve-product-by-reference.ts`:

1. Normalizar `ref.trim().toUpperCase()` para comparación EAN; conservar original para display.
2. Consultar CMS en orden: `skuErp` equals → si miss, `oemRef` equals → si miss, `ean` equals.
3. Aplicar `isPublicCatalogProduct` (excluye draft + wildcard RF-006).
4. Devolver `{ doc, matchedField: 'sku' | 'oem' | 'ean' }`.

**Alternativa descartada:** Una query Payload `or` — depende de soporte REST; si falla en QA, mantener tres fetches secuenciales cacheados (mismo patrón que PDP).

### 2. APIs intranet (paridad con purchase-history)

**Decisión:**

| Método | Ruta | Rol |
|--------|------|-----|
| GET | `/api/intranet/quick-order/lookup?ref=` | Preview + `PriceQuote` |
| POST | `/api/intranet/quick-order/validate-batch` | Body multipart file o JSON `{ items: [{ref, qty}] }` → filas `ok` / `not_found` / `invalid_qty` |
| POST | `/api/intranet/quick-order/add-to-cart` | Body `{ items: [{ sku, qty }] }` → `{ additions: [{ productId, qty, quote }] }` |

Auth: mismo guard que `purchase-history` (`isB2bValidated`). Reutilizar `fetchPublicProductsBySkus` + `resolvePriceQuotesBatch` tras resolver slugs.

**Alternativa descartada:** Solo cliente sin POST add — riesgo de slugs/precios incorrectos.

### 3. Parser Excel

**Decisión:** Añadir dependencia `xlsx` (SheetJS) en `apps/storefront` — alineado a arquitectura MOD-06; bundle solo en rutas API/server. Primera hoja; fila 1 = cabeceras; mapa flexible:

- Referencia: `referencia`, `reference`, `ref`, `sku`
- Cantidad: `cantidad`, `quantity`, `qty`, `unidades`

Cantidad vacía → 1. Máx. 200 filas, 5 MB. Generar plantilla con `xlsx` en `GET /api/intranet/quick-order/template` o estático en `public/templates/quick-order.xlsx`.

**Alternativa descartada:** `exceljs` desde `order-export` — acopla storefront a paquete de export OMS y peso mayor.

### 4. UI `/intranet/pedido-rapido`

**Decisión:** Layout intranet existente (`IntranetSectionLayout`). Secciones:

1. **Entrada manual** — `ReferenceLookupField` (debounce 400ms), `QtyStepper` con `packUnit` del preview, botón Añadir.
2. **Excel** — dropzone, tabla resultado validate-batch, CTA "Añadir N válidas", enlace plantilla.
3. **No catalogadas** — panel visible tras 404 lookup; lista editable; botón eliminar por ítem.

Quitar entrada `scaffold` de `navigation.ts` para esta ruta (igual que pedidos #23).

**Alternativa descartada:** Modal único — peor UX para listas largas Excel.

### 5. No catalogadas → checkout

**Decisión:** `sessionStorage` key `jeyjo-non-catalog-requests` (array JSON). Hook `useNonCatalogRequests` en storefront. Checkout delivery step:

- Al montar, si hay pendientes, append `\n\nReferencias no catalogadas:\n- REF: nota` al textarea observations (sin sobrescribir texto manual existente).
- Tras `place-order` OK, `clearNonCatalogRequests()`.

**Alternativa descartada:** Nueva colección Payload — exceso para v1; observaciones ya llegan a OMS.

### 6. Cantidades y envase cerrado

**Decisión:** Servidor valida `qty > 0` entero. Cliente aplica redondeo a múltiplo de `packUnit` con el mismo aviso que PDP/carrito antes de llamar add-to-cart.

### 7. Feature flag y rollback

**Decisión:** `QUICK_ORDER_ENABLED` (default `true` en dev). Si `false`, restaurar scaffold vía página condicional.

## Risks / Trade-offs

- **[OEM/EAN duplicados en CMS]** Dos productos con mismo EAN → primera coincidencia Payload; Mitigation: documentar unicidad PIM; log warning en servidor.
- **[Tamaño bundle xlsx]** Parseo solo en Route Handlers (Node runtime), no en client bundle.
- **[500 chars observations]** Muchas no catalogadas pueden truncar — Mitigation: UI contador y validación antes de place order.
- **[Subusuarios sin restricción]** v1 histórico + quick order visibles para toda la empresa — aceptado hasta #26.

## Migration Plan

1. Añadir `xlsx` y helpers catalog + APIs con tests.
2. Implementar UI pedido rápido y hook non-catalog.
3. Extender checkout observations merge; tests integración.
4. Actualizar `intranet-portal.test.ts` y E2E.
5. Rollback: `QUICK_ORDER_ENABLED=false` o revertir página a scaffold.

## Open Questions

- ¿Payload soporta `where[or][0][skuErp][equals]` en REST? **Default: tres queries secuenciales hasta confirmar en QA.**
- ¿Mostrar semáforo stock en preview? **Default: opcional badge read-only, no bloquear add.**
- ¿Permitir `.csv` además de xlsx? **Default: solo xlsx/xls en v1.**
