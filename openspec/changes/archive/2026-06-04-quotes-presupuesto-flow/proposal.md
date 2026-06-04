## Why

Checkout (#17) y OMS (#20) ya permiten tramitar y operar pedidos web, pero el botón **Solicitar presupuesto** del carrito sigue deshabilitado y no existe entidad ni flujo staff para presupuestos. **RF-015** y **US-05** exigen que colegios, administraciones y otros clientes puedan obtener un precio formal con estados trazables (Solicitado → En revisión → Enviado → Aceptado → Pedido) antes de comprometer la compra. Es el cambio #19 del ROADMAP; dependencias #17 y #20 completadas.

## What Changes

- **Colección Payload `quotes` (presupuestos)** con número legible, estados RF-015, snapshots de líneas/precios/IVA, referencia a cliente Supabase, email invitado, totales y metadatos de entrega opcionales (reutilizando patrones de `orders`).
- **Flujo storefront**: botón **Solicitar presupuesto** activo en `/cart` y `/checkout` para todos los usuarios (anónimo, B2C, B2B); API `prepare` + `request-quote` análoga a checkout con captura de email invitado y observaciones.
- **Confirmación por email (RI-009)**: al crear presupuesto en estado `requested`, envío transaccional con número de presupuesto (**US-05 CA4**).
- **Bandeja backoffice Presupuestos**: vista admin dedicada con filtros, transiciones staff permitidas y enlace al pedido generado cuando el estado pasa a `ordered`.
- **Conversión Aceptado → Pedido**: acción staff que crea un `order` en Payload (`pending_confirmation` B2B / `pending_payment` B2C según segmento) a partir del snapshot del presupuesto y enlaza `convertedOrderRef`.
- **Área cliente / intranet (listado básico)**: presupuestos del cliente autenticado visibles en `/cuenta/presupuestos` (B2C) y enlace desde intranet contabilidad (sin sync ERP documental).
- **Tests**: unit (transiciones, mapper quote→order), integración (API request-quote, access staff), checklist manual US-05.

## Capabilities

### New Capabilities

- `payload-quote-collection`: Modelo de presupuesto en Payload, estados, snapshots, enlace a pedido convertido y acceso staff.
- `storefront-quote-request-flow`: UI carrito/checkout, APIs prepare/request-quote, página de confirmación y listado en cuenta cliente.
- `backoffice-quotes-inbox`: Bandeja admin de presupuestos con filtros, transiciones y acción convertir a pedido.
- `quote-request-confirmation-email`: Email transaccional Resend/Mailpit al solicitar presupuesto (CA4); hook preparado para notificaciones de cambio de estado en #28.

### Modified Capabilities

- `storefront-cart-minicart`: Habilitar CTA **Solicitar presupuesto** con navegación al flujo de solicitud (no disabled).
- `storefront-checkout-shipping`: Ruta alternativa de solicitud de presupuesto desde checkout (sin paso de pago).
- `backoffice-staff-roles`: Acceso a `/admin/quotes` restringido a `superadmin` y `administracion`.
- `storefront-customer-account`: Sección **Mis presupuestos** con listado de estados para clientes autenticados.

## Impact

- `apps/cms`: colección `quotes`, hooks de numeración y transiciones, `QuotesInboxView`, endpoints staff (`/api/quotes/...`), servicio email, seed de presupuesto demo.
- `apps/storefront`: `/cart`, `/checkout`, nuevas rutas `/presupuesto` (o flujo integrado), `/cuenta/presupuestos`, APIs bajo `/api/quotes/`.
- `packages/`: posible util compartida quote→order snapshot (o módulo en `apps/cms/src/lib/quotes/` siguiendo patrón OMS).
- Infra email existente (Resend/Mailpit en Payload #5).
- Desbloquea visibilidad operativa previa a #28 (notificaciones) y #37 (documentos ERP); no sustituye sync Avansuite de presupuestos históricos.
- Cumple **RF-015**, **US-05**; parcial **RI-009** (email solicitud); criterio verificación RF-015.

## Non-Goals

- **Área documental** con presupuestos vigentes/caducados sincronizados desde Avansuite (**#37**, RF-016); solo presupuestos creados en la web.
- **Centro de notificaciones** en portal y preferencias (**#28**, RF-022); este cambio envía email en solicitud y deja hooks para cambios de estado futuros.
- **Recordatorio caducidad** presupuesto 7 días antes (RF-022c) — requiere campo `validUntil` y job en #28.
- **Escritura ERP** de presupuestos vía API Avansuite (**#36**); staff opera en Payload hasta integración.
- **PDF descargable** del presupuesto para el cliente (fase documental o iteración posterior).
- **Cupones de marketing** aplicados al presupuesto (**#31**); v1 usa mismas reglas demo que carrito o ignora cupón en quote según diseño.
- **EVA / widget** generación automática de presupuestos (**#32**).

## Assumptions

- Estados internos en inglés (`requested`, `in_review`, `sent`, `accepted`, `ordered`, `cancelled`) con etiquetas ES en admin y storefront.
- Anónimos deben indicar email de contacto en el flujo (como checkout invitado); no requieren registro.
- Conversión a pedido es acción staff explícita desde `accepted` (no automática al aceptar en storefront v1).
- Numeración presupuesto: prefijo `P-` + secuencia (ej. `P-2026-00042`), distinta de `orderNumber`.
- Reutiliza `STOREFRONT_PAYLOAD_API_KEY` y snapshots de línea alineados a `orderLineSnapshots` / pricing engine (#6).
