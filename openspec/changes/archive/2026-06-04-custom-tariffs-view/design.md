## Context

- **Estado actual:** `/intranet/precios` renderiza `IntranetScaffoldPage` (cambio #22). El motor #6 resuelve precios especiales en catálogo/carrito vía Supabase `special_prices` + `group_offers`. `#4` expone `ErpPricingReader` con stub mínimo (REF-004 vigente para `B2B-EMPRESA2`). `#7` sincroniza precios ERP → Supabase desde CMS. No existe vista B2B que liste tarifas pactadas con columnas RF-020 ni acción de revisión.
- **Requisito crítico:** **US-14 CA1–CA4** y **RF-020** — tabla de precios especiales con estado Vigente/Caducado, botón de revisión solo en caducados, y bloque de ofertas de grupo activas para el grupo del cliente.
- **Dependencias completadas:** #6 pricing, #4 erp-ports, #7 pricing sync, #22 portal shell, #16 auth B2B.

## Goals / Non-Goals

**Goals:**

- Listado B2B autenticado en `/intranet/precios` con columnas RF-020 enriquecidas desde ERP + CMS.
- Cálculo server-side de vigencia (`validTo` vs fecha actual en Europe/Madrid).
- Sección separada de ofertas de grupo filtradas por `customerGroup`.
- Solicitud de revisión para filas caducadas registrada en Payload quotes inbox.
- Stub ERP ampliado con al menos un precio caducado para QA.

**Non-Goals:**

- Escritura de precios hacia ERP (#36).
- Email al comercial (#28).
- Permisos RF-003 por subusuario (#26).
- Export masivo Excel (#29).
- Mostrar precios P1 o condiciones B2C.

## Decisions

### 1. Modelo de fila `CustomTariffLineView`

**Decisión:** DTO de presentación por precio especial:

| Campo | Origen |
|-------|--------|
| `sku` | `ErpSpecialPriceDto.skuErp` |
| `productSlug`, `name`, `imageUrl` | CMS `fetchPublicProductsBySkus` |
| `minQty` | DTO ERP opcional |
| `recommendedNetPrice` | DTO ERP o P2 del producto CMS |
| `discount1Pct`, `discount2Pct` | DTO ERP; si ausentes, derivar `discount1Pct = round((1 - net/recommended)*100, 2)` |
| `netPrice` | `ErpSpecialPriceDto.netPrice` |
| `validTo` | DTO |
| `status` | `expired` si `validTo < today`; `active` si vigente o sin `validTo` |
| `engineQuote` | `resolvePrice` opcional para badge de coherencia (no sustituye neto pactado en tabla) |

**Alternativa descartada:** Mostrar solo `resolvePrice` — oculta descuentos 1/2 y P2 recomendado exigidos por RF-020.

### 2. Fuente de datos

**Decisión:**

1. Resolver `erp_code` y `customer_group` desde Supabase `customers` (mismo patrón que purchase-history).
2. `getErpAdapters().pricingReader.listSpecialPrices(erpCode)` — fuente primaria v1 stub.
3. Enriquecer SKUs con CMS publicados (wildcard excluidos de la tabla).
4. Ofertas de grupo: `listGroupOffers()` filtradas por `customerGroup` del cliente y `active === true` + vigencia.

**Alternativa descartada:** Leer solo Supabase `special_prices` — pierde columnas descuento/P2 del wire ERP hasta que el sync las persista; se mantiene ERP reader como contrato Avansuite.

### 3. Ampliación `ErpSpecialPriceDto`

**Decisión:** Añadir campos opcionales:

```ts
recommendedNetPrice?: number
discount1Pct?: number | null
discount2Pct?: number | null
minQty?: number | null
```

Stub: REF-004 vigente; añadir REF-002 caducado (`validTo` pasado) para `B2B-EMPRESA2` con descuentos explícitos.

**Alternativa descartada:** Tabla Supabase nueva — innecesaria para vista de lectura v1.

### 4. APIs storefront

**Decisión:**

- `GET /api/intranet/custom-tariffs?sku&page&pageSize` — guard B2B validado; respuesta `{ specialPrices: CustomTariffLineView[], groupOffers: GroupOfferView[], total, page }`.
- `POST /api/intranet/custom-tariffs/review-request` body `{ sku }` — valida fila caducada del cliente; crea quote Payload `segment: b2b`, `status: requested`, una línea con SKU y `observations: "Renovación precio especial — {sku}"`, `source: price_review` (campo nuevo opcional en quotes o prefijo en observations).

**Alternativa descartada:** `mailto:` comercial — no trazable en backoffice.

### 5. UI `/intranet/precios`

**Decisión:** Server page + client table (patrón purchase-history):

- Título **Precios especiales**; subtítulo explicativo US-14.
- Tabla desktop / cards móvil: foto 48–64px, columnas RF-020, badge **Vigente** (verde token) / **Caducado** (muted/warning).
- Botón **Solicitar revisión de precio** solo si `status === expired`; deshabilitado + tooltip si ya existe quote `requested` reciente (&lt;7 días) para mismo SKU (anti-spam v1).
- Bloque inferior **Ofertas de grupo activas** (tabla compacta: referencia, descripción, precio oferta, vigencia).
- Filtro texto por referencia; paginación default 25.
- Eliminar `scaffold` de `navigation.ts` para `/intranet/precios`.

**Alternativa descartada:** Pestañas vigente/caducado — filtro implícito por badge suficiente v1.

### 6. Coherencia con motor RF-007

**Decisión:** La tabla muestra **importe neto pactado** del ERP. Si `resolvePrice` para el SKU devuelve `special_price` con neto distinto al caducado, la fila caducada sigue mostrando el pactado histórico y el botón de revisión; filas vigentes pueden mostrar tooltip si motor y ERP difieren (sync lag).

**Alternativa descartada:** Ocultar filas caducadas — viola RF-020.

### 7. Exclusión wildcard

**Decisión:** Misma regla que purchase-history / PLP — no listar SKUs comodín.

## Risks / Trade-offs

- **[Stub no refleja columnas Avansuite reales]** → Documentar mapping en comentario stub; ampliar fixtures cuando Jeyjo confirme wire format (#36).
- **[Descuentos derivados vs ERP]** → Preferir campos ERP cuando existan; derivación solo fallback con badge tooltip "Calculado".
- **[Spam de revisiones]** → Dedupe 7 días por SKU en POST; mensaje claro al usuario.
- **[Sync lag Supabase vs stub]** → Vista lee ERP reader en v1; motor de carrito sigue Supabase — aceptable en staging con stub único.

## Migration Plan

1. Ampliar DTOs y stub en `@jeyjo/erp-ports` + tests.
2. Implementar servicio `buildCustomTariffsPage` y rutas API.
3. Sustituir página intranet y quitar scaffold nav.
4. Seed/staging: verificar `empresa2@test.com` ve REF-004 vigente y REF-002 caducado.
5. Rollback: revertir página a scaffold (sin migración DB obligatoria salvo campo opcional `source` en quotes).

## Open Questions

- Confirmar con Jeyjo si Avansuite expone **descuento 1** y **descuento 2** como porcentajes independientes o si v1 puede usar solo descuento 1 derivado.
- ¿Campo `source` en colección `quotes` o solo observación prefijada? (Implementación: observación prefijada si no hay consenso.)
