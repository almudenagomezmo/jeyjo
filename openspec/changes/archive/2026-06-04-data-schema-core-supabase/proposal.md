## Why

Tras el monorepo (#1), Jeyjo necesita una base de datos PostgreSQL en Supabase con convenciones, tablas transversales y Row Level Security antes de colecciones Payload, auth de clientes o el worker de búsqueda. Sin este esquema núcleo, cada cambio posterior improvisaría migraciones, rompería el aislamiento multi-tenant (RNF-009) y no dimensionaría correctamente volúmenes y retención (RD-001).

## What Changes

- Inicializar proyecto **Supabase CLI** en el monorepo (`supabase/`: config, migraciones versionadas, seeds de desarrollo).
- Crear migraciones SQL para tablas **no gestionadas por Payload** en la fase inicial: `customers`, `web_profiles`, `search_events`, `audit_log` (append-only), enums y funciones auxiliares RLS.
- Definir convención de esquema/nombres y política de coexistencia con tablas que Payload creará en el mismo Postgres (`apps/cms` ya usa `DATABASE_URL` de Supabase).
- Activar **RLS** en todas las tablas con datos de cliente; políticas base por `auth.uid()` → `web_profiles` → `customer_id` (RNF-009).
- Configurar **Storage**: bucket público para media propia de catálogo y bucket privado para PDFs (políticas SQL documentadas; alineado con docs actuales de `apps/cms`).
- Paquete o módulo compartido de tipos TypeScript generados o mantenidos a mano para el storefront y workers (`Database` types).
- Scripts/documentación de aplicación de migraciones en local y CI (sin datos de producción).
- **No incluye:** colecciones Payload de negocio (producto, pedido, categorías ERP) — cambio #3; worker Qdrant — #13; tablas `documento_erp` — #37; sync ERP; pentest.

## Capabilities

### New Capabilities

- `supabase-project-bootstrap`: Estructura CLI, enlaces a proyecto remoto, variables de entorno documentadas, flujo `db reset` / `db push` en desarrollo.
- `core-tenant-tables`: Tablas `customers` y `web_profiles` con campos alineados al modelo CLIENTE/USUARIO_WEB (grupo, permisos JSON, validación pendiente).
- `row-level-security`: Políticas RLS, funciones `current_customer_id()` y roles (`authenticated`, `service_role`); denegación por defecto.
- `search-events-queue`: Tabla `search_events` (cola async RF-009) con estados, índices y retención acotada.
- `audit-log-immutable`: Tabla `audit_log` solo INSERT, sin UPDATE/DELETE para usuarios normales.
- `storage-buckets-core`: Buckets y políticas para media pública y documentos privados (URLs firmadas en cambios posteriores).

### Modified Capabilities

- _(ninguna — los documentos 01–06 en `openspec/specs/` permanecen como dominio; este cambio materializa la capa de datos descrita en `04-arquitectura-jeyjo.md`)_

## Impact

- Nuevo directorio `supabase/migrations/`, posible `packages/database-types` o `apps/storefront/src/lib/database.types.ts`.
- `apps/cms`: mismo `DATABASE_URL`; convención para no colisionar con prefijos Payload; sin nuevas colecciones de negocio aún.
- `apps/storefront`: preparado para Supabase Auth + cliente JS con tipos; sin UI de login en este cambio.
- Cumple **RD-001** (índices y tipos acordes a volúmenes 5k–30k productos vía índices en `search_events` y diseño de claves) y **RNF-009** (RLS obligatorio).
- Desbloquea cambios ROADMAP #3 (`payload-collections-bootstrap`), #13 (`search-events-qdrant-worker`), #16 (`auth-registration-area-cliente`).
