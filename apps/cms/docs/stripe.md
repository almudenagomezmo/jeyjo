# Stripe — Pasarela de Pago

## Configuración

1. Crear cuenta en [stripe.com](https://stripe.com)
2. Obtener las claves desde **Developers > API Keys**
3. Configurar webhook en **Developers > Webhooks > Add endpoint**

```env
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOKS_SIGNING_SECRET=whsec_...
```

## Webhooks

Añadir endpoint de webhook apuntando a:

```
https://tudominio.com/api/payments/stripe/webhooks
```

Para desarrollo local:

```bash
pnpm stripe-webhooks
# Esto ejecuta: stripe listen --forward-to localhost:3000/api/payments/stripe/webhooks
```

Eventos a suscribir (los que requiera el plugin ecommerce de Payload).

## Modo test

Usar claves `sk_test_` / `pk_test_` y tarjetas de prueba de Stripe:

| Número | Resultado |
|---|---|
| `4242 4242 4242 4242` | Éxito |
| `4000 0000 0000 0002` | Rechazada |
| `4000 0025 0000 3155` | Requiere autenticación 3D Secure |
