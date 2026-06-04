# Presupuestos (US-05 / RF-015) — verificación manual

## Prerrequisitos

- `QUOTES_ENABLED=true` y `NEXT_PUBLIC_QUOTES_ENABLED=true` en storefront `.env.local`
- `STOREFRONT_PAYLOAD_API_KEY` compartida entre CMS y storefront
- CMS con Mailpit (`SMTP_USE_MAILPIT=true`) o Resend configurado
- Seed ejecutado (`pnpm --filter cms seed`) o presupuestos demo `P-2026-00001` / `P-2026-00002`

## CA1 — Botones en carrito y checkout

1. Añadir producto al carrito y abrir `/cart`.
2. Verificar que **Solicitar presupuesto** está activo y navega a `/presupuesto`.
3. Añadir productos, ir a `/checkout`, paso revisión.
4. Verificar botón secundario **Solicitar presupuesto** visible sin seleccionar pago.

## CA2 — Presupuesto en backend y cuenta

1. Solicitar presupuesto como invitado con email válido.
2. En Payload admin `/admin/quotes`, verificar estado **Solicitado**.
3. Iniciar sesión como cliente registrado, solicitar otro presupuesto.
4. Abrir `/cuenta/presupuestos` y verificar listado con número y estado.

## CA3 — Transiciones staff

1. Staff `administracion` abre `/admin/quotes`.
2. Avanzar `P-2026-00001`: Solicitado → En revisión → Enviado → Aceptado.
3. En presupuesto **Aceptado** (`P-2026-00002`), pulsar **Convertir a pedido**.
4. Verificar estado **Pedido** y enlace al pedido en OMS.

## CA4 — Email confirmación

1. Tras solicitud invitado, revisar Mailpit (http://localhost:8025) o bandeja Resend.
2. Email debe incluir número de presupuesto (ej. `P-2026-000xx`).
3. Si email falla, fila en bandeja muestra badge **Email**.
