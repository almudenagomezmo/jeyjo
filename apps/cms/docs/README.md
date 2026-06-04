# Jeyjo — Documentación

Ecommerce template basado en **Next.js 16 + Payload CMS 3.84**.

## Índice

| Documento | Descripción |
|---|---|
| [Local Development](local-development.md) | Arrancar el proyecto en local |
| [Production](production.md) | Despliegue en Vercel |
| [Supabase](supabase.md) | Configuración de almacenamiento S3 |
| [Qdrant](qdrant.md) | Base de datos vectorial |
| [Stripe](stripe.md) | Pasarela de pago |
| [Seed](seed.md) | Poblar la base de datos con datos de demo |
| [Testing](testing.md) | Tests de integración y E2E |
| [Commands](commands.md) | Resumen rápido de comandos |
| [Resend / Mailpit](resend.md) | Envío de correos con Resend y Mailpit |

## Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4, shadcn/ui
- **CMS**: Payload 3.84 (PostgreSQL)
- **Base de datos**: PostgreSQL 16 (Docker o Supabase)
- **Vector DB**: Qdrant (Docker o Cloud)
- **Pagos**: Stripe
- **Almacenamiento**: Local (dev) / Supabase S3 (prod)
- **Tests**: Vitest (unit/int) + Playwright (E2E)
