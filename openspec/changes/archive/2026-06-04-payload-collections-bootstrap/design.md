## Context

- **Estado actual:** `apps/cms` arranca con Payload 3.x, plugin e-commerce (Stripe, variantes, carritos), colecciones template (`users`, `pages`, `categories`, `media`) y SEO plugin básico. El modelo de producto usa `title`, `priceInUSD`, `gallery` y variantes — no campos ERP Jeyjo. Supabase (#2) ya expone `customers`, `web_profiles`, `search_events`, `audit_log` y bucket `catalog-media`.
- **Arquitectura objetivo:** Payload es la fuente de verdad del catálogo enriquecido y pedidos web; Avansuite aporta datos maestros vía adaptadores (#4). Los clientes de tienda viven en Supabase Auth + `web_profiles`; `users` de Payload es solo staff.
- **Dependencias:** cambios #1 (monorepo) y #2 (`data-schema-core-supabase`) aplicados o equivalentes en rama.
- **Requisitos clave:** RF-024 (estructura PIM/SEO e imagen dual), US-16 CA1–CA2, integración con cola `search_events` (RF-009 preparación).

## Goals / Non-Goals

**Goals:**

- Colecciones Payload `products`, `categories`, `suppliers`, `orders` alineadas al ERD de `04-arquitectura-jeyjo.md`.
- Separación visual y de access entre campos **ERP (read-only)** y **enriquecimiento (editable)** en admin.
- Hooks que escriben en `search_events` y `audit_log` usando service role / SQL directo.
- Seed reproducible para desarrollo local y tests de integración.
- Plugin e-commerce recortado: pedidos y productos sin Stripe obligatorio ni variantes USD.

**Non-Goals:**

- Sync ERP bidireccional (#4, #7).
- MFA, roles por módulo y audit UI (#5).
- Generador SEO masivo y auditor (#21).
- Worker Qdrant (#13).
- Storefront `(app)` dentro de cms — puede quedar pero no se mantiene.
- Stock multisource (#8) — campo `stock` stub o relación futura.

## Decisions

### 1. Mantener plugin e-commerce con overrides, no reimplementar Orders desde cero

**Decisión:** Usar `@payloadcms/plugin-ecommerce` con `productsCollectionOverride` y `ordersCollectionOverride` extendidos; desactivar `payments` (Stripe) y `enableVariants` por defecto.

**Alternativa descartada:** Colección Orders custom sin plugin — duplica líneas, carritos y tipos ya probados en template.

**Rationale:** Menor diff inicial; carritos del plugin pueden servir en #12; pagos se sustituyen en #18.

### 2. Tabla `suppliers` como colección Payload propia

**Decisión:** Nueva colección `suppliers` con `erpCode`, `name`, `type`, `baseImageUrl`; relación `products.supplier`.

**Alternativa:** Enum embebido en producto — insuficiente para Distrisantiago/Arnoia y URLs base.

### 3. Campos ERP en grupo admin read-only

**Decisión:** Tab `Datos ERP` con `skuErp`, `mainWholesaleRef`, `oemRef`, `ean`, `shortDescription` (desde ERP), `p1Price`, `p2Price`, `vatRate`, `packUnit`, `isWildcard`, `allowOrderWithoutStock`, `syncErpAt`; `access.update` deniega mutación salvo `syncErpAt` vía hook futuro (#4).

**Alternativa:** Tabla SQL separada — complica joins en Payload API.

### 4. Enriquecimiento y SEO en tab `Marketing / SEO`

**Decisión:** `longDescription` (richText/HTML), `metaDescription` (max 160 + contador UI), `keywords` (array/text), `slug` con `slugField` + hook autogeneración desde `title`/`name` si vacío; plugin SEO `meta` tab conservado para preview.

**Imagen dual:** `providerImageUrl` (text, URL externa) + `ownImage` (upload → `media` → Supabase `catalog-media`). Campo calculado/helper `displayImageUrl` en capa API futura (#11); en admin documentar prioridad propia > proveedor.

### 5. Categories: árbol con `parent` self-relationship

**Decisión:** Extender colección `categories` existente con `parent`, `sortOrder`, `imageUrl`; mantener slug único.

**Alternativa:** Colección nueva `category_tree` — rompe template y Qdrant config existente.

### 6. Orders: campos Jeyjo en override

**Decisión:** Añadir `orderNumber`, `origin` (select: `b2c`, `b2b`, `eva`), `status` (workflow Jeyjo), `customerRef` (text/uuid referencia lógica a `customers.id` hasta relación formal en #16), `validatedEva`, totales; líneas con `ivaRateSnapshot` preparado.

**Alternativa:** Solo Supabase para pedidos — contradice arquitectura MOD-02.

### 7. Hooks hacia Supabase vía módulo `src/lib/supabase-server.ts`

**Decisión:** Cliente Supabase con `SUPABASE_SERVICE_ROLE_KEY` en server-only; funciones `enqueueSearchEvent()` e `writeAuditLog()` insertan en tablas #2. Payload hooks llaman tras commit exitoso (`afterChange`, `afterDelete`).

**Alternativa:** pg_notify — no trazable en app layer.

**Payload search event shape:** `{ entity_type: 'producto'|'categoria', entity_id, action: 'create'|'update'|'delete', payload: json }`.

### 8. Access control v1: admin-only en negocio

**Decisión:** Reutilizar `isAdmin` / `adminOnly` en products, categories, suppliers, orders; API REST pública de catálogo será read-only filtrada en cambios storefront (#10+).

**Alternativa:** RLS en tablas Payload — Payload no soporta RLS nativo; capa API en #10.

### 9. IDs: mantener serial integer de Payload en v1

**Decisión:** No migrar a UUID en este cambio; `entity_id` en `search_events` almacena string del id Payload.

**Alternativa:** UUID custom — breaking con template; evaluar si ERP exige UUID en #4.

### 10. Migraciones Payload en local vs CI

**Decisión:** `push: true` o `payload migrate` documentado en dev; CI usa `DATABASE_URL` de test y `push` en job cms o skip build DB con gate existente (#1).

## Risks / Trade-offs

| Riesgo | Mitigación |
|--------|------------|
| Plugin e-commerce crea tablas no usadas (carts, variants) | No eliminar aún; ocultar en admin; limpieza opcional post-#12 |
| Colisión nombres tablas Payload vs Supabase | Respetar convención #2; no crear `customers` desde Payload |
| Hooks fallan y bloquean save | try/catch + log; no revertir transacción Payload; dead-letter log |
| Stripe env ausente rompe build | Quitar `stripeAdapter` obligatorio; payments array vacío |
| Slug duplicado | unique index + validación beforeValidate con mensaje en español |
| Doble fuente clientes (`users` vs `web_profiles`) | Documentar; deshabilitar registro público en `users`; #16 conecta storefront |

## Migration Plan

1. Añadir colección `Suppliers`; extender `Categories` y `ProductsCollection`.
2. Actualizar `plugins/index.ts`: ecommerce sin Stripe, orders override.
3. Implementar `supabase-server` + hooks en colecciones catálogo.
4. Actualizar seed endpoint con datos Jeyjo mínimos.
5. Ejecutar `pnpm --filter cms dev` → verificar tablas y admin en español parcial.
6. Test integración: crear producto → fila en `search_events` + `audit_log`.
7. Documentar en `apps/cms/README.md` y `docs/local-development.md`.
8. **Rollback:** revertir branch; drop tablas Payload nuevas en dev con `db reset` Supabase + Payload push limpio.

## Open Questions

1. ¿Renombrar colección `products` → mantener slug inglés (Payload convention) con labels ES en admin? (**Recomendación:** sí, slugs en inglés.)
2. ¿Stock como campo numérico stub en producto o colección `stock` separada desde ya? (**Recomendación:** stub `erpStock` read-only en producto; colección Stock en #8.)
3. ¿Eliminar rutas `(app)` storefront del cms en este cambio? (**Recomendación:** no; marcar deprecated en README.)
