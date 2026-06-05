# Guía de configuración — Jeyjo

Checklist de qué configurar, **dónde** (dashboard vs archivos `.env`) y para qué sirve cada cosa.

| App | Puerto dev | Archivo de entorno |
|-----|------------|-------------------|
| Storefront (`apps/storefront`) | 3000 | `.env` y/o `.env.local` |
| CMS Payload (`apps/cms`) | 3001 | `.env` |

Plantillas de referencia: `apps/storefront/.env.example` y `apps/cms/.env.example`.

---

## 0. Mailpit en local (interruptor rápido)

Para capturar **todos** los correos en desarrollo sin Resend ni SMTP de Supabase:

```bash
pnpm mailpit:up    # levanta Mailpit (SMTP :1025, UI :8025)
```

En **`apps/storefront/.env`** y **`apps/cms/.env`** (misma variable en ambos):

```env
USE_MAILPIT=true
```

| Valor | Comportamiento |
|-------|----------------|
| `USE_MAILPIT=true` | CMS → Mailpit. Registro `/registro` → enlace de confirmación a Mailpit (no usa SMTP de Supabase). |
| `USE_MAILPIT=false` | CMS → Resend si hay `RESEND_API_KEY`. Registro → email vía Supabase Auth (SMTP del dashboard). |

Por defecto en `NODE_ENV=development`, si no defines la variable, Mailpit está **activo**.

Abre los correos en: **http://localhost:8025**

Para probar Resend en local: `USE_MAILPIT=false` y `RESEND_API_KEY` configurada (dominio verificado).

---

## 1. Supabase Cloud (dashboard)

