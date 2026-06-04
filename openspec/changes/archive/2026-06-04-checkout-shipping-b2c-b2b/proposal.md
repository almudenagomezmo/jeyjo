## Why

El carrito (#12) ya calcula subtotales reales, preview de portes **RF-013** y CTAs deshabilitados; la autenticación (#16) permite sesión B2C/B2B con dirección de facturación en `customers`. Sin flujo de checkout en `apps/storefront`, no se cumple **US-04** (dirección, métodos de envío, resumen final) ni **CA-CHECKOUT-001/002/006**, y el ROADMAP bloquea pagos Redsys (#18), OMS (#20) y presupuestos (#19). Este cambio es el paso #17 obligatorio tras carrito y área cliente.

## What Changes

- **Ruta checkout storefront:** `/checkout` en máximo 2 pasos (entrega + revisión/pago) alineado a prototipo jeyjo-next y plantilla Payload existente en `apps/cms` (referencia UX, no reutilización directa).
- **Métodos de entrega US-04 CA2:** envío a domicilio (dirección facturación o alternativa guardada), recogida en tienda Alfaro o Rincón de Soto; snapshot de dirección en el pedido.
- **Motor de portes RF-013 en checkout:** línea de envío definitiva con copy B2C ("Gastos de envío: 5,00 € (IVA incluido)" / "Envío gratuito") y B2B (2,50 € gestión / gratis ≥ 10€); umbrales v1 en código (`lib/cart/shipping.ts`).
- **Direcciones cliente:** tabla `customer_addresses` en Supabase + CRUD mínimo en área cliente y selector en checkout; facturación sigue en `customers`.
- **Segmento en checkout:** modo precio y portes derivados de sesión (`getCustomerContext` / `pricingCustomerGroup`), no solo toggle manual; invitado B2C con email obligatorio.
- **Forma de pago RF-014 (UI + datos, sin pasarela):** B2C muestra opciones Redsys/Bizum/PayPal/transferencia como selección (confirmación real en #18); B2B validado muestra `default_payment_method` de ficha cliente, solo lectura, sin pasarelas inmediatas (**CA-CHECKOUT-006**).
- **Pedido borrador Payload:** API storefront crea `orders` en CMS con líneas, totales, envío, cupón demo, `origin` b2c|b2b, estado `pending_payment` (B2C) o `pending_confirmation` (B2B); sin email OMS ni Redsys en este cambio.
- **Carrito → checkout:** habilitar "Tramitar pedido" en `/cart` y mini-carrito; pasar cupón demo por query/sessionStorage.
- **Campo observaciones:** texto opcional en checkout (alcance §1.3).
- **Guardas:** carrito vacío redirige a `/cart`; B2B no validado trata checkout como B2C; intranet B2B puede reutilizar mismos componentes vía ruta compartida o `/checkout` con layout shop.

## Capabilities

### New Capabilities

- `storefront-checkout-shipping`: Flujo checkout storefront (envío, direcciones, resumen, portes RF-013, forma de pago RF-014 UI, creación pedido borrador, US-04 CA1–CA3 parcial).

### Modified Capabilities

- `storefront-cart-minicart`: CTA "Tramitar" activo hacia `/checkout`; coherencia totales/cupón con checkout.
- `storefront-customer-account`: Gestión básica de direcciones de envío (listar, crear, marcar predeterminada) para alimentar checkout.
- `core-tenant-tables`: Tabla `customer_addresses` y RLS por `customer_id`.
- `payload-order-collection`: Campos de checkout (método envío, tienda recogida, snapshots dirección, observaciones, cupón, shipping cost).
- `storefront-price-resolution`: Segmento efectivo en checkout desde sesión validada (B2B) además del toggle para anónimos.

## Impact

- `apps/storefront`: rutas `app/checkout/**`, componentes checkout, APIs `app/api/checkout/**`, ampliación `lib/cart/shipping.ts`, `customer-context`, páginas `/cart`, `/cuenta/direcciones`.
- `supabase/migrations`: `customer_addresses`, posible seed `default_payment_method` en clientes de prueba.
- `apps/cms`: extensión colección `orders` y hook pre-save para `orderNumber`.
- `packages/database-types`: tipos generados tras migración.
- Tests: unit portes checkout, integración API draft order, Playwright escenarios CA-CHECKOUT-001/002/006 (pago E2E en #18).
- Desbloquea ROADMAP #18 (`payments-redsys-wallets`), #19 (`quotes-presupuesto-flow`), #20 (`oms-pedidos-web`).
- Depende de #12 y #16 (completados).

## Non-Goals

- Integración Redsys/Bizum/PayPal/Apple Pay/Google Pay y webhooks (**#18**); CA-CHECKOUT-003 queda para ese cambio.
- Emails de confirmación y bandeja OMS operativa (**#20**, US-04 CA5–CA6).
- Botón "Solicitar presupuesto" funcional (**#19**, RF-015).
- Cupones reales desde backoffice (**#31**); se mantiene validación demo BLOG5/MAYO10 con reglas documentadas hasta marketing.
- Umbrales portes configurables en backoffice (**#42**).
- Envíos fuera de España, cálculo transportista por CP, multi-almacén.
- Sincronización direcciones con Avansuite (**#36**).
- Guest checkout B2B o pedido sin autenticación para empresas validadas.

## Assumptions

- Recogida en tienda: puntos fijos **Alfaro** y **Rincón de Soto** (sin mapa ni horarios dinámicos v1).
- B2B en checkout = cliente con `validated_at` NOT NULL y `customer_group` 02–04; `default_payment_method` poblado en registro/validación o stub ERP hasta API.
- Invitado B2C puede completar paso de entrega con email; confirmación de pedido requiere login o se crea pedido `pending_payment` vinculado a email (sin cuenta automática).
- Portes en recogida en tienda = 0 € v1 (asumido; si negocio exige gestión mínima B2B, se aplica regla de umbral sobre subtotal de líneas).
- Payload `orders` es sistema de registro v1; Supabase no duplica tabla `orders` hasta OMS (#20).
