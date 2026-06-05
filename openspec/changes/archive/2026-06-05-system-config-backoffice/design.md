## Context

- **Estado actual:** Tras #5 (roles/MFA/audit) y #30 (dashboard KPI), el backoffice Payload tiene globals de dominio (`paymentSettings`, `marketingSettings`, `skaiSettings`, `analyticsSettings`) visibles o `hidden: true` en grupo "Configuración", pero **no hay hub unificado** ni global operativo central. Portes están hardcodeados en `apps/storefront/src/lib/cart/shipping.ts` (`SHIPPING_RULES`). Umbrales stock/dashboard leen env (`STOCK_LOW_THRESHOLD`, `DASHBOARD_LOW_STOCK_THRESHOLD`, `TOP_SALES_WINDOW_DAYS`). EVA usa string fijo `SHIPPING_POLICY` en `resolve-context.ts`. Patrón establecido: storefront fetch server-side a globals Payload vía REST (`fetchPaymentSettings` → `/api/globals/paymentSettings`) con cache corta.
- **Referencias:** **Alcance §1.36**, **RF-013**, **RF-005**, **RF-026**, **RNF-007**, `backoffice-system-alerts`, `cms-payment-methods-config`, ROADMAP #42 (depende #5, #30).

## Goals / Non-Goals

**Goals:**

- Global Payload `systemSettings` con secciones tabuladas y defaults v1 alineados a requisitos.
- API pública `GET /api/system/config` cacheable sin secretos, consumida por storefront y agregadores CMS.
- Hub admin `/admin/system-config` que consolida navegación a módulos existentes.
- Portes, umbrales stock/dashboard y staleness ERP configurables sin redeploy.
- Contacto/tiendas reutilizable en footer, checkout y EVA fallback.
- Toggles operativos de búsqueda (no credenciales Qdrant).
- Auditoría RF-029 vía hooks Payload existentes.

**Non-Goals:**

- Editor plantillas email, rotación claves WAF/TLS, umbral stock por familia, migrar lógica de pagos/marketing/SKAI a un solo documento JSON.

## Decisions

### 1. Un solo global `systemSettings` + hub view (no mega-refactor de globals existentes)

**Decisión:** Crear `SystemSettings` global con campos operativos transversales. Mantener `paymentSettings`, `marketingSettings`, `skaiSettings`, `analyticsSettings` en sus globals; el hub `/admin/system-config` muestra cards con deep links. Quitar `hidden: true` de SKAI/analytics o exponerlos solo desde el hub.

**Rationale:** Alcance §1.36 pide configuración general; duplicar campos de pagos/SKAI rompería cambios #18/#32/#34. Hub da UX unificada sin migración de datos.

**Alternativa descartada:** Fusionar todo en un único global — alto riesgo de regresión y payloads enormes.

### 2. API dedicada `GET /api/system/config` en CMS

**Decisión:** Endpoint Next en `apps/cms/src/app/(app)/api/system/config/route.ts` que lee `systemSettings` con Payload local API, mapea a DTO tipado y responde con `Cache-Control: public, max-age=60, stale-while-revalidate=120`.

```ts
type SystemConfigDto = {
  shipping: {
    b2c: { threshold: number; cost: number }
    b2b: { threshold: number; cost: number }
  }
  stock: { lowThreshold: number }
  dashboard: { topSalesWindowDays: number; lowStockThreshold: number }
  erp: { catalogStalenessHours: number }
  contact: {
    supportPhone?: string
    supportEmail?: string
    whatsapp?: string
    stores: { alfaro?: StoreAddress; rincon?: StoreAddress }
  }
  search: {
    predictiveEnabled: boolean
    suggestLimit: number
    minQueryLength: number
  }
  updatedAt: string
}
```

**Rationale:** Un contrato estable para storefront y CMS interno; evita exponer REST Payload completo; permite validación y defaults centralizados.

**Alternativa descartada:** Storefront lee `/api/globals/systemSettings` directamente — expone schema Payload interno y dificulta evolución.

### 3. Precedencia: CMS → env → hardcoded defaults

**Decisión:** Resolver en `getSystemConfig()` compartido (CMS) y `fetchSystemConfig()` (storefront):

