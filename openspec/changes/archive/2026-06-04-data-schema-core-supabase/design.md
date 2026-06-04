## Context

- **Estado actual:** `apps/cms` ya conecta a Supabase PostgreSQL vía `DATABASE_URL` (pooler) y opcionalmente Storage S3; no hay carpeta `supabase/` ni migraciones versionadas en el repo. Payload gestiona colecciones template (`users`, `pages`, `categories`, `media`). Qdrant se inicializa en `onInit` pero la cola `search_events` aún no existe en SQL.
- **Arquitectura objetivo** (`04-arquitectura-jeyjo.md`): un solo Postgres para datos enriquecidos, pedidos web, usuarios de tienda, logs y eventos; Auth de clientes en Supabase; backoffice en Payload Auth (tabla `users` de Payload, distinta de `web_profiles`).
- **Dependencia:** cambio #1 (`foundation-monorepo-design-system`) asumido aplicado o en curso.
- **Requisitos clave:** RNF-009 (RLS multi-tenant), RD-001 (volúmenes e índices), RF-009 (tabla de eventos para Qdrant).

## Goals / Non-Goals

**Goals:**

- Proyecto Supabase CLI en raíz del monorepo con migraciones reproducibles.
- Tablas núcleo: `customers`, `web_profiles`, `search_events`, `audit_log`.
- RLS y función `current_customer_id()` operativas para el rol `authenticated`.
- Buckets Storage `catalog-media` (público) y `private-documents` (privado).
- Tipos TypeScript exportables para storefront y workers.
- Documentación de variables y flujo local (`supabase start`, `db reset`).

**Non-Goals:**

- Colecciones Payload de catálogo/pedidos/ERP (cambio #3).
- Worker que consume `search_events` → Qdrant (cambio #13).
- UI de registro/login (cambio #16).
- Tabla `documento_erp` y PDFs firmados (cambio #37).
- Pentest y políticas WAF (RNF-010/012).
- Importación histórica de pedidos ERP.

## Decisions

### 1. Un solo Postgres, dos “propietarios” de tablas

**Decisión:** Misma instancia Supabase; tablas de este cambio en `public` con nombres explícitos (`customers`, `web_profiles`, …). Payload sigue creando sus tablas vía adapter (`products`, `orders`, etc. en cambio #3).

**Alternativa descartada:** Esquema separado `jeyjo` — añade fricción a joins y a RLS con Auth; se reserva si en #3 hay colisiones reales.

**Rationale:** `apps/cms` ya usa el pooler; duplicar BD rompería transacciones y coste.

### 2. `web_profiles.id` = `auth.users.id`

**Decisión:** PK de `web_profiles` es el UUID de Supabase Auth; trigger `on auth.user created` (o RPC en #16) crea fila enlazada a `customers`.

**Alternativa:** Tabla intermedia — rechazada por complejidad en JWT/RLS.

### 3. RLS por `current_customer_id()`

**Decisión:** Función `SECURITY DEFINER` estable que lee `web_profiles` por `auth.uid()`; políticas en `customers` usan `id = current_customer_id()`.

**Alternativa:** JWT custom claims con `customer_id` — posible optimización futura; no en v1.

### 4. `search_events` sin RLS estricto en v1

**Decisión:** Inserciones vía `service_role` desde Payload; lectura/actualización solo worker y backoffice con service role. Política `authenticated` denegada por defecto.

**Rationale:** Los eventos no son datos de cliente; evitan filtración de metadatos de catálogo entre tenants en cola global (worker procesa por `entity_id`).

### 5. `audit_log` append-only vía GRANT + RLS

**Decisión:** `INSERT` permitido a `service_role` y rol usado por Payload server; `UPDATE`/`DELETE` revocados para `authenticated`/`anon`.

### 6. Tipos TypeScript

**Decisión:** Generar con `supabase gen types typescript --local` → `packages/database-types/src/database.types.ts` (workspace package) consumido por storefront y scripts.

**Alternativa:** Tipos manuales — solo si CLI no está en CI inicialmente.

### 7. Storage bucket names

**Decisión:** `catalog-media` alineado con variable `SUPABASE_BUCKET` existente en cms; `private-documents` nuevo. Migración SQL en `supabase/migrations` + nota en `apps/cms/docs/supabase.md`.

### 8. Naming inglés en SQL, dominio español en UI

**Decisión:** Tablas/columnas en inglés snake_case (`customer_group`, `tax_id`) para consistencia con Payload y tooling; mapeo a términos ERP en capa de aplicación.

## Risks / Trade-offs

| Riesgo | Mitigación |
|--------|------------|
| Payload `db push` altera `public` y choca con migraciones | Orden: aplicar migraciones Supabase primero; documentar que Payload no debe `DROP` tablas core; revisar en #3 |
| RLS mal configurada bloquea desarrollo | Seed con usuarios de prueba; política temporal documentada solo en local si hace falta |
| Pooler vs direct connection en migraciones | Usar `supabase db push` / CLI; evitar DDL desde Payload en producción |
| `search_events` crece sin límite | Índice + job de archivo futuro (#30 dashboard); retención 90 días para `done` en script opcional |
| Auth trigger falla y deja usuario huérfano | Transacción en RPC de registro (#16); monitor en logs |

## Migration Plan

1. `supabase init` en raíz; añadir `supabase/` a `.gitignore` solo para `.branches` temporales, no migrations.
2. Migración `0001_extensions_enums.sql` — `pgcrypto`, enums `web_profile_role`, `search_event_status`.
3. Migración `0002_core_tables.sql` — `customers`, `web_profiles`, FKs, constraints RD-005.
4. Migración `0003_search_events_audit_log.sql`.
5. Migración `0004_rls_policies.sql` — enable RLS, funciones, policies.
6. Migración `0005_storage_buckets.sql` — insert buckets + policies.
7. `seed.sql` — 2 customers, 2 web_profiles (requiere usuarios Auth manuales o UUID fijos en local).
8. Documentar en README raíz: enlace a proyecto Supabase, `pnpm db:types`, variables en `.env.example` de storefront.
9. Verificar `pnpm dev:cms` arranca tras `db reset`.
10. **Rollback:** revertir migración en branch; en producción usar backup PITR Supabase (RD-003).

## Open Questions

1. ¿Nombre final del bucket público: mantener `ecommerce-media` del template cms o renombrar a `catalog-media`? (Alinear con ops antes de producción.)
2. ¿Trigger en `auth.users` en esta fase o solo RPC en #16? (Recomendación: RPC en #16, documentar hook SQL opcional en seed.)
3. ¿Paquete `packages/database-types` o ruta en `apps/storefront`? (Recomendación: package compartido en monorepo.)
