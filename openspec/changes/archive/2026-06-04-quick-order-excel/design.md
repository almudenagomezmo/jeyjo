## Context

- **Estado actual:** `/intranet/pedido-rapido` renderiza `IntranetScaffoldPage` (cambio #22). El carrito (#12) persiste por slug CMS (`productId`) con `addItem` / `addItems`. El histórico (#23) valida SKUs en servidor y devuelve additions para batch add. PDP ya resuelve producto por slug con fallback `skuErp` (`fetchPublicProductPdpBySlug`); no existe lookup por `oemRef` ni `ean` ni API intranet dedicada.
- **Requisito:** **RF-019** — validación en tiempo real, Excel Referencia/Cantidad, campo libre no catalogado. **US-11** CA2 exige nombre, foto y precio antes de añadir.
- **Dependencias completadas:** #12 cart, #22 portal, #6 pricing, #7 catálogo CMS.

## Goals / Non-Goals

**Goals:**

- Lookup B2B por referencia (SKU Jeyjo, OEM, EAN) con preview y precio actual.
- Parseo Excel server-side con resumen de errores por fila.
- Batch add al carrito con validación server-side (publicado, no wildcard, slug resuelto).
- Flujo UX para referencias no catalogadas vinculado a observaciones de checkout.
- Plantilla descargable y tests **RF-019** (10 filas válidas).

**Non-Goals:**

- Permisos por subusuario (#26), pedido rápido B2C, importador PIM (#29).
- Crear SKU o presupuesto automático por texto libre.
- OCR, CSV (solo Excel v1 salvo extensión trivial en parser).

## Decisions

### 1. Modelo `QuickOrderLinePreview`

**Decisión:** DTO devuelto por lookup y filas Excel validadas:

| Campo | Uso |
|-------|-----|
| `inputReference` | Texto introducido por usuario |
| `sku` | `skuErp` canónico |
| `productSlug` | Slug CMS para `cart-store` |
| `title`, `imageUrl` | CMS |
| `qty` | Cantidad solicitada |
| `quote` | `PriceQuote` B2B sesión |
| `stockIndicator` | Opcional, informativo |
| `matchedBy` | `sku` \| `oem` \| `ean` |
| `status` | `ok` \| `not_found` \| `wildcard` \| `invalid_qty` |

**Alternativa descartada:** Resolver solo en cliente contra CMS REST — expone secret y no aplica wildcard server-side.

### 2. Lookup CMS `resolveProductByReference`

**Decisión:** Helper en `lib/intranet/quick-order/resolve-reference.ts`:

1. Normalizar entrada (`trim`, mayúsculas opcionales solo para EAN).
2. Buscar en orden: `skuErp` equals → `oemRef` equals → `ean` equals (Payload REST server-side, `depth: 1`, `published`, `isPublicCatalogProduct`).
3. Primera coincidencia gana; si múltiples OEM duplicados, preferir SKU con `updatedAt` más reciente (log warning).
4. Aplicar exclusión wildcard (`catalog-wildcard-exclusion`).

**Alternativa descartada:** Qdrant semantic search — impreciso para referencias exactas B2B.

### 3. APIs storefront

**Decisión:**

| Método | Ruta | Body | Respuesta |
|--------|------|------|-----------|
| POST | `/api/intranet/quick-order/lookup` | `{ reference, qty? }` | `{ preview: QuickOrderLinePreview }` |
| POST | `/api/intranet/quick-order/parse-excel` | `multipart/form-data` file | `{ rows: QuickOrderLinePreview[], errors: string[] }` |
| POST | `/api/intranet/quick-order/add` | `{ items: [{ reference, qty }] }` | `{ additions: [{ productId, qty, quote }], uncatalogued?: [] }` |

Todas usan `requireB2bApiSession()` (#23). `add` reutiliza lógica de validación que `purchase-history/repeat` (SKUs publicados, slugs).

**Alternativa descartada:** Un solo endpoint polivalente — peor ergonomía y límites body distintos (Excel vs JSON).

### 4. Parser Excel

**Decisión:** Dependencia `xlsx` en `apps/storefront`. Server route lee primera hoja; detecta fila cabecera con columnas que matcheen regex `(?i)referencia` y `(?i)cantidad`; datos desde fila siguiente. Máx. 500 filas datos. Acepta `.xlsx` y `.xls`. Tras parseo, cada fila pasa por `resolveProductByReference` en batch (concurrencia 8).

Plantilla estática en `public/intranet/plantilla-pedido-rapido.xlsx` generada en build o committed (2 columnas ejemplo).

**Alternativa descartada:** Parseo solo en browser — no valida wildcard ni pricing antes de mostrar resumen.

### 5. UI `/intranet/pedido-rapido`

**Decisión:** Server page + client `QuickOrderPanel`:

- **Bloque manual:** input referencia, input cantidad (entero ≥ 1), debounce 300ms → `lookup`, card preview (imagen 64px, refs, **Precio actual**, stock badge), CTA añadir.
- **Bloque Excel:** dropzone + file input, tabla resultado (estado por fila, checkbox solo `ok`), CTA **Añadir seleccionadas (N)** / **Añadir todas las válidas**.
- **Bloque no catalogado:** visible cuando último lookup `not_found`; textarea descripción + cantidad + **Guardar solicitud** → `sessionStorage` key `jeyjo-uncatalogued-requests`.
- Tras `add` exitoso: `addItems` en store, abrir `MiniCart`, toast con enlace `/cart`.

Patrones visuales: tokens `globals.css`, layout intranet existente (sidebar #22).

**Alternativa descartada:** Wizard multi-paso — innecesario para US-11.

### 6. Solicitudes no catalogadas → checkout

**Decisión:** `lib/checkout/uncatalogued-requests.ts` lee `sessionStorage` en cliente checkout; al `prepare`, serializa en campo `observations` o bloque append:

```
[Solicitudes no catalogadas]
- REF-XYZ x2: Tóner compatible modelo X
```

Limpia storage tras pedido confirmado. No crea línea de carrito.

**Alternativa descartada:** Línea carrito pseudo-producto — rompe pricing y OMS.

### 7. Integración carrito

**Decisión:** Cliente llama `POST .../add` → respuesta `additions` → `useCartStore.getState().addItems(additions.map(a => ({ productId: a.productId, qty: a.qty })))`. Precios se refrescan vía `useCartSummary` existente.

Extender spec `storefront-cart-minicart` con escenario pedido rápido (paralelo a histórico).

### 8. Navegación portal

**Decisión:** Eliminar entrada scaffold / badge "Próximamente" de `navigation.ts` para `pedido-rapido` (igual que #23 en pedidos).

## Risks / Trade-offs

- **[OEM/EAN duplicados en CMS]** → Mitigation: orden determinista + test con fixture único.
- **[Excel mal formado]** → Mitigation: errores por fila en UI; no partial add sin confirmación usuario.
- **[Límite 500 filas + serverless timeout]** → Mitigation: cap documentado; batch pricing por chunks de 25.
- **[xlsx bundle size]** → Mitigation: import dinámico solo en route handler server.
- **[Subusuarios sin restricción]** → Aceptado v1; #26 añadirá gate.

## Migration Plan

1. Implementar APIs y panel; feature sin flag (ruta ya existe).
2. Actualizar `navigation.ts` (quitar scaffold).
3. Desplegar storefront; verificar manual US-11 en staging con cuenta B2B demo.
4. Rollback: revertir página a `IntranetScaffoldPage` (una línea).

## Open Questions

1. ¿Avansuite usa otras cabeceras Excel habituales además de Referencia/Cantidad? (v1 estricto US-11; ampliar alias en #29 si aplica.)
2. ¿Cantidad debe respetar `packUnit` redondeo al alza como PDP? (Propuesta: sí, mismo helper `roundQtyToPack`.)
