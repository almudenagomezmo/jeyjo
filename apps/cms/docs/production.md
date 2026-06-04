# Producción (Vercel)

El proyecto está preparado para desplegarse en **Vercel**. El deploy es automático desde la rama `main`.

## Variables de entorno en Vercel

Añadir en **Project Settings > Environment Variables**:

| Variable | Valor |
|---|---|
| `DATABASE_URL` | `postgresql://...` (tu base de datos en producción) |
| `PAYLOAD_SECRET` | String aleatorio seguro |
| `NEXT_PUBLIC_SERVER_URL` | `https://tudominio.com` |
| `STRIPE_SECRET_KEY` | `sk_live_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` |
| `STRIPE_WEBHOOKS_SIGNING_SECRET` | `whsec_...` |
| `QDRANT_URL` | `https://tu-cluster.cloud.qdrant.io:6333` |
| `QDRANT_API_KEY` | API key de Qdrant Cloud |
| `SUPABASE_ENDPOINT` | `https://xxxx.supabase.co/storage/v1/s3` |
| `SUPABASE_ACCESS_KEY_ID` | S3 Access Key |
| `SUPABASE_SECRET_ACCESS_KEY` | S3 Secret Key |
| `SUPABASE_BUCKET` | `ecommerce-media` |
| `SUPABASE_REGION` | `us-east-1` |
| `PREVIEW_SECRET` | String para draft preview |

## Base de datos en producción

**Opción A — Supabase** (recomendado):
- Crear proyecto en [supabase.com](https://supabase.com)
- Usar la DATABASE_URL de la pestaña Connect
- Habilitar conexiones SSL

**Opción B — Neon / Railway / cualquier PostgreSQL**:
- Asegurar que acepta conexiones externas
- Configurar SSL si es necesario

## Post-deploy

Después del primer deploy:

```bash
# 1. Ejecutar migraciones pendientes
pnpm payload migrate

# 2. Seed de datos (opcional)
# POST https://tudominio.com/next/seed (con auth admin)
```

## Notas

- Vercel inyecta automáticamente `VERCEL_PROJECT_PRODUCTION_URL`
- El tamaño de memoria para el build está configurado a 8000 MB (`max-old-space-size=8000`)
- Las imágenes se sirven desde `/api/media/file/**`
- Stripe webhooks deben apuntar a `https://tudominio.com/api/payments/stripe/webhooks`
