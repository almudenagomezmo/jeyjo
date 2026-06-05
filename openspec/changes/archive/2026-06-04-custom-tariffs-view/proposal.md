## Why

El portal B2B (#22) expone `/intranet/precios` como scaffold vacío; sin **RF-020** y **US-14**, los administradores de empresa no pueden consultar de forma autónoma sus precios pactados, descuentos por artículo ni ofertas de grupo vigentes — una consulta que hoy obliga a contactar con comercial. El motor de precios (#6), los puertos ERP de lectura (#4, `ErpPricingReader`) y la sync a Supabase (#7) ya resuelven tarifas en catálogo y carrito; este cambio (#25 del ROADMAP) conecta esas piezas a una vista dedicada en intranet y sustituye el placeholder por una sección operativa en staging.

## What Changes

- **Sección “Precios especiales”** en `/intranet/precios`: tabla paginada de precios pactados por artículo con foto, referencia, descripción, cantidad mínima (si aplica), precio de venta recomendado (P2), descuento 1, descuento 2, importe neto pactado, fecha fin de vigencia y estado **Vigente** / **Caducado** (**RF-020**, **US-14 CA1**).
- **Fuente de datos:** `ErpPricingReader.listSpecialPrices` por `erp_customer_code` de sesión, enriquecido con catálogo CMS (imagen, título, P2) y estado de vigencia calculado en servidor; fallback coherente con filas ya sincronizadas en Supabase `special_prices` cuando el stub no devuelva fila.
- **Ofertas de grupo:** bloque separado con ofertas activas del grupo de cliente (`listGroupOffers` filtrado por `customerGroup`), alineado a **US-14 CA4**.
- **Solicitar revisión:** botón **Solicitar revisión de precio** solo en filas **Caducado**; acción server-side que registra la solicitud (quote B2B con observación estructurada o registro equivalente en Payload) para bandeja comercial (**US-14 CA2**, **CA3**).
- **API storefront:** `GET /api/intranet/custom-tariffs` (paginación, búsqueda por referencia) y `POST /api/intranet/custom-tariffs/review-request` (SKU + validación B2B).
- **Ampliación DTO ERP:** campos opcionales de presentación en `ErpSpecialPriceDto` (`recommendedNetPrice`, `discount1Pct`, `discount2Pct`, `minQty`) para reflejar columnas Avansuite sin duplicar lógica RF-007 en cliente.
- **UI intranet:** reemplazar `IntranetScaffoldPage` en precios por página con tabla responsive, badges de estado, sección ofertas de grupo, estados vacío/error y acciones de revisión.
- **Tests:** unit (mapper vigencia, DTO stub), integración API (auth B2B, caducado muestra botón, vigente no), escenario **CA-PRECIOS-004** visible en listado para `empresa2@test.com`.

## Capabilities

### New Capabilities

- `storefront-b2b-custom-tariffs`: UI y APIs de la vista de tarifas personalizadas en `/intranet/precios`, incluyendo tabla de precios especiales, ofertas de grupo, estados de vigencia y solicitud de revisión (**RF-020**, **US-14**).

### Modified Capabilities

- `erp-pricing-read-ports`: Ampliar DTOs de precios especiales (y stub) con campos de presentación ERP requeridos por RF-020; fixtures con al menos un precio caducado para pruebas.
- `storefront-b2b-portal-shell`: Sustituir escenario de scaffold en `/intranet/precios` por vista de producción; mantener navegación US-07.

## Impact

- `apps/storefront`: `app/(b2b)/intranet/precios/**`, componentes `CustomTariffs*`, `lib/intranet/custom-tariffs/**`, rutas API bajo `app/api/intranet/custom-tariffs/`.
- `packages/erp-ports`: ampliación de `ErpSpecialPriceDto`, stub `pricing-data.ts` con filas vigentes y caducadas.
- `packages/pricing`: consumo existente para validar coherencia neto vs motor; sin cambio de reglas RF-007.
- `apps/cms` / Payload: posible creación de quote B2B tipo revisión de precio (reutiliza colección `quotes` existente).
- Tests en `apps/storefront/tests/` y `packages/erp-ports/tests/`.
- Cumple **RF-020**, **US-14**; depende de ROADMAP #6, #22, #4 (completados).
- Complementa histórico (#23) y desbloquea confianza comercial antes de #26 (subusuarios) y #28 (notificaciones).

## Non-Goals

- Edición de precios especiales desde el portal (escritura ERP → cambio #36).
- Export Excel de tarifas (**#29** excel-importer-exporter).
- Notificaciones proactivas al comercial por email (**#28**); v1 deja la solicitud en bandeja Payload.
- Permisos por subusuario RF-003 (#26): todos los B2B validados ven la tarifa completa de la empresa v1.
- Precios P1/B2C en esta sección (solo condiciones B2B pactadas).
- Sincronización batch nocturna adicional ERP → Supabase más allá del flujo existente (#7).
- Área documental o listado de cabeceras de tarifa ERP con PDF.

## Assumptions

- `erp_customer_code` y `customerGroup` en `customers` vinculan sesión B2B al stub; seed incluye `B2B-EMPRESA2` con REF-004 vigente y al menos un SKU caducado para CA de revisión.
- “Precio de venta recomendado” = P2 del catálogo CMS/ERP para el SKU; descuentos 1/2 provienen del ERP cuando existan, o se derivan de P2 vs neto pactado en stub v1.
- Ofertas de grupo se muestran aunque no haya precio especial individual para el mismo SKU.
- La solicitud de revisión crea un presupuesto B2B `requested` con observación prefijada `Renovación precio especial — {SKU}` visible en backoffice quotes inbox (#19).
