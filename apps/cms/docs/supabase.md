# Supabase (Postgres + Storage)

## Postgres: coexistencia con Payload

Payload CMS usa el mismo proyecto Supabase vía `DATABASE_URL` (pooler en producción, `127.0.0.1:54322` en local con `pnpm db:start`).

Las tablas del **esquema núcleo Jeyjo** (`customers`, `web_profiles`, `search_events`, `audit_log`) se crean con migraciones en `supabase/migrations/` del monorepo — no las gestiona Payload. Ver [supabase/README.md](../../../supabase/README.md) y RNF-009 (RLS).

Orden recomendado en un entorno nuevo:

1. `pnpm db:reset` (migraciones Jeyjo)
2. Arrancar CMS (`pnpm dev:cms`) para que Payload cree/actualice sus colecciones template

## Storage (S3)

El plugin de S3 Storage se activa **automáticamente** cuando detecta credenciales reales en `.env`.

### Buckets (migración `20250604120004_storage_buckets.sql`)

| Bucket | Acceso | Uso |
|--------|--------|-----|
| `catalog-media` | Lectura pública | Imágenes de catálogo subidas en backoffice |
| `private-documents` | Privado (`service_role`) | PDFs facturas (cambio #37) |

Configura `SUPABASE_BUCKET=catalog-media` para alinear con la migración (el template histórico usaba `ecommerce-media`).

En Supabase:

1. Ve a **Storage > S3** y confirma el bucket `catalog-media` (creado por migración en local)
2. Genera **Access Keys** en el mismo panel
3. Variables de entorno:

```env
SUPABASE_BUCKET=catalog-media
SUPABASE_REGION=us-east-1
SUPABASE_ENDPOINT=https://xxxx.supabase.co/storage/v1/s3
SUPABASE_ACCESS_KEY_ID=tu_access_key_id
SUPABASE_SECRET_ACCESS_KEY=tu_secret_access_key
```

### Comportamiento del plugin

- Si las variables tienen **valores placeholder** (contienen `xxxx` o empiezan por `tu_`), el plugin **no se activa** y se usa almacenamiento **local** (`public/media/`).
- Si las variables son **reales**, el plugin `s3Storage` sube a Supabase.

| Estado | Almacenamiento |
|--------|----------------|
| Placeholder | Local (`public/media/`) |
| Configurado | Supabase S3 (`catalog-media`) |

## CORS

En Supabase, configura CORS para tu dominio:

```json
{
  "allowedOrigins": ["http://localhost:3000", "https://tudominio.com"],
  "allowedMethods": ["GET", "PUT", "DELETE"],
  "allowedHeaders": ["*"]
}
```

## Políticas Storage

Las políticas de `catalog-media` y `private-documents` están en la migración SQL del monorepo. No dupliques políticas manuales salvo entornos legacy con bucket `ecommerce-media`.
