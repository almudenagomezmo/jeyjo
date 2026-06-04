## Context

- **Estado actual:** `/intranet/pedidos` renderiza `IntranetScaffoldPage` (cambio #22). El carrito (#12) persiste líneas por `productId` (slug CMS) y precios vía `/api/pricing/batch`. OMS (#20) persiste pedidos web en Payload con `customerRef`, líneas y snapshots de IVA al confirmar. No existe puerto ERP de historial de compras; `ErpDocumentsReader` lanza `ERP_NOT_IMPLEMENTED` hasta #37.
- **Requisito crítico:** **CA-B2B-004** — mostrar y cobrar **precio actual** (`resolvePrice`), nunca el importe histórico del albarán/pedido ERP como precio vigente. El precio pagado en su día puede mostrarse como referencia secundaria tachada o en tooltip, pero no como precio de línea ni al añadir al carrito.
- **US-10** nombra subsección **“Histórico de pedidos > Datos histórico”**; v1 implementa una sola vista en `/intranet/pedidos` (cabeceras de pedido/albarán quedan para integración documental #37).
- **Dependencias completadas:** #6 pricing, #12 cart, #20 OMS, #22 portal shell.

## Goals / Non-Goals

**Goals:**

- Listado B2B autenticado con filtros (fecha, referencia, categoría, sede opcional).
- Agregación por SKU con cantidad habitual, última compra y metadatos CMS (foto grande).
- Precio actual etiquetado y repetición al carrito con validación server-side.
- Puerto `ErpPurchaseHistoryReader` + stub acordado con fixtures **CA-B2B-004**.
- Complementar stub con líneas agregadas de pedidos web `confirmed+` del mismo `customerRef`.

**Non-Goals:**

- Gráficos de consumo, export Excel del histórico, cabeceras de albarán con PDF.
- Tabla materializada en Supabase sincronizada por cron ERP.
- Permisos RF-003 por subusuario.
- B2C `/cuenta/pedidos`.
- Campo libre de artículos no catalogados (delegado a #24).

## Decisions

### 1. Modelo de fila agregada `PurchaseHistoryLine`

**Decisión:** DTO unificado por SKU:

| Campo | Origen |
|-------|--------|
| `sku` | ERP / pedido web |
| `productSlug` | CMS lookup (nullable si solo ERP) |
| `name`, `imageUrl`, `categoryIds` | CMS enriquecimiento |
| `usualQty` | Última cantidad en la línea más reciente (por `lastPurchasedAt`) |
| `lastPurchasedAt` | Max fecha entre fuentes |
| `historicalUnitPrice` | Solo ERP/stub o snapshot pedido web (informativo) |
| `department` | ERP opcional |
| `currentQuote` | `PriceQuote` de `resolvePrice` en servidor |

**Alternativa descartada:** Una fila por línea de albarán sin agregar — listas enormes y peor UX para recompra habitual.

### 2. Fuentes de datos y merge

**Decisión:**

1. `ErpPurchaseHistoryReader.listLines({ erpCustomerCode, from, to, sku?, department? })` → líneas stub/API.
2. `loadWebPurchaseLines(customerId)` → consulta Payload REST (server) pedidos `origin` b2c|b2b, `jeyjoStatus` ∈ `confirmed`, `preparing`, `shipped`, `delivered`, ventana 5 años.
3. `mergePurchaseHistoryLines(erp, web)` por SKU: `lastPurchasedAt` = max; `usualQty` de la fuente más reciente; `historicalUnitPrice` de esa misma fuente.

**Alternativa descartada:** Solo pedidos web — no cubre clientes con histórico solo en Avansuite pre-migración.

### 3. Puerto ERP en `packages/erp-ports`

**Decisión:** Nuevo `ErpPurchaseHistoryReader` en `ports/purchase-history-reader.ts` con DTO `ErpPurchaseHistoryLine`. Stub en `adapters/stub/purchase-history-reader.ts` indexado por `erp_customer_code` (fixtures incluyen `empresa@test.com` / REF-010 escenario CA-B2B-004). Export en `createStubErpBundle()`.

**Alternativa descartada:** Reutilizar `ErpDocumentsReader` — semántica distinta (documentos vs líneas de consumo agregadas).

### 4. APIs storefront

**Decisión:**

- `GET /api/intranet/purchase-history?from&to&sku&categoryId&department&page&pageSize` — requiere sesión B2B validada (`isB2bValidated`); responde `{ lines, total, filters }` con `currentQuote` ya resuelto.
- `POST /api/intranet/purchase-history/repeat` body `{ items: [{ sku, qty }] }` — valida SKUs publicados no wildcard, resuelve slugs, devuelve `{ additions: [{ productId, qty, quote }] }` para que el cliente llame `addItem` en batch (o extiende store con `addItems`).

**Alternativa descartada:** Mutar carrito solo en cliente sin POST — riesgo de precios desactualizados y SKUs inválidos.

### 5. UI `/intranet/pedidos`

**Decisión:** Server page con shell intranet existente; panel de filtros (client) + tabla desktop / cards móvil (patrones jeyjo-next: foto 64–80px, checkbox por fila, sticky bar “Añadir al carrito (N)”). Badge **“Precio actual”** junto al importe neto B2B. Si `historicalUnitPrice` difiere de `currentQuote.netUnit`, mostrar histórico tachado en texto secundario.

Subtítulo de página: **“Datos histórico”** (US-10). Eliminar scaffold de `navigation.ts` para esta ruta.

### 6. Exclusión wildcard RF-006

**Decisión:** Filtrar en servidor con misma regla que PLP (`isWildcard` CMS o lista de SKUs comodín en env). No indexar en stub ERP.

### 7. Filtro categoría

**Decisión:** `categoryId` filtra por pertenencia del producto CMS a esa categoría (o descendientes vía slug path). Líneas sin producto CMS no aparecen si el filtro categoría está activo.

### 8. Repetir pedido → carrito

**Decisión:** Tras POST repeat exitoso, cliente ejecuta `addItems` (nuevo método en `cart-store` que itera `addItem`) y abre `MiniCart`. Toast con enlace a `/cart` y copy sobre observaciones en checkout.

**Alternativa descartada:** Redirigir directo a checkout — salta revisión de cantidades en carrito.

### 9. Lectura Payload desde storefront

**Decisión:** Helper `lib/orders/fetch-customer-orders.ts` usando `PAYLOAD_API_URL` + service key o patrón existente de lectura CMS en storefront (mismo que catálogo). Solo campos necesarios: `customerRef`, `createdAt`, `jeyjoStatus`, `lineItems` (sku, qty, unit price snapshot).

## Risks / Trade-offs

- **[Stub no representa ERP real]** QA valida contrato; API Avansuite sustituye adapter sin cambiar UI → documentar columnas esperadas en spec `erp-purchase-history-reader`.
- **[Doble fuente duplica SKU]** Merge por fecha evita doble fila; si cantidades difieren, gana la compra más reciente → Mitigation: test de merge.
- **[SKU sin producto CMS]** Repetir pedido falla para esa línea con mensaje “No disponible en catálogo” → Mitigation: deshabilitar checkbox y tooltip.
- **[Performance batch pricing]** Muchas filas en una página → paginación default 25 + pricing batch por página únicamente.
- **[Subusuarios ven todo el histórico empresa]** Aceptado v1; #26 restringirá.

## Migration Plan

1. Añadir puerto y stub en `erp-ports`; fixtures seed documentados en README del cambio.
2. Implementar merge + APIs; tests unitarios.
3. Sustituir página pedidos y quitar `scaffold` de `INTRANET_PRIMARY_NAV` para `/intranet/pedidos`.
4. Actualizar delta spec `storefront-b2b-portal-shell` al archivar.
5. Rollback: restaurar `IntranetScaffoldPage` y desactivar rutas API (feature flag `PURCHASE_HISTORY_ENABLED` opcional en env).

## Open Questions

- ¿Mostrar precio histórico tachado siempre o solo cuando difiere > 1 céntimo? **Default: solo si difiere.**
- ¿Incluir pedidos B2C del mismo email antes de validación B2B? **Default: no; solo `customerRef` de la sesión actual.**
- ¿Ventana 5 años hard-coded o `PURCHASE_HISTORY_YEARS=5`? **Default: env con fallback 5.**
