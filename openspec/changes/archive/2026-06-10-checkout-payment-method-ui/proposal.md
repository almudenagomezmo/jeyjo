## Why

Tras #17 (checkout base) y #18 (pasarelas Redsys/PayPal/wallets), el paso **Revisión y pago** seguía mostrando formas de pago como radios de texto plano, sin iconografía de marca ni jerarquía visual comparable a otras plataformas e-commerce. Apple Pay y Google Pay aparecían como botones sueltos fuera del selector principal.

## What Changes

- **Selector en tarjetas:** cada forma de pago B2C es una tarjeta clicable (radio + título + descripción + marca), con estado seleccionado alineado a tokens Jeyjo (`primary`, `primary-soft`).
- **Iconografía de marca:** badges inline con SVGs oficiales (Visa, Mastercard, Bizum, PayPal, Apple Pay, Google Pay) y icono de transferencia con paleta corporativa.
- **Revisión en dos bloques:** tarjeta **Revisión del pedido** (líneas) separada de **Forma de pago** + confirmación.
- **Wallets integrados:** Apple Pay y Google Pay en la misma lista, visibles solo si CMS los habilita y el navegador los soporta.
- **CTA contextual:** el botón de confirmación cambia según método (`Pagar con Bizum`, `Continuar con PayPal`, etc.).

## Capabilities

### New Capabilities

_(ninguna)_

### Modified Capabilities

- `storefront-checkout-shipping`: UX del selector B2C/B2B en revisión, layout de revisión y CTA contextual.
- `storefront-wallet-payments`: wallets como opciones del selector unificado (no botones aparte).

## Impact

- `apps/storefront/src/components/checkout/CheckoutPage.tsx`
- `apps/storefront/src/components/checkout/PaymentMethodSelector.tsx` (nuevo)
- `apps/storefront/src/components/checkout/PaymentMethodBrandIcon.tsx` (nuevo)
- `apps/storefront/public/payments/*.svg` (assets de marca)
- Eliminado `WalletPayButtons.tsx` (lógica absorbida por `PaymentMethodSelector`)

## Non-Goals

- Cambiar APIs `/api/payments/methods`, place-order ni flujos Redsys/PayPal (#18).
- Sustituir SVGs por assets del manual de imagen Jeyjo si el cliente los aporta después.
- Rediseñar paso entrega ni confirmación (#57).
