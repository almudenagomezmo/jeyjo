## Context

- **Estado actual (#48):** `/admin/customers` lista y muestra ficha read-only. Solo pendientes tienen botón **Validar** → `POST /next/customers/:id/validate` → `validateCustomer()` actualiza `customer_group`, `validated_at` y todos los `web_profiles.role` vía `roleForCustomerGroup()`.
- **Acceso validar:** `canValidateCustomers(user)` (`superadmin` | `administracion`) + `hasValidMfaSession`.
- **Storefront:** `isB2bValidated()` usa `validated_at` + `customer_group` 2–4; permisos usan `web_profiles.role` (`b2b_superadmin` → finance implícito).
- **Gap ROADMAP:** cambio de grupo post-validación fuera de #48.

## Goals / Non-Goals

**Goals:**

- Permitir al staff corregir `customer_group` y `web_profiles.role` en clientes **ya validados**.
- Mismos requisitos de acceso que validar (roles + MFA).
- Validación server-side de combinaciones grupo/rol; auditoría completa.
- UX clara: modal con impacto antes de guardar.

**Non-Goals:**

- Editar `permissions` jsonb de subusuarios.
- Crear/eliminar subusuarios desde CMS.
- Cambiar `validated_at`, `erp_code`, datos de registro.
- Email al cliente tras reclasificar.
- Reclasificar pendientes (siguen usando **Validar**).

## Decisions

### 1. Endpoint separado `PATCH /next/customers/:id/reclassify`

**Decisión:** Nuevo endpoint y servicio `reclassifyCustomer()`; no ampliar `validate`.

**Alternativa descartada:** Reutilizar POST validate — mezcla semánticas (fijar `validated_at` vs corrección post-validación) y complica idempotencia.

**Body:**

```json
{
  "customerGroup": 2,
  "profileRoles": [
    { "profileId": "uuid", "role": "b2b_superadmin" }
  ]
}
```

- `customerGroup` obligatorio (1–4).
- `profileRoles` obligatorio si hay perfiles; una entrada por perfil mostrado en ficha (permite rol distinto por fila).

### 2. Renombrar guard de acceso a `canManageCustomers`

**Decisión:** Extraer `canManageCustomers()` en `access/customerValidation.ts` (alias de la lógica actual) usado por validate **y** reclassify. `canValidateCustomers` delega en él para no romper imports.

**Rationale:** Un solo punto de verdad para permisos staff sobre clientes tienda.

### 3. Reglas de coherencia grupo ↔ rol (server-side)

**Decisión:** Validar en servicio antes de persistir:

| Regla | Comportamiento |
|-------|----------------|
| Cliente debe tener `validated_at` NOT NULL | 409 si pendiente → usar Validar |
| `customerGroup` ∈ 1..4 | 400 si inválido |
| Rol ∈ `b2c`, `b2b_superadmin`, `b2b_subuser`, `pending` | 400 si inválido |
| Grupo 1 (B2C) | Titular (`b2b_superadmin` / primer perfil) solo `b2c`; rechazar `b2b_superadmin` en titular |
| Grupos 2–4 (B2B) | Titular no puede ser `b2c` ni `pending`; subusuarios solo `b2b_subuser` |
| Bajar B2B→B2C (grupo 2–4 → 1) | Permitido; titular → `b2c`; subusuarios existentes → rechazar 409 con mensaje "Desactivar subusuarios antes de reclasificar a B2C" **o** auto-desactivar `is_active=false` en subusuarios |

**Alternativa descartada:** UI sincroniza rol automáticamente sin permitir override — el usuario pidió editar ambos explícitamente; server valida incoherencias.

**v1 simplificación subusuarios al bajar a B2C:** Si existen `b2b_subuser` activos, rechazar reclasificación a grupo 1 (409). Staff debe desactivarlos desde storefront mi-cuenta o follow-up.

### 4. `validated_at` no se modifica en reclasificar

**Decisión:** Reclassify solo toca `customer_group` y `web_profiles.role`. `validated_at` permanece.

**Rationale:** Separación clara validación inicial vs corrección administrativa.

### 5. UI en ficha detalle

**Decisión:**

- Botón **Reclasificar** visible solo si `validated_at` NOT NULL **y** staff tiene `canManageCustomers` + MFA (misma comprobación que Validar; UI puede asumir que staff autorizado ya pasó MFA al entrar al admin).
- Modal: selector grupo (reutilizar `CUSTOMER_GROUP_OPTIONS`) + tabla perfiles con `<select role>` por fila.
- Texto de impacto dinámico: "Acceso intranet", "Precios P2", "Contabilidad" según grupo destino.
- Tras éxito: recargar detalle y lista.

**Alternativa descartada:** Inline edit en ficha — más riesgo de cambios accidentales.

### 6. Auditoría

**Decisión:** `audit_log` acción `CUSTOMER_RECLASSIFIED` con `previousValue` / `metadata`: `customer_group`, `profiles: [{ id, role }]`.

### 7. Sin email en reclasificar

**Decisión:** Silencioso (corrección interna). Validar sigue enviando email de aprobación.

## Risks / Trade-offs

- **[Subusuarios bloquean B2C downgrade]** → 409 claro; documentar en modal.
- **[Rol desincronizado por error humano]** → Validación server-side + copy de impacto en modal.
- **[Storefront cache sesión]** → Cliente debe re-login o refrescar para ver nuevo redirect; aceptable v1.
- **[RLS Supabase]** → Updates vía service role en CMS (igual que validate); sin cambio RLS.

## Migration Plan

- Despliegue CMS-only; sin migraciones SQL.
- Rollback: revertir PR; acción Reclasificar desaparece; datos ya reclasificados permanecen (corregir manualmente si necesario).

## Open Questions

- ¿Follow-up para desactivar subusuarios desde CMS al bajar a B2C? → **Fuera v1**; 409 es suficiente.
- ¿Mostrar advertencia si `role` no coincide con `roleForCustomerGroup(group)` pero combinación es legal? → **Sí**, warning no bloqueante en modal (p. ej. grupo 2 + rol coherente sugerido).
