## Context

- **Estado actual:** El storefront renderiza estrellas en PDP y PLP, pero `fetch-product-list.ts` hardcodea `rating: 4.5, reviews: 0` y `mapPdpDocToView` devuelve `rating: null, reviews: null`. No hay colección ni API de reseñas.
- **Patrones existentes:** RMA y presupuestos usan colección Payload + API key del storefront (`STOREFRONT_PAYLOAD_API_KEY`) para `create`; staff modera desde CMS. Historial de compras combina pedidos web (`orders.orderLineSnapshots`, estados `confirmed|preparing|shipped|delivered`) con líneas ERP vía `@jeyjo/erp-ports`.
- **Decisiones de producto (explore):** solo logueados; moderación obligatoria; compra verificada; nombre personal (`displayName`); staff no crea reseñas; edición vuelve a `pending`.
- **Dependencias:** auth clientes (#16), OMS pedidos (#20), purchase-history (#23), PDP (#11), PLP (#10).

## Goals / Non-Goals

**Goals:**

- Colección `product-reviews` en Payload con ciclo `pending` → `approved` | `rejected`.
- Storefront: formulario en PDP, API segura, listado público de aprobadas, estados para el autor.
- Verificación de compra reutilizando `fetchWebPurchaseHistoryLines` + ERP reader (misma ventana `PURCHASE_HISTORY_YEARS`).
- Agregados `reviewCount` y `ratingAverage` en `products`, recalculados por hooks.
- Bandeja CMS con filtros y acciones de moderación.
- PLP/PDP muestran agregados reales; sin estrellas si `reviewCount === 0`.

**Non-Goals:**

- Reseñas anónimas, creación manual por staff, respuestas oficiales, emails, JSON-LD `aggregateRating`.
- Tabla Supabase paralela (Payload es fuente de verdad).
- Moderación automática o IA.

## Decisions

### 1. Payload como fuente de verdad (no Supabase)

**Decisión:** Colección `product-reviews` en Payload, igual que RMA/quotes.

**Alternativa descartada:** Tabla `product_reviews` en Supabase — duplicaría moderación fuera del CMS y complicaría la bandeja staff.

### 2. Access control

**Decisión:**

| Operación | Quién |
|-----------|-------|
| `create` | Storefront API key únicamente |
| `update` (rating/comment) | Storefront API key, solo documento del autor, fuerza `pending` |
| `update` (status) | Staff `catalogo` o `superadmin` |
| `read` (admin) | Staff `catalogo` o `superadmin` |
| `read` (público) | Storefront server-side, solo `approved` |
| `create` (staff UI) | Denegado |
| `delete` | Staff `catalogo` o `superadmin` |

Reutilizar `isStorefrontQuoteApiKey` (o helper compartido `isStorefrontPayloadApiKey`) del patrón quotes/RMA.

### 3. Modelo de documento

**Campos:**

```ts
product          // relationship → products (required)
skuErp           // text, denormalizado desde producto
customerId       // text, Supabase customers.id
webProfileId     // text, auth uid (unicidad)
authorDisplayName // text, snapshot de web_profiles.display_name
rating           // number 1–5
comment          // textarea, plain text, max 2000 chars
status           // pending | approved | rejected
rejectionNote    // textarea, staff-only, opcional
moderatedBy      // relationship → users, opcional
moderatedAt      // date, opcional
```

**Unicidad:** índice único `(webProfileId, product)` vía campo compuesto `reviewKey = `${webProfileId}:${productId}`` o hook `beforeValidate` que rechace duplicados.

**Producto (campos nuevos):**

```ts
reviewCount: number, default 0
ratingAverage: number | null  // null si reviewCount === 0
```

### 4. Ciclo de vida y re-edición

```
create/edit (storefront) → pending
staff approve → approved (visible, cuenta en agregados)
staff reject → rejected (no visible, no cuenta en agregados)
author edit (approved|rejected) → pending (deja de contar hasta re-aprobar)
```

Hook `afterChange` / `afterDelete` en `product-reviews` recalcula agregados del producto vinculado:

```sql
SELECT AVG(rating), COUNT(*) FROM product_reviews WHERE status = 'approved' AND product_id = ?
```

Implementación vía `payload.find` con `where[status][equals]=approved`.

### 5. Verificación de compra

**Decisión:** Función `assertCustomerPurchasedSku(customerId, sku)` en storefront:

1. `fetchWebPurchaseHistoryLines(customerId)` — pedidos con `jeyjoStatus` en `CONFIRMED_STATUSES`.
2. Si `customers.erp_code` existe, merge con `createStubPurchaseHistoryReader().listLines` (misma ventana que `PURCHASE_HISTORY_YEARS`, default 5 años).
3. `true` si cualquier línea tiene `sku` igual (case-insensitive trim).

**B2B subusuarios:** usar `customerId` del `CustomerContext` del usuario logueado; si el pedido figura bajo empresa padre, verificar si `customerRef` en orders usa empresa o perfil — alinear con el mismo `customerId` que purchase-history (#23).

### 6. Nombre personal obligatorio

**Decisión:** Si `displayName` es null o vacío, el formulario de reseña muestra bloqueo con enlace a completar perfil (`/cuenta` o futuro editor de perfil). Al enviar, snapshot `authorDisplayName` desde `displayName` (no `commercialName`).

**Display público:** mostrar `authorDisplayName` tal cual (sin enmascarar en v1; el usuario controla su display name).

### 7. API storefront

**Rutas:**

- `GET /api/products/[slug]/reviews` — lista `approved` paginada (público, server-side CMS read).
- `GET /api/products/[slug]/reviews/mine` — reseña del usuario logueado (cualquier status) o 404.
- `POST /api/products/[slug]/reviews` — crear (sesión + compra verificada + displayName).
- `PATCH /api/products/[slug]/reviews` — editar propia (→ `pending`).

Todas las mutaciones proxean a Payload REST con API key; nunca exponer la key al cliente.

**Validación:** `rating` entero 1–5; `comment` 10–2000 caracteres, sin HTML (strip tags).

### 8. UI PDP

**Decisión:** Nueva pestaña "Valoraciones" en `ProductTabs` (client component con datos SSR iniciales).

Estados UI:

| Condición | UI |
|-----------|-----|
| No logueado | CTA login con `?next=` |
| Logueado, sin compra | Mensaje informativo |
| Logueado, sin displayName | Mensaje + link perfil |
| Logueado, puede valorar | Formulario estrellas + textarea |
| Tiene reseña pending | Banner + formulario edición |
| Tiene reseña rejected | Banner + formulario edición |
| Tiene reseña approved | Listado incluye la suya; puede editar (vuelve pending) |

Listado: solo `approved`, orden `createdAt` desc, paginación 10.

Cabecera PDP: estrellas desde `ratingAverage`/`reviewCount` del producto (ya existe markup, activar con datos reales).

### 9. CMS bandeja

**Decisión:** Vista dedicada `/admin/product-reviews` (patrón RMA inbox / quotes inbox) además de colección estándar.

Columnas: estado, producto (título + SKU), rating, autor, fecha, badge "Re-edición" si `previousStatus === approved` y `status === pending`.

Filtros: status (default `pending`), búsqueda por SKU o autor.

Acciones: Aprobar, Rechazar (nota opcional).

Staff role: `catalogo` + `superadmin` en `COLLECTION_ACCESS`.

### 10. PLP agregados

**Decisión:** `mapDocToRow` lee `reviewCount` y `ratingAverage` del producto CMS. Si `reviewCount === 0`, cards no muestran estrellas. Eliminar hardcode `4.5`.

Ordenación `?sort=rating` usa `ratingAverage` real (productos sin reseñas al final o con 0).

## Risks / Trade-offs

| Riesgo | Mitigación |
|--------|------------|
| Re-edición approved → pending baja rating temporalmente | Comportamiento esperado; banner "pendiente de revisión" |
| ERP stub sin compras en dev | Tests con pedidos web Payload; documentar en seed |
| `displayName` vacío bloquea muchos usuarios | Mensaje claro; considerar prompt en cuenta (fuera de scope) |
| Spam de re-envíos tras reject | Un doc por usuario/producto; staff puede delete |
| Recálculo agregados costoso | Solo en afterChange de reviews (~bajo volumen v1) |
| Race en create duplicado | Unique constraint + 409 en API |

## Migration Plan

1. Añadir campos `reviewCount`/`ratingAverage` a `products` (default 0 / null).
2. Crear tabla `product_reviews` vía migración Payload.
3. Desplegar CMS antes que storefront (campos nuevos son backward-compatible).
4. Desplegar storefront (quita placeholder PLP).
5. Rollback: ocultar pestaña valoraciones por feature flag si necesario; agregados en 0 no rompen UI.

## Open Questions

- Ninguna bloqueante; `displayName` editable en `/cuenta` puede requerir tarea menor si no existe editor hoy.
