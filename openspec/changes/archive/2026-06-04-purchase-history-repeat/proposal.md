## Why

El portal B2B (#22) expone `/intranet/pedidos` como scaffold vacío; sin **RF-018** y **US-10**, los administradores de empresa no pueden consultar compras habituales ni repetir pedidos con precios actuales — el patrón de recompra que sostiene la retención B2B. El motor de precios (#6), el carrito (#12) y el OMS web (#20) ya permiten resolver tarifas, añadir líneas y registrar pedidos; este cambio (#23 del ROADMAP) conecta esas piezas al histórico y sustituye el placeholder por una sección operativa en staging.

## What Changes

- **Sección “Datos histórico”** en `/intranet/pedidos`: listado paginado de líneas de compra agregadas por SKU (foto grande, referencia, descripción, cantidad habitual, **precio actual** con etiqueta visible, nunca el precio pagado en su día como precio vigente).
- **Precio actual vía motor RF-007:** cada fila resuelve `resolvePrice` / batch pricing para el cliente de sesión; muestra regla aplicada (especial, oferta, B2B, P1) y copy **“Precio actual”** (**CA-B2B-004**).
- **Repetir pedido:** selección múltiple + acción **“Añadir al carrito”** que incrementa cantidades en el carrito cliente con precios recalculados al añadir (coherente con carrito #12).
- **Filtros US-10 CA4:** fecha desde/hasta, referencia (texto), categoría (árbol CMS) y departamento/sede (campo ERP opcional v1; oculto si el cliente no tiene sedes).
- **Fuente de datos:** puerto `ErpPurchaseHistoryReader` con adaptador **stub** (fixture por `erp_customer_code`) más **líneas derivadas de pedidos web** confirmados en Payload para el `customerRef` de sesión; unión y deduplicación por SKU con cantidad habitual = media o última compra documentada en diseño.
- **Exclusiones RF comodín:** referencias wildcard del catálogo (ej. `9000000001`) excluidas del histórico.
- **API storefront:** `GET /api/intranet/purchase-history` (filtros + paginación) y `POST /api/intranet/purchase-history/repeat` (validación server-side de SKUs y precios antes de devolver líneas para el carrito).
- **UI intranet:** reemplazar `IntranetScaffoldPage` en pedidos por página con filtros, tabla/cards responsive, estados vacío/error y enlace al carrito tras repetir.
- **Observaciones al repetir:** banner o modal que recuerda completar observaciones en checkout (ya existente #17); no duplicar flujo de pago en esta sección.
- **Tests:** unit (mapper stub, exclusión wildcard, merge web+ERP), integración API (auth B2B, precio actual ≠ histórico), Playwright **CA-B2B-004** en staging.

## Capabilities

### New Capabilities

- `storefront-b2b-purchase-history`: UI y APIs del histórico en intranet, filtros, selección, repetición al carrito y etiquetado de precio actual (**RF-018**, **US-10**).
- `erp-purchase-history-reader`: Puerto de lectura de líneas de compra históricas ERP (stub + contrato para API Avansuite futura).

### Modified Capabilities

- `storefront-b2b-portal-shell`: Sustituir escenario de scaffold en `/intranet/pedidos` por listado real; mantener navegación US-07.
- `storefront-cart-minicart`: Acción batch “añadir desde histórico” (misma semántica que `addLine`, resolución de precio al añadir).
- `payload-order-collection`: Documentar uso de pedidos web confirmados como fuente complementaria del histórico (campos mínimos para agregación por SKU).

## Impact

- `apps/storefront`: `app/(b2b)/intranet/pedidos/**`, componentes `PurchaseHistory*`, `lib/intranet/purchase-history/**`, rutas API bajo `app/api/intranet/`.
- `packages/erp-ports`: nuevo puerto `ErpPurchaseHistoryReader`, stub con fixtures, export en bundle.
- `apps/cms` / Payload: lectura de `orders` confirmados por `customerRef` (sin nuevo panel admin en este cambio).
- `packages/pricing`: consumo existente; sin cambio de reglas RF-007.
- Tests en `apps/storefront/tests/` y posible fixture en `packages/erp-ports/tests/`.
- Cumple **RF-018**, **US-10**, **CA-B2B-004**; depende de ROADMAP #6, #12, #20, #22 (completados).
- Desbloquea adopción real del portal antes de #24 (pedido rápido) y #32 (EVA con contexto de compras).

## Non-Goals

- Gráficos de consumo (mencionados en alcance §1.16; fase posterior).
- Importación masiva de años de histórico Avansuite (**#36** / acuerdo Jeyjo); v1 stub + pedidos web + ventana configurable (default 5 años cuando exista API).
- Campo libre para artículos no catalogados en la misma pantalla (**#24** `quick-order-excel`); tras repetir, el usuario usa catálogo o pedido rápido.
- Listado de cabeceras de pedido/albarán ERP con PDF (**#37** área documental).
- Permisos por subusuario RF-003 (#26): todos los B2B validados ven el histórico completo de la empresa v1.
- Sincronización nocturna ERP → Supabase de tabla materializada (evaluar solo si el stub no basta en QA).
- Área B2C `/cuenta/pedidos` (sigue “Próximamente”; fuera de US-10).

## Assumptions

- `erp_customer_code` en `customers` vincula sesión B2B al fixture stub; clientes demo en seed incluyen líneas con precio histórico distinto del actual para **CA-B2B-004**.
- “Cantidad habitual” = última cantidad comprada del SKU en la ventana agregada, salvo empate (diseño elige máximo o suma — ver design.md).
- Categoría en filtros = categoría CMS del producto viva; SKUs sin producto CMS siguen visibles con datos ERP mínimos.
- Departamento/sede: opcional en stub; si Avansuite no expone sede en v1, el filtro queda deshabilitado con tooltip.
- Pedidos web contabilizan solo estados `confirmed` y posteriores (no borradores ni `cancelled`).