Proyecto habitual: [supabase.com/dashboard](https://supabase.com/dashboard) → tu proyecto → **Settings**.

### 1.1 API Keys

**Ruta:** Settings → **API**

| Clave | Dónde usarla | Notas |
|-------|--------------|-------|
| Project URL (`https://<ref>.supabase.co`) | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_URL` | Storefront + CMS |
| `anon` `public` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Solo storefront (cliente) |
| `service_role` `secret` | `SUPABASE_SERVICE_ROLE_KEY` | **Solo servidor** (CMS + APIs storefront). Nunca en el navegador |

### 1.2 Base de datos (Postgres)

**Ruta:** Settings → **Database** → Connection string → **Session pooler** (IPv4)

| Variable | Archivo | Valor |
|----------|---------|-------|
| `DATABASE_URL` | `apps/cms/.env` | `postgresql://postgres.<ref>:<password>@aws-0-....pooler.supabase.com:5432/postgres?...` |

Payload CMS y las tablas núcleo (`customers`, `web_profiles`, …) comparten este Postgres.

**Migraciones** (desde la raíz del monorepo, no en el dashboard):

```bash
npx supabase login
npx supabase link --project-ref <tu-project-ref>
pnpm db:push          # aplica supabase/migrations/
pnpm db:bootstrap     # seed + catálogo demo
```

Detalle: [supabase/README.md](supabase/README.md).

### 1.3 Authentication — registro e inicio de sesión

**Ruta:** Authentication → **Providers** → Email

| Opción | Desarrollo | Producción |
|--------|------------|------------|
| Enable Email provider | Sí | Sí |
| Confirm email | Desactivar si no tienes SMTP listo | Activar |
| Secure email change | Opcional | Recomendado |

**Ruta:** Authentication → **URL Configuration**

| Campo | Desarrollo | Producción |
|-------|------------|------------|
| Site URL | `http://localhost:3000` | `https://tudominio.com` |
| Redirect URLs | `http://localhost:3000/**` | `https://tudominio.com/**` |

Sin esto, los enlaces de confirmación y recuperación de contraseña fallan o redirigen mal.

### 1.4 Authentication — SMTP (emails de confirmación)

**Con `USE_MAILPIT=true`:** el registro en `/registro` **no** usa el SMTP de Supabase; el enlace de confirmación se envía a Mailpit. Puedes ignorar esta sección en desarrollo local.

**Con `USE_MAILPIT=false`:** el registro usa `signUp()` de Supabase Auth y el correo lo envía **Supabase**, no el CMS.

**Ruta:** Authentication → **SMTP Settings**

| Campo | Valor (con Resend) |
|-------|-------------------|
| Enable custom SMTP | Sí |
| Host | `smtp.resend.com` |
| Port | `587` (TLS) o `465` (SSL) |
| Username | `resend` |
| Password | API key de Resend (`re_…`) |
| Sender email | `@tudominio.com` **verificado en Resend** |
| Sender name | `Jeyjo` |

**Requisito Resend:** el dominio del remitente (p. ej. `jeyjo.com`) debe estar **Verified** en [resend.com/domains](https://resend.com/domains). Si no, verás *"Error sending confirmation email"* al registrarte.

**Atajo en desarrollo:** desactiva **Confirm email** en Providers → Email (apartado 1.3).

### 1.5 Storage (S3) — imágenes de catálogo

**Ruta:** Storage → **S3** → Access Keys

Los buckets `catalog-media` y `private-documents` se crean con la migración `20250604120004_storage_buckets.sql`.

| Variable | Archivo | Uso |
|----------|---------|-----|
| `SUPABASE_BUCKET` | `apps/cms/.env` | `catalog-media` |
| `SUPABASE_REGION` | `apps/cms/.env` | p. ej. `us-east-1` |
| `SUPABASE_ENDPOINT` | `apps/cms/.env` | `https://<ref>.supabase.co/storage/v1/s3` |
| `SUPABASE_ACCESS_KEY_ID` | `apps/cms/.env` | Clave generada en Storage → S3 |
| `SUPABASE_SECRET_ACCESS_KEY` | `apps/cms/.env` | Secreto de la misma clave |

Si las variables son placeholders (`xxxx`, `tu_…`), el CMS guarda medios en `public/media/` en local.

**CORS** (Storage): permite orígenes `http://localhost:3000` y tu dominio de producción. Ver [apps/cms/docs/supabase.md](apps/cms/docs/supabase.md).

### 1.6 Rate limits (opcional)

**Ruta:** Authentication → **Rate Limits**

Tras activar SMTP propio, sube los límites de email si haces muchas pruebas de registro en desarrollo.

---

## 2. Resend (proveedor de email)

Resend interviene en **dos sitios distintos**:

| Uso | Dónde se configura | Variables / ajustes |
|-----|-------------------|---------------------|
| Confirmación de registro, reset password | **Supabase Dashboard** → SMTP Settings | API key como password SMTP |
| Pedidos, notificaciones B2B, MFA staff, carrito abandonado | **`apps/cms/.env`** | `RESEND_*` |

### 2.1 Dashboard Resend

1. [resend.com](https://resend.com) → **Domains** → añadir y verificar tu dominio (DNS SPF/DKIM).
2. **API Keys** → crear clave `re_…`.

### 2.2 Variables en CMS (`apps/cms/.env`)

| Variable | Descripción |
|----------|-------------|
| `RESEND_API_KEY` | API key |
| `RESEND_SMTP_HOST` | `smtp.resend.com` |
| `RESEND_SMTP_PORT` | `587` (recomendado) o `465` |
| `RESEND_FROM_EMAIL` | `noreply@tudominio.com` (dominio verificado) |
| `RESEND_FROM_NAME` | `Jeyjo` |

**Desarrollo sin Resend:** levanta Mailpit y el CMS enviará ahí los correos transaccionales:

```bash
docker compose -f apps/cms/docker/docker-compose.yml up -d mailpit
```

UI: `http://localhost:8025` · SMTP: `localhost:1025`

Detalle: [apps/cms/docs/resend.md](apps/cms/docs/resend.md).

---

## 3. Storefront (`apps/storefront`)

Archivos: `.env` (base del equipo) y `.env.local` (overrides locales, no commitear). Next.js fusiona ambos; `.env.local` gana.

### 3.1 Imprescindible para registro / login

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Sí | URL del proyecto (`https://<ref>.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí | Clave pública anon |
| `SUPABASE_SERVICE_ROLE_KEY` | Sí | Crear `customers` + `web_profiles` en `/api/auth/register` |
| `NEXT_PUBLIC_SITE_URL` | Recomendada | `http://localhost:3000` |

**No uses** URLs del dashboard (`supabase.com/dashboard/...`) ni `127.0.0.1:54321` si trabajas con **Supabase Cloud**.

### 3.2 Catálogo y CMS

| Variable | Cuándo | Descripción |
|----------|--------|-------------|
| `CMS_INTERNAL_URL` | Catálogo real | `http://localhost:3001` (server-only) |
| `NEXT_PUBLIC_PAYLOAD_URL` | Opcional | URL pública del CMS para el cliente |
| `STOREFRONT_PAYLOAD_API_KEY` | Checkout, presupuestos, cupones | **Mismo valor** que en `apps/cms/.env` |

### 3.3 Búsqueda predictiva (opcional)

| Variable | Descripción |
|----------|-------------|
| `QDRANT_URL` | `http://localhost:6333` (Docker) |
| `PREDICTIVE_SEARCH_ENABLED` | `true` / `false` |

### 3.4 Pagos, marketing, analytics (opcional)

Activar según fase del proyecto. Ver comentarios en `apps/storefront/.env.example`:

- `PAYMENTS_ENABLED`, Redsys, PayPal
- `MARKETING_COUPONS_ENABLED`, `CART_RECOVER_SECRET`
- `NEXT_PUBLIC_GA4_*`
- `NEWSLETTER_INTERNAL_SECRET` (compartido con CMS)

---

## 4. CMS Payload (`apps/cms`)

### 4.1 Imprescindible para arrancar

| Variable | Descripción |
|----------|-------------|
| `PAYLOAD_SECRET` | Secreto largo aleatorio |
| `DATABASE_URL` | Pooler Supabase (apartado 1.2) |
| `PAYLOAD_PUBLIC_SERVER_URL` | `http://localhost:3001` |
| `NEXT_PUBLIC_SERVER_URL` | `http://localhost:3001` |

### 4.2 Supabase (servidor)

| Variable | Uso |
|----------|-----|
| `SUPABASE_URL` | Hooks `audit_log`, `search_events`, consola auditoría |
| `SUPABASE_SERVICE_ROLE_KEY` | Escritura server-side en tablas núcleo |

### 4.3 Storage S3

Ver apartado 1.5.

### 4.4 Secretos compartidos con el storefront

Deben coincidir en **ambos** `.env`:

| Variable | Para qué |
|----------|----------|
| `STOREFRONT_PAYLOAD_API_KEY` | Storefront → `POST /api/orders`, presupuestos, cupones, intranet |
| `NEWSLETTER_INTERNAL_SECRET` | Sync newsletter CMS ↔ storefront |
| `EVA_CONTEXT_JWT_SECRET` | Widget EVA/SKAI |
| `CART_RECOVER_SECRET` | Enlaces de recuperación de carrito abandonado |
| `CRON_SECRET` | Proteger rutas cron (CMS y storefront) |

### 4.5 Stripe (opcional)

| Variable | Dónde obtenerla |
|----------|-----------------|
| `STRIPE_SECRET_KEY` | [dashboard.stripe.com](https://dashboard.stripe.com) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Mismo panel |
| `STRIPE_WEBHOOKS_SIGNING_SECRET` | Webhooks en Stripe |

Detalle: [apps/cms/docs/stripe.md](apps/cms/docs/stripe.md).

### 4.6 Qdrant (opcional)

```bash
docker compose -f apps/cms/docker/docker-compose.yml up -d qdrant
```

| Variable | Valor |
|----------|-------|
| `QDRANT_URL` | `http://localhost:6333` |

Detalle: [apps/cms/docs/qdrant.md](apps/cms/docs/qdrant.md).

### 4.7 Configuración operativa en Payload (sin `.env`)

Muchos parámetros de negocio se editan en el admin sin redeploy:

| Ruta admin | Contenido |
|------------|-----------|
| `/admin/system-config` | Hub de configuración |
| Global `systemSettings` | Portes, umbrales stock, contacto |
| Global `paymentSettings` | Métodos de pago B2C |
| Global `skaiSettings` | Widget EVA |

El storefront los lee vía `GET /api/system/config` del CMS.

---

## 5. Servicios Docker locales (opcionales)

```bash
docker compose -f apps/cms/docker/docker-compose.yml up -d
```

| Servicio | Puertos | Uso |
|----------|---------|-----|
| PostgreSQL | 5432 | Solo si **no** usas Supabase Cloud para Payload |
| Qdrant | 6333, 6334 | Búsqueda vectorial |
| Mailpit | 1025 (SMTP), 8025 (UI) | Captura emails del CMS en dev |

**No ejecutes** `pnpm db:start` si ya usas Supabase Cloud: levanta un stack local innecesario.

---

## 6. Checklist — primer arranque (Supabase Cloud)

- [ ] Crear proyecto en Supabase Cloud
- [ ] `npx supabase link` + `pnpm db:push` + `pnpm db:bootstrap`
- [ ] Copiar API keys a `apps/storefront/.env` (o `.env.local`)
- [ ] Copiar `DATABASE_URL` (pooler) y `SUPABASE_SERVICE_ROLE_KEY` a `apps/cms/.env`
- [ ] Configurar **URL Configuration** en Supabase Auth (`localhost:3000`)
- [ ] Elegir estrategia de email de registro:
  - [ ] SMTP Resend en Supabase + dominio verificado, **o**
  - [ ] Desactivar **Confirm email** en dev
- [ ] (Opcional) Storage S3 keys en CMS para subir imágenes a `catalog-media`
- [ ] (Opcional) Mailpit para emails transaccionales del CMS
- [ ] Generar y alinear `STOREFRONT_PAYLOAD_API_KEY` en ambas apps
- [ ] `pnpm dev:cms` → `http://localhost:3001/admin`
- [ ] `pnpm dev:storefront` → `http://localhost:3000`
- [ ] Probar registro en `/registro` e inicio de sesión

---

## 7. Errores frecuentes

| Mensaje | Causa habitual | Solución |
|---------|----------------|----------|
| `fetch failed` / timeout | URL Supabase incorrecta o apuntando a local | Usar `https://<ref>.supabase.co` |
| `Invalid API key` | Clave vacía, placeholder o URL del dashboard | Settings → API en Supabase |
| `Auth not configured` | Variables comentadas o en archivo equivocado | Revisar `.env` / `.env.local` del storefront |
| `Error sending confirmation email` | Dominio no verificado en Resend o SMTP mal en Supabase | Apartados 1.4 y 2.1 |
| `email rate limit exceeded` | Muchos registros de prueba | Esperar o subir rate limits / desactivar confirm email |
| `Perfil de cliente no encontrado` | Migraciones pendientes | `pnpm db:push` |
| `relation "customers" does not exist` | Migraciones no aplicadas | `pnpm db:push` |
| Imágenes no suben al cloud | Placeholders en `SUPABASE_*` storage | Generar S3 access keys (apartado 1.5) |

---

## 8. Referencias

| Documento | Contenido |
|-----------|-----------|
| [README.md](README.md) | Inicio rápido del monorepo |
| [supabase/README.md](supabase/README.md) | Migraciones, RLS, seed |
| [apps/cms/docs/supabase.md](apps/cms/docs/supabase.md) | Storage S3 y CORS |
| [apps/cms/docs/resend.md](apps/cms/docs/resend.md) | Email transaccional CMS |
| [apps/cms/docs/local-development.md](apps/cms/docs/local-development.md) | Docker y dev CMS |
| [apps/storefront/.env.example](apps/storefront/.env.example) | Todas las variables tienda |
| [apps/cms/.env.example](apps/cms/.env.example) | Todas las variables CMS |
