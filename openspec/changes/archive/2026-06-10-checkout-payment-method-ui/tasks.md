## 1. Selector de formas de pago

- [x] 1.1 `PaymentMethodSelector` con tarjetas, orden de métodos y filtro CMS/API
- [x] 1.2 Integración wallets (Apple Pay / Google Pay) en el mismo radiogroup
- [x] 1.3 Mensaje de conexión segura bajo opciones

## 2. Iconografía de marca

- [x] 2.1 `PaymentMethodBrandIcon` con SVG inline (Simple Icons + Bizum + transferencia Jeyjo)
- [x] 2.2 Badges con borde y tamaño consistente en cada tarjeta

## 3. Layout revisión y CTA

- [x] 3.1 Separar **Revisión del pedido** y **Forma de pago** en tarjetas distintas
- [x] 3.2 Título **Forma de pago** en negrita (`text-lg font-extrabold`) como Resumen
- [x] 3.3 CTA contextual según `paymentMethodCode`
- [x] 3.4 B2B: título **Forma de pago acordada** con mismo estilo

## 4. Limpieza y documentación

- [x] 4.1 Eliminar `WalletPayButtons.tsx`
- [x] 4.2 Actualizar specs OpenSpec y ROADMAP (#58)
