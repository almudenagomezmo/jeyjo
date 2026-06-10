## Context

- **#23** y **#55** implementaron histórico B2B con `PurchaseHistoryPanel` y APIs bajo `/api/intranet/purchase-history`, protegidas por `requireB2bApiSession({ section: 'orders' })`.
- **#20** expone pedidos web en Payload; `/cuenta/pedidos` listaba solo metadatos en tabla.
- El proposal original de #23 dejó `/cuenta/pedidos` fuera de US-10; este cambio cierra ese gap.

## Decisions

### 1. Reutilizar panel y servicio

**Decisión:** `/cuenta/pedidos` renderiza `PurchaseHistoryPanel` con props `apiBase="/api/account/purchase-history"`.

**Alternativa descartada:** Componente nuevo solo para B2C — duplicaría UI y mantenimiento.

### 2. APIs de cuenta separadas

**Decisión:** Rutas `/api/account/purchase-history` y `/api/account/purchase-history/repeat` con `requireCustomerApiSession` (cualquier cliente activo autenticado).

**Motivo:** No relajar el guard B2B de intranet; subusuarios con `orders: false` no deben acceder al histórico empresa pero sí a su área personal si aplica.

**Alternativa descartada:** Unificar en una sola ruta con guard dual — más acoplamiento y riesgo de bypass de permisos B2B.

### 3. Extracción de helpers compartidos

**Decisión:** `parsePurchaseHistoryFilters`, `repeatPurchaseHistoryItems` en `lib/intranet/purchase-history/` usados por ambas rutas API.

### 4. Pricing customer id

**Decisión:** `requireCustomerApiSession` usa `pricingCustomerId(ctx) ?? ctx.customerId`, igual que B2B guard, para tarifas especiales cuando el perfil B2B está validado.

## Risks

- **Datos duplicados B2B:** usuario con acceso a empresa y personal ve histórico similar en ambas rutas — aceptable; rutas sirven contextos distintos (personal vs empresa con permisos).
- **Filtro categoría:** sigue solo en API, no en UI — gap heredado de #55.
