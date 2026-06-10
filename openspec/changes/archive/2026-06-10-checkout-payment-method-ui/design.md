## Context

- **#17** definió selección de forma de pago B2C como radios simples filtrados por CMS.
- **#18** añadió pasarelas y wallets; `WalletPayButtons` renderizaba Apple/Google Pay fuera del listado principal.
- La guía visual Jeyjo usa títulos `text-lg font-extrabold`, bordes `border-border-subtle` y acento verde PANTONE 7479C en selección (mismo patrón que métodos de entrega).

## Decisions

### 1. Componente `PaymentMethodSelector`

**Decisión:** fieldset con tarjetas por método; orden fijo card → bizum → paypal → apple_pay → google_pay → transfer; lista filtrada por `GET /api/payments/methods`.

**Motivo:** Paridad con UX de entrega y plataformas retail; una sola superficie de selección.

### 2. SVG inline en React

**Decisión:** `PaymentMethodBrandIcon` renderiza paths Simple Icons (Visa, Mastercard, PayPal, Apple Pay, Google Pay) inline; Bizum con fondo `#05C3DD`; transferencia con forest/navy/green Jeyjo.

**Motivo:** Los primeros `<img src="/payments/*.svg">` tenían viewBox incorrectos y logos ilegibles; inline garantiza escala y nitidez.

### 3. Wallets en el mismo radiogroup

**Decisión:** `useWalletAvailability` oculta apple_pay/google_pay si el CMS los deshabilita o el navegador no soporta `ApplePaySession` / `PaymentRequest`.

**Motivo:** Elimina duplicidad con botones sueltos; cumple RF-014 sin cambiar backend.

### 4. Layout revisión en dos tarjetas

**Decisión:** `Card` 1 = tabla de líneas + volver a entrega; `Card` 2 = forma de pago + CTA (+ presupuesto si aplica).

### 5. Etiqueta de confirmación dinámica

**Decisión:** mapa cliente `paymentMethodCode` → copy (`Pagar con tarjeta`, `Continuar con PayPal`, `Confirmar pedido` para transferencia/B2B).

## Risks

- **Marcas registradas:** SVGs derivados de Simple Icons; sustituibles por assets oficiales del cliente en `public/payments/` o inline.
- **InSite Redsys wallets:** place-order sigue devolviendo error wallet si InSite no está configurado (comportamiento #18).
