## Context

- **Estado actual:** `/cart` y `/checkout` usan `validateDemoCoupon` con códigos fijos (`BLOG5`, `MAYO10`) en `apps/storefront/src/lib/checkout/coupon.ts`. El descuento se aplica al subtotal completo sin excluir líneas en oferta — incumple **CA-CHECKOUT-005**. El carrito vive solo en `zustand` + `localStorage` (`jeyjo-cart`); no hay snapshot server-side para recovery. Payload tiene colección `carts` del plugin ecommerce (seed demo USD) no alineada con el storefront Jeyjo. OMS (#20) ya persiste `couponCode` en pedidos. Emails transaccionales (#28) usan Resend/Mailpit; **RI-009** lista recovery abandoned cart como pendiente.
- **Requisitos:** **RF-027**, **US-18**, **US-23**, **CA-CHECKOUT-004/005**, **RI-009**. Dependencias #17 checkout, #20 OMS, #6 price engine completadas.
- **Restricciones:** TypeScript estricto; tokens UI en `globals.css`; validación cupón siempre server-side en prepare/place-order; no acumular cupón sobre `group_offer`.

## Goals / Non-Goals

**Goals:**

- CRUD cupones en Payload con reglas de negocio (caducidad, usos, mínimo).
- Validación real en storefront con exclusión de líneas en oferta.
- Persistencia abandoned cart B2C en Supabase + cron emails 2h/24h.
- Panel marketing en CMS y global settings configurables.
- Tests CA-CHECKOUT-004/005 y job recovery.

**Non-Goals:**

- Reglas de precio por categoría/fabricante/atributo (RF-027 párrafo amplio — ya en pricing-engine).
- Recovery guest/anónimo, notificaciones in-app B2C, dashboard KPIs (#30).
- Payload `carts` plugin; multi-cupón; auto-apply sin código.

## Decisions

### 1. Colección Payload `coupons`

**Decisión:** Nueva colección en `apps/cms/src/collections/Coupons/`:

```text
code (text, unique, uppercase, indexed)
discountType: 'percent' | 'fixed'
discountValue (number)          -- percent 1-100 or fixed EUR net
minimumOrderAmount (number, default 0)
validFrom (date)
validUntil (date)
maxUses (number, nullable)      -- null = unlimited
usesCount (number, default 0, read-only in admin)
active (checkbox, default true)
source: 'manual' | 'recovery'   -- recovery = auto-generated
recoveryCartId (uuid, nullable) -- link to snapshot when source=recovery
```

Hooks:
- `beforeValidate`: normalizar `code` a uppercase; rechazar duplicados.
- `beforeChange`: si `validUntil < now`, forzar `active = false`.
- Cron diario opcional desactiva cupones caducados (US-18 CA4).

**Alternativa descartada:** Tabla Supabase para cupones — el staff ya opera en Payload; evita doble fuente de verdad.

### 2. Global `marketing-settings`

**Decisión:** Payload global (singleton) `marketing-settings`:

```text
abandonedCartEnabled (bool, default true)
firstEmailDelayMinutes (number, default 120)
secondEmailDelayMinutes (number, default 1440)
secondEmailDiscountPercent (number, default 10)  -- hasta confirmación Dirección
secondEmailUseFixedCoupon (relationship coupons, nullable)
b2bRecoveryEnabled (bool, default false)
b2bRecoveryCustomerGroups (json array of group codes)
```

**Alternativa descartada:** Campos en `.env` — staff debe cambiar delays sin deploy.

### 3. Motor de validación (`coupon-validation-engine`)

**Decisión:** Módulo `apps/storefront/src/lib/coupon/validate.ts` (importable desde CMS thin wrapper para recovery job):

```ts
validateCoupon({ code, lines, products, quotes, segment }) → {
  valid: boolean
  coupon: { code, discountType, discountValue, label }
  eligibleSubtotal: number
  discountAmount: number
  ineligibleOfferLines: string[]  // lineIds on group_offer
  errors: CouponErrorCode[]
}
```

Reglas:
1. Fetch cupón activo por `code` vía Payload REST (CMS_URL) o cache 60s.
2. Comprobar fechas, `usesCount < maxUses`, `eligibleSubtotal >= minimumOrderAmount`.
3. `eligibleSubtotal` = suma `lineTotal` donde `quotes[sku].appliedRule !== 'group_offer'`.
4. `percent`: `discount = round2(eligibleSubtotal * value / 100)`.
5. `fixed`: `discount = min(value, eligibleSubtotal)`.
6. Si hay líneas excluidas y cupón válido → flag `showOfferExclusionWarning` (**CA-CHECKOUT-005**).

`buildCheckoutTotals` deja de importar `validateDemoCoupon`; recibe resultado precomputado o llama al motor en server routes.

**Alternativa descartada:** Validación solo client-side — inseguro para place-order.

### 4. APIs storefront cupón

**Decisión:**

| Endpoint | Rol |
|----------|-----|
| `POST /api/cart/coupon` | Body `{ code }` + cart lines from body; devuelve discount preview |
| `POST /api/checkout/validate-coupon` | Misma validación con pricing server-side (prepare token path) |
| `DELETE /api/cart/coupon` | Limpia `sessionStorage` key |

Client: `/cart` llama API al aplicar; persiste código en `CHECKOUT_COUPON_STORAGE_KEY` (existente).

### 5. Tabla Supabase `abandoned_cart_snapshots`

**Decisión:**

```text
abandoned_cart_snapshots (
  id uuid PK,
  web_profile_id uuid FK UNIQUE,  -- one active snapshot per B2C profile
  customer_id uuid FK,
  lines jsonb NOT NULL,           -- [{ productId, qty }]
  last_activity_at timestamptz NOT NULL,
  status text DEFAULT 'active',   -- active | converted | abandoned
  first_email_sent_at timestamptz,
  second_email_sent_at timestamptz,
  recovery_coupon_id text,        -- Payload coupon id if generated
  converted_order_id text,
  created_at timestamptz,
  updated_at timestamptz
)
```

RLS: `web_profile_id = auth.uid()` SELECT; INSERT/UPDATE vía service role en API sync.

Sync: `POST /api/cart/sync` (debounced 2s client) solo si sesión B2C (`validated_at` set, segment b2c). Al `place-order` success → `status = converted`.

**Alternativa descartada:** Reutilizar Payload `carts` — schema variantes/ecommerce no coincide con `productId` CMS Jeyjo.

### 6. Job recovery (`abandoned-cart-recovery-emails`)

**Decisión:** `GET /api/cron/abandoned-cart` con `CRON_SECRET`, cada 15 min:

1. Leer `marketing-settings`.
2. Query snapshots `status = active`, `lines` non-empty, `converted_order_id` IS NULL.
3. **Primer email:** `now - last_activity_at >= firstEmailDelay` AND `first_email_sent_at` IS NULL AND perfil B2C.
4. **Segundo email:** `>= secondEmailDelay` AND `second_email_sent_at` IS NULL AND `first_email_sent_at` IS NOT NULL.
5. Antes de enviar: re-check no existe pedido confirmado reciente del mismo `customer_id` con líneas solapadas (defensa CA3).
6. Segundo email: crear cupón `RECOVER-{random}` percent = `secondEmailDiscountPercent`, `maxUses=1`, `validUntil=+7d`, o usar `secondEmailUseFixedCoupon`.
7. Email con React Email; enlace `https://jeyjo.es/cart?recover={signedToken}`.
8. Token HMAC: payload `{ snapshotId, lines, exp }`, TTL 7 días; `GET /api/cart/recover` valida y devuelve líneas para merge en store.

Asunto primer email: **"Tienes artículos esperándote en Jeyjo"** (US-23 CA1).

B2B: skip unless `b2bRecoveryEnabled` AND `customer.pricing_group` in allowlist.

**Alternativa descartada:** Cola BullMQ separada — Vercel cron suficiente para volumen Jeyjo v1.

### 7. Incremento usos cupón

**Decisión:** Hook `afterChange` en `Orders` cuando `status` pasa a `confirmed` o `pending_payment` (B2C card) con `couponCode` set → `PATCH` cupón `usesCount++` idempotente por `orderNumber`.

**Alternativa descartada:** Incrementar en validate — permitiría consumir uso sin pedido.

### 8. CMS admin UI

**Decisión:** Grupo Payload **Marketing** con `Coupons` (list + filters active/expired) y link a global `MarketingSettings`. Roles: `superadmin` y `marketing` (si existe) full access; otros staff read-only o hidden según `staffRoles`.

## Risks / Trade-offs

- **[Risk] Desfase localStorage vs snapshot** → Mitigation: sync en cada mutación + recover token restaura líneas al abrir enlace email.
- **[Risk] Cupón aplicado en cliente pero inválido al place-order** → Mitigation: prepare token incluye hash de cupón validado server-side; place-order rechaza mismatch.
- **[Risk] Spam recovery emails** → Mitigation: un solo par 2h/24h por snapshot; `converted` cancela segundo; respetar `email_disabled_at` si se extiende RI-009.
- **[Risk] Latencia fetch Payload en cada apply** → Mitigation: cache 60s por código en storefront server; invalidar en CMS hook afterChange cupón.
- **[Trade-off] Solo B2C registrado** → Guest abandono no recuperable v1; alineado con US-23 CA1.

## Migration Plan

1. Deploy migration Supabase `abandoned_cart_snapshots`.
2. Deploy CMS con colecciones + seed cupón `BLOG5` (5%, sin mínimo) para CA-CHECKOUT-004.
3. Deploy storefront con APIs; feature flag `MARKETING_COUPONS_ENABLED=true`.
4. Registrar cron abandoned-cart en Vercel.
5. Eliminar `DEMO_COUPONS` tras verificar tests; mantener `MAYO10` como seed opcional en Payload.
6. Rollback: flag off → fallback sin cupón (subtotal sin descuento); cron desactivado; snapshots conservados.

## Open Questions

- **Dirección:** confirmar % descuento segundo email (default 10% en settings hasta respuesta).
- ¿Cupón recovery siempre auto-generado o solo campaña fija configurable? → v1 soporta ambos; default auto-generado.
- ¿Cupones en checkout B2B? → v1 permitido si staff crea cupón; sin UI especial B2B.
