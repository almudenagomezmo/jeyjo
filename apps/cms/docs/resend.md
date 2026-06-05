# Resend (Email)

Configuración de envío de correos mediante **Resend** en producción y **Mailpit** en desarrollo.

## Interruptor local: `USE_MAILPIT`

En `apps/cms/.env` y `apps/storefront/.env`:

```env
USE_MAILPIT=true   # desarrollo → Mailpit
USE_MAILPIT=false  # prueba Resend / Supabase SMTP real
```

| `USE_MAILPIT` | CMS (Payload) | Registro storefront |
|---------------|---------------|---------------------|
| `true` | SMTP → `localhost:1025` | Enlace confirmación → Mailpit |
| `false` + `RESEND_API_KEY` | SMTP → Resend | Supabase Auth SMTP |
| `false` sin API key | `jsonTransport` (log) | Supabase Auth SMTP |

Levantar Mailpit:

```bash
pnpm mailpit:up    # desde la raíz del monorepo
```

UI: `http://localhost:8025`

Variables opcionales:

| Variable | Defecto |
|----------|---------|
| `MAILPIT_SMTP_HOST` | `localhost` |
| `MAILPIT_SMTP_PORT` | `1025` |
| `MAILPIT_WEB_URL` | `http://localhost:8025` |

Variables legacy (siguen funcionando): `SMTP_USE_MAILPIT`, `SMTP_USE_RESEND`.

## Credenciales SMTP (Resend)

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
- [CONFIGURACION.md](../../../CONFIGURACION.md) — guía completa del monorepo
