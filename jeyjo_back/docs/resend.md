# Resend (Email)

Configuración de envío de correos mediante **Resend** en producción y **Mailpit** en desarrollo.

## Credenciales SMTP

| Campo | Valor |
|---|---|
| Host | `smtp.resend.com` |
| Puerto | `587` (TLS) |
| Usuario | `resend` |
| Password | API Key de Resend |

## Variables de entorno

| Variable | Descripción | Defecto |
|---|---|---|
| `RESEND_API_KEY` | API key de Resend (empieza con `re_`) | — |
| `RESEND_SMTP_HOST` | Host SMTP | `smtp.resend.com` |
| `RESEND_SMTP_PORT` | Puerto SMTP | `587` |
| `RESEND_FROM_EMAIL` | Dirección remitente | `noreply@tudominio.com` |
| `RESEND_FROM_NAME` | Nombre remitente | `Jeyjo` |

## Comportamiento por entorno

La configuración en `src/payload.config.ts` usa automáticamente:

- **Desarrollo** (`NODE_ENV=development` o sin `RESEND_API_KEY`) → **Mailpit** en `localhost:1025`
- **Producción** → **Resend** vía SMTP

## Mailpit (desarrollo)

Mailpit captura todos los correos sin enviarlos realmente y los muestra en una interfaz web.

### Inicio rápido

```bash
docker compose -f docker/docker-compose.yml up -d mailpit
```

Abre `http://localhost:8025` para ver los correos.

### Puertos

| Puerto | Uso |
|---|---|
| `1025` | SMTP |
| `8025` | Web UI |

## Envío manual con el SDK de Resend

Si necesitas enviar correos fuera del contexto de Payload:

```bash
npm install resend
```

```ts
import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)

await resend.emails.send({
  from: 'Jeyjo <noreply@tudominio.com>',
  to: ['cliente@email.com'],
  subject: 'Confirmación de pedido',
  html: '<p>Tu pedido ha sido confirmado</p>',
})
```

## Enlaces útiles

- [Dashboard Resend](https://resend.com)
- [Mailpit](https://github.com/axllent/mailpit)
