# Supabase Storage (S3)

El plugin de S3 Storage se activa **automáticamente** cuando detects credenciales reales en `.env`.

## Configuración

En Supabase:

1. Ve a **Storage > S3** y crea un bucket (ej. `ecommerce-media`)
2. Genera unas **Access Keys** en el mismo panel
3. Configura las variables de entorno:

```env
SUPABASE_BUCKET=ecommerce-media
SUPABASE_REGION=us-east-1
SUPABASE_ENDPOINT=https://xxxx.supabase.co/storage/v1/s3
SUPABASE_ACCESS_KEY_ID=tu_access_key_id
SUPABASE_SECRET_ACCESS_KEY=tu_secret_access_key
```

## Comportamiento

- Si las variables tienen **valores placeholder** (contienen `xxxx` o empiezan por `tu_`), el plugin **no se activa** y se usa almacenamiento **local** (`public/media/`).
- Si las variables son **reales**, el plugin de `s3Storage` se añade automáticamente y las subidas van a Supabase.

| Estado | Almacenamiento |
|---|---|
| Placeholder | Local (`public/media/`) |
| Configurado | Supabase S3 |

## CORS

En Supabase, configura CORS para tu dominio:

```json
{
  "allowedOrigins": ["http://localhost:3000", "https://tudominio.com"],
  "allowedMethods": ["GET", "PUT", "DELETE"],
  "allowedHeaders": ["*"]
}
```

## Política de seguridad (RLS)

Para que el bucket sea público:

```sql
CREATE POLICY "Public Access"
ON storage.objects FOR ALL
USING (bucket_id = 'ecommerce-media')
WITH CHECK (bucket_id = 'ecommerce-media');
```