1. Valores de `systemSettings` si existen y son válidos.
2. Fallback env (`STOCK_LOW_THRESHOLD`, `DASHBOARD_LOW_STOCK_THRESHOLD`, `TOP_SALES_WINDOW_DAYS`, `CATALOG_STALENESS_HOURS`).
3. Defaults v1 documentados (39/5 B2C, 10/2.5 B2B, stock 5, window 30, staleness 24).

**Rationale:** Operación sin redeploy (#42) con resiliencia si CMS cae; coherente con `analyticsSettings` env precedence (#34).

### 4. Storefront: módulo `lib/system-config` con cache server-side

**Decisión:** `fetchSystemConfig()` en storefront usando `unstable_cache` (revalidate 60) contra `${CMS_URL}/api/system/config`. Refactor `shipping.ts`:

- `getShippingRules()` async en server components/routes.
- Mantener `computeShippingPreview(subtotal, mode, rules)` puro para tests.
- Client components reciben rules como props desde server parent (checkout, cart page).

**Rationale:** Evita fetch client-side en cada minicart open; alinea con `fetchPaymentSettings`.

**Alternativa descartada:** Replicar defaults solo en storefront — incumple RF-013 configurable backend.

### 5. Acceso por rol en global y hub

**Decisión:**

| Sección | Read | Update |
|---------|------|--------|
| Shipping, contact, stock thresholds | superadmin, administracion | superadmin, administracion |
| Dashboard alert thresholds | superadmin, administracion | superadmin, administracion |
| ERP staleness, search toggles | superadmin, mantenimiento | superadmin, mantenimiento |
| Hub security docs | all staff (read-only) | — |

API pública `GET /api/system/config` sin auth (solo datos públicos operativos).

**Rationale:** RF-030 mínimo privilegio; mantenimiento no toca precios/portes.

### 6. Contacto: systemSettings con override SKAI

**Decisión:** `systemSettings.contact` es fuente para footer/checkout. EVA bootstrap: `skaiSettings.fallbackPhone/Email/WhatsApp` gana si presente; si no, usa `systemSettings.contact`.

**Rationale:** Evita duplicar edición en dos sitios para EVA; footer usa contacto general.

### 7. Search toggles sin Qdrant credentials

**Decisión:** `predictiveEnabled`, `suggestLimit`, `minQueryLength` en `systemSettings.search`. `QDRANT_URL`/`QDRANT_API_KEY` permanecen env. Storefront `search-flags.ts` combina env presence + CMS toggle.

**Rationale:** Credenciales infra no pertenecen a Payload; staff puede desactivar suggest en incidentes.

### 8. Dashboard y stock CMS leen mismo resolver

**Decisión:** Extraer `resolveOperationalThresholds()` en `apps/cms/src/lib/system-config/resolve.ts` usado por `top-sales.ts`, `recalculateIndicators.ts` y dashboard alerts builder.

**Rationale:** Una fuente de verdad; elimina drift env vs CMS.

## Risks / Trade-offs

- **[Cache stale up to 60s after config change]** → Aceptable para portes/umbrales; staff help text indica propagación ~1 min. Mitigación opcional: `revalidateTag('system-config')` en hook afterChange.
- **[CMS down → env/defaults only]** → Documentar env fallbacks; storefront sigue operando con últimos defaults conocidos.
- **[Shipping rules async refactor touches checkout/cart tests]** → Mantener función pura `computeShippingPreview`; tests inyectan rules explícitas.
- **[Hub duplica links Payload nativos]** → Mitigar con `admin.group: 'Configuración del sistema'` y single entry "Configuración" en nav.

## Migration Plan

1. Crear global `systemSettings` con defaults v1 en seed/migration Payload (onInit seed si global vacío).
2. Desplegar API y hub; verificar audit_log en save.
3. Actualizar storefront para leer config; mantener env como fallback.
4. Actualizar dashboard/stock agregadores CMS.
5. Documentar en README y `.env.example` precedencia CMS > env.
6. Rollback: revert storefront a `SHIPPING_RULES` constants y env-only thresholds (global inactivo no rompe).

## Open Questions

- ¿Añadir `revalidateTag` inmediato post-save en v1 o aceptar cache 60s? **Propuesta v1:** hook `afterChange` con tag revalidation si Next cache API disponible en CMS route.
- ¿Exponer `system-config` en sidebar Payload como custom view o solo link desde dashboard KPI? **Propuesta v1:** custom view + grupo nav "Configuración del sistema".
