## Why

Tras #17 (checkout entrega) y #57 (tarjeta **Dirección de envío**), al elegir envío a otra dirección el usuario solo podía seleccionar direcciones ya guardadas en `/cuenta/direcciones`. Eso obligaba a salir del checkout para añadir una dirección nueva, rompiendo el flujo de dos pasos (US-04 CA1).

## What Changes

- **Formulario inline:** en la tarjeta **Dirección de envío**, opción **Añadir nueva dirección** con el mismo formulario reutilizado de cuenta (`AddressForm`).
- **Persistencia y selección:** al guardar, `POST /api/account/addresses` crea la fila en `customer_addresses`, se selecciona automáticamente y el formulario se cierra.
- **Libro vacío:** si no hay direcciones guardadas, el formulario se abre al elegir **Envío a otra dirección**.
- **Etiqueta de entrega:** la opción pasa de «guardada» a **Envío a otra dirección**; validación al continuar: «Selecciona o añade una dirección de envío».

## Capabilities

### New Capabilities

_(ninguna)_

### Modified Capabilities

- `storefront-checkout-shipping`: creación inline de direcciones en checkout y escenarios de entrega alternativa.

## Impact

- `apps/storefront/src/components/checkout/CheckoutPage.tsx`
- `apps/storefront/src/components/account/AddressForm.tsx` (props opcionales y devolución de dirección creada)

## Non-Goals

- Editar dirección de facturación desde checkout (sigue en perfil/cuenta).
- Dirección de un solo uso sin guardar en `customer_addresses`.
- Cambiar APIs place-order ni reglas RF-013 de envío.
