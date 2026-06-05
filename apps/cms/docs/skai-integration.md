# Integración SKAI / EVA (RI-005)

Cambio OpenSpec **#32** — widget en storefront/intranet, contexto seguro y webhook de pedidos.

## Variables de entorno (CMS)

| Variable | Descripción |
|----------|-------------|
| `SKAI_ADAPTER` | `stub` (dev) o `live` |
| `SKAI_API_URL` | Base REST SKAI (solo `live`) |
| `SKAI_API_KEY` | Bearer API SKAI |
| `SKAI_WIDGET_ID` | ID del widget embebido |
| `SKAI_WIDGET_SCRIPT_URL` | URL del script del widget (opcional en stub) |
| `SKAI_WEBHOOK_SECRET` | Secreto HMAC para `POST /api/eva/orders` |
| `EVA_CONTEXT_JWT_SECRET` | Firma JWT de contexto (compartido con storefront) |

## Variables de entorno (storefront)

| Variable | Descripción |
|----------|-------------|
| `EVA_WIDGET_ENABLED` | `false` desactiva el launcher |
| `EVA_CONTEXT_JWT_SECRET` | Mismo valor que en CMS |
| `SKAI_WIDGET_ID` / `SKAI_WIDGET_SCRIPT_URL` | Config del script cliente |

## Flujo de contexto

1. Storefront `GET /api/eva/bootstrap` emite JWT 15 min (`sub`: `anonymous` o `customerId`).
2. SKAI llama `GET /api/eva/context` (CMS) con `Authorization: Bearer <token>`.
3. Respuesta acotada: catálogo público (anónimo) o perfil + pedidos + historial ERP (autenticado).

## Webhook de pedidos

`POST /api/eva/orders` (CMS)

- Header: `X-Skai-Signature: HMAC-SHA256(body, SKAI_WEBHOOK_SECRET)` (hex).
- Body:

```json
{
  "skaiExternalId": "skai-order-123",
  "customerRef": "uuid-cliente-opcional",
  "guestEmail": "cliente@ejemplo.com",
  "customerNotes": "Notas",
  "lines": [
    { "skuErp": "REF-001", "name": "Producto", "qty": 2, "unitPrice": 1.5 }
  ]
}
```

- Crea pedido `origin=eva`, `validatedEva=false`, `jeyjoStatus=pending_confirmation`.
- Idempotente por `skaiExternalId`.

## Admin

- Vista: `/admin/skai-config` (solo `superadmin`).
- Global Payload: `skaiSettings` (horarios, contacto fallback).

## Checklist manual QA

### US-22 (storefront)

- [ ] Botón EVA visible en `/`, PDP y `/intranet`
- [ ] Bootstrap incluye `productSku` en PDP
- [ ] Con SKAI caído o `enabled=false`, mensaje RI-005 + contacto
- [ ] Visitante anónimo: contexto sin `customerId`

### US-20 (admin)

- [ ] `/admin/skai-config` solo superadmin
- [ ] Guardar horarios y contacto fallback
- [ ] Panel "Probar EVA" emite token anónimo
- [ ] Métricas stub visibles

### US-19 / CA-BACKEND-003

- [ ] Dashboard EVA: preview en stub, live sin badge con `SKAI_ADAPTER=live`
- [ ] Webhook crea pedido en cola; validar/rechazar sin regresión

## Open questions

1. Contrato REST definitivo de SKAI (paths `/health`, `/metrics/conversations`, `/knowledge/documents`).
2. Subida PDF vía API vs portal SKAI.
3. Callback a SKAI al rechazar pedido EVA (fuera de v1).
